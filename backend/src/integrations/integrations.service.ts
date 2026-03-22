import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, MoreThan } from 'typeorm';
import * as crypto from 'crypto';
import { Webhook } from './entities/webhook.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { EventLog } from './entities/event-log.entity';
import { Asset } from './entities/asset.entity';
import { TrashItem } from './entities/trash-item.entity';
import { ContentItem } from '../content/entities/content-item.entity';
import { ContentVersion } from '../content/entities/content-version.entity';
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  CreateAssetDto,
  UpdateAssetDto,
  BatchUpdateStatusDto,
  BatchUpdateLocaleDto,
  BatchMoveDto,
  BatchDeleteDto,
} from './dto/integrations.dto';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepo: Repository<Webhook>,
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepo: Repository<WebhookDelivery>,
    @InjectRepository(EventLog)
    private readonly eventRepo: Repository<EventLog>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(TrashItem)
    private readonly trashRepo: Repository<TrashItem>,
    @InjectRepository(ContentItem)
    private readonly contentRepo: Repository<ContentItem>,
    @InjectRepository(ContentVersion)
    private readonly versionRepo: Repository<ContentVersion>,
  ) {}

  // ===== Webhooks =====
  async createWebhook(orgId: string, userId: string, dto: CreateWebhookDto) {
    const wh = this.webhookRepo.create({
      organizationId: orgId,
      name: dto.name,
      url: dto.url,
      secret: dto.secret || '',
      events: dto.events,
      createdBy: userId,
    });
    return this.webhookRepo.save(wh);
  }

  async findWebhooks(orgId: string) {
    return this.webhookRepo.find({
      where: { organizationId: orgId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateWebhook(orgId: string, id: string, dto: UpdateWebhookDto) {
    const wh = await this.webhookRepo.findOne({ where: { id, organizationId: orgId } });
    if (!wh) throw new NotFoundException('Webhook not found');
    if (dto.name !== undefined) wh.name = dto.name;
    if (dto.url !== undefined) wh.url = dto.url;
    if (dto.secret !== undefined) wh.secret = dto.secret;
    if (dto.events !== undefined) wh.events = dto.events;
    if (dto.isActive !== undefined) wh.isActive = dto.isActive;
    return this.webhookRepo.save(wh);
  }

  async removeWebhook(orgId: string, id: string) {
    const wh = await this.webhookRepo.findOne({ where: { id, organizationId: orgId } });
    if (!wh) throw new NotFoundException('Webhook not found');
    await this.webhookRepo.remove(wh);
    return { deleted: true };
  }

  async triggerWebhooks(orgId: string, event: string, payload: Record<string, unknown>) {
    const webhooks = await this.webhookRepo.find({
      where: { organizationId: orgId, isActive: true },
    });

    const matching = webhooks.filter((wh) => wh.events.includes(event));

    for (const wh of matching) {
      const delivery = this.deliveryRepo.create({
        webhookId: wh.id,
        event,
        payload,
      });

      const start = Date.now();
      try {
        const body = JSON.stringify(payload);
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        if (wh.secret) {
          const signature = crypto.createHmac('sha256', wh.secret).update(body).digest('hex');
          headers['X-DocuMesh-Signature'] = signature;
        }

        // Using Node fetch (available in Node 18+)
        const response = await fetch(wh.url, {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.timeout(10000),
        });

        delivery.statusCode = response.status;
        delivery.responseBody = (await response.text()).substring(0, 1000);
        delivery.success = response.ok;
        delivery.durationMs = Date.now() - start;

        if (!response.ok) {
          wh.failureCount += 1;
        } else {
          wh.failureCount = 0;
        }
      } catch (err) {
        delivery.success = false;
        delivery.responseBody = err instanceof Error ? err.message : String(err);
        delivery.durationMs = Date.now() - start;
        wh.failureCount += 1;
        this.logger.warn(`Webhook delivery failed: ${wh.name} — ${delivery.responseBody}`);
      }

      wh.lastTriggeredAt = new Date();
      // Auto-disable after 10 consecutive failures
      if (wh.failureCount >= 10) {
        wh.isActive = false;
      }
      await this.webhookRepo.save(wh);
      await this.deliveryRepo.save(delivery);
    }
  }

  async getWebhookDeliveries(orgId: string, webhookId: string) {
    const wh = await this.webhookRepo.findOne({ where: { id: webhookId, organizationId: orgId } });
    if (!wh) throw new NotFoundException('Webhook not found');
    return this.deliveryRepo.find({
      where: { webhookId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  // ===== Event Log / Activity Stream =====
  async logEvent(orgId: string, eventType: string, entityType: string, entityId: string, userId: string, summary: string, details?: Record<string, unknown>) {
    const entry = this.eventRepo.create({
      organizationId: orgId,
      eventType,
      entityType,
      entityId,
      userId,
      summary,
      details: details || {},
    });
    const saved = await this.eventRepo.save(entry);

    // Trigger webhooks for this event
    await this.triggerWebhooks(orgId, eventType, { entityType, entityId, summary, ...details });

    return saved;
  }

  async getActivityStream(orgId: string, limit = 50, offset = 0, entityType?: string) {
    const where: Record<string, unknown> = { organizationId: orgId };
    if (entityType) where.entityType = entityType;
    return this.eventRepo.find({
      where,
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
  }

  async getEntityHistory(orgId: string, entityType: string, entityId: string) {
    return this.eventRepo.find({
      where: { organizationId: orgId, entityType, entityId },
      order: { createdAt: 'ASC' },
    });
  }

  // ===== Content Analytics Dashboard =====
  async getAnalytics(orgId: string) {
    const totalContent = await this.contentRepo.count({ where: { organizationId: orgId } });

    const typeCounts = await this.contentRepo
      .createQueryBuilder('c')
      .select('c.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('c.organization_id = :orgId', { orgId })
      .groupBy('c.type')
      .getRawMany();

    const statusCounts = await this.contentRepo
      .createQueryBuilder('c')
      .select('c.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('c.organization_id = :orgId', { orgId })
      .groupBy('c.status')
      .getRawMany();

    // Stale content: not updated in 90 days
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - 90);
    const staleContent = await this.contentRepo.count({
      where: { organizationId: orgId, updatedAt: LessThan(staleDate) },
    });

    // Recently active (last 7 days)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);
    const recentlyActive = await this.contentRepo.count({
      where: { organizationId: orgId, updatedAt: MoreThan(recentDate) },
    });

    // Top contributors
    const contributors = await this.contentRepo
      .createQueryBuilder('c')
      .select('c.updated_by', 'userId')
      .addSelect('COUNT(*)', 'count')
      .where('c.organization_id = :orgId', { orgId })
      .andWhere('c.updated_by IS NOT NULL')
      .groupBy('c.updated_by')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // Version count (measure of rewrite/revision activity)
    const totalVersions = await this.versionRepo
      .createQueryBuilder('v')
      .innerJoin(ContentItem, 'c', 'c.id = v.contentItemId')
      .where('c.organization_id = :orgId', { orgId })
      .getCount();

    return {
      totalContent,
      typeCounts,
      statusCounts,
      staleContent,
      recentlyActive,
      contributors,
      totalVersions,
      averageVersionsPerItem: totalContent > 0 ? +(totalVersions / totalContent).toFixed(2) : 0,
    };
  }

  // ===== Link / Reference Health Report =====
  async getLinkHealthReport(orgId: string) {
    // Find content references that point to non-existent content
    const allContent = await this.contentRepo.find({
      where: { organizationId: orgId },
      select: ['id', 'title', 'body'],
    });

    const contentIds = new Set(allContent.map((c) => c.id));
    const orphaned: { id: string; title: string }[] = [];
    const noVersions: { id: string; title: string }[] = [];

    for (const c of allContent) {
      // Check for orphaned content (no parent, not a root)
      // A simple check: content with parentId set to non-existent ID would be orphaned
      // For now, detect items with no versions
      const versionCount = await this.versionRepo.count({ where: { contentItemId: c.id } });
      if (versionCount === 0) {
        noVersions.push({ id: c.id, title: c.title });
      }
    }

    return {
      totalItems: allContent.length,
      itemsWithNoVersions: noVersions,
      summary: {
        healthy: allContent.length - noVersions.length,
        issues: noVersions.length,
      },
    };
  }

  // ===== AI-assisted Authoring (Placeholder) =====
  async aiSuggestRewrite(orgId: string, contentItemId: string) {
    return {
      message: 'AI-assisted authoring requires LLM API configuration (OpenAI, Anthropic, etc.)',
      contentItemId,
      suggestions: [],
    };
  }

  async aiGenerateSummary(orgId: string, contentItemId: string) {
    return {
      message: 'AI summary generation requires LLM API configuration',
      contentItemId,
      summary: null,
    };
  }

  // ===== Content-as-Code (Git sync placeholder) =====
  async contentAsCodeExport(orgId: string) {
    const items = await this.contentRepo.find({
      where: { organizationId: orgId },
      order: { title: 'ASC' },
    });

    return items.map((item) => ({
      id: item.id,
      path: `content/${item.type}/${item.slug}.json`,
      title: item.title,
      type: item.type,
      status: item.status,
    }));
  }

  // ===== Plugin / Extension System (Registry placeholder) =====
  async getPluginRegistry() {
    return {
      message: 'Plugin system provides hooks for content types, output formats, and editor extensions',
      hooks: ['content-type', 'output-format', 'editor-extension', 'import-filter', 'export-filter'],
      registeredPlugins: [],
    };
  }

  // ===== Batch Operations =====
  async batchUpdateStatus(orgId: string, dto: BatchUpdateStatusDto) {
    const result = await this.contentRepo
      .createQueryBuilder()
      .update(ContentItem)
      .set({ status: dto.status as any })
      .where('id IN (:...ids)', { ids: dto.contentItemIds })
      .andWhere('organization_id = :orgId', { orgId })
      .execute();
    return { updated: result.affected || 0 };
  }

  async batchUpdateLocale(orgId: string, dto: BatchUpdateLocaleDto) {
    const result = await this.contentRepo
      .createQueryBuilder()
      .update(ContentItem)
      .set({ locale: dto.locale })
      .where('id IN (:...ids)', { ids: dto.contentItemIds })
      .andWhere('organization_id = :orgId', { orgId })
      .execute();
    return { updated: result.affected || 0 };
  }

  async batchMove(orgId: string, dto: BatchMoveDto) {
    const result = await this.contentRepo
      .createQueryBuilder()
      .update(ContentItem)
      .set({ parentId: dto.targetParentId })
      .where('id IN (:...ids)', { ids: dto.contentItemIds })
      .andWhere('organization_id = :orgId', { orgId })
      .execute();
    return { moved: result.affected || 0 };
  }

  async batchDelete(orgId: string, userId: string, contentItemIds: string[]) {
    const items = await this.contentRepo.find({
      where: { id: In(contentItemIds), organizationId: orgId },
    });

    // Soft delete: move to trash
    const trashItems: TrashItem[] = [];
    for (const item of items) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      trashItems.push(
        this.trashRepo.create({
          organizationId: orgId,
          entityType: 'content_item',
          entityId: item.id,
          entityTitle: item.title,
          snapshot: item as any,
          deletedBy: userId,
          expiresAt,
        }),
      );
    }
    await this.trashRepo.save(trashItems);
    await this.contentRepo.remove(items);

    return { deleted: items.length, trashedUntil: trashItems[0]?.expiresAt };
  }

  // ===== Mobile SDKs (stub endpoint) =====
  async getMobileSdkConfig(orgId: string) {
    return {
      message: 'Mobile SDK configuration for iOS/Android content delivery',
      endpoints: {
        content: '/api/delivery/content',
        maps: '/api/delivery/maps',
        search: '/api/taxonomy/search',
      },
      sdkVersions: {
        ios: '0.1.0-alpha',
        android: '0.1.0-alpha',
      },
    };
  }

  // ===== Content Comparison =====
  async compareContent(orgId: string, idA: string, idB: string) {
    const [a, b] = await Promise.all([
      this.contentRepo.findOne({ where: { id: idA, organizationId: orgId } }),
      this.contentRepo.findOne({ where: { id: idB, organizationId: orgId } }),
    ]);
    if (!a) throw new NotFoundException(`Content ${idA} not found`);
    if (!b) throw new NotFoundException(`Content ${idB} not found`);

    const fields = ['title', 'shortDescription', 'type', 'status', 'locale'] as const;
    const differences: { field: string; valueA: unknown; valueB: unknown }[] = [];

    for (const field of fields) {
      if ((a as any)[field] !== (b as any)[field]) {
        differences.push({ field, valueA: (a as any)[field], valueB: (b as any)[field] });
      }
    }

    // Body comparison
    const bodyA = JSON.stringify(a.body);
    const bodyB = JSON.stringify(b.body);
    if (bodyA !== bodyB) {
      differences.push({ field: 'body', valueA: '(different)', valueB: '(different)' });
    }

    return {
      itemA: { id: a.id, title: a.title, type: a.type },
      itemB: { id: b.id, title: b.title, type: b.type },
      identical: differences.length === 0,
      differences,
    };
  }

  // ===== Image / Asset Management =====
  async createAsset(orgId: string, userId: string, dto: CreateAssetDto) {
    const asset = this.assetRepo.create({
      organizationId: orgId,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      fileSize: dto.fileSize || 0,
      altText: dto.altText || '',
      description: dto.description || '',
      tags: dto.tags || [],
      uploadedBy: userId,
      storagePath: `assets/${orgId}/${Date.now()}-${dto.fileName}`,
    });
    return this.assetRepo.save(asset);
  }

  async findAssets(orgId: string) {
    return this.assetRepo.find({
      where: { organizationId: orgId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAsset(orgId: string, id: string) {
    const a = await this.assetRepo.findOne({ where: { id, organizationId: orgId } });
    if (!a) throw new NotFoundException('Asset not found');
    return a;
  }

  async updateAsset(orgId: string, id: string, dto: UpdateAssetDto) {
    const a = await this.findAsset(orgId, id);
    if (dto.altText !== undefined) a.altText = dto.altText;
    if (dto.description !== undefined) a.description = dto.description;
    if (dto.tags !== undefined) a.tags = dto.tags;
    return this.assetRepo.save(a);
  }

  async removeAsset(orgId: string, id: string) {
    const a = await this.findAsset(orgId, id);
    await this.assetRepo.remove(a);
    return { deleted: true };
  }

  // ===== Trash / Soft Delete =====
  async getTrash(orgId: string) {
    return this.trashRepo.find({
      where: { organizationId: orgId },
      order: { deletedAt: 'DESC' },
    });
  }

  async restoreFromTrash(orgId: string, trashItemId: string) {
    const item = await this.trashRepo.findOne({ where: { id: trashItemId, organizationId: orgId } });
    if (!item) throw new NotFoundException('Trash item not found');

    if (item.entityType === 'content_item') {
      const snapshot = item.snapshot as any;
      snapshot.organizationId = orgId;
      const restored = this.contentRepo.create(snapshot);
      await this.contentRepo.save(restored);
    }

    await this.trashRepo.remove(item);
    return { restored: true, entityType: item.entityType, entityId: item.entityId };
  }

  async emptyTrash(orgId: string) {
    const items = await this.trashRepo.find({ where: { organizationId: orgId } });
    await this.trashRepo.remove(items);
    return { purged: items.length };
  }

  async purgeExpiredTrash() {
    const expired = await this.trashRepo.find({
      where: { expiresAt: LessThan(new Date()) },
    });
    await this.trashRepo.remove(expired);
    return { purged: expired.length };
  }
}
