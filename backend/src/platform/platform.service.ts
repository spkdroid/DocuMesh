import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Plugin,
  PluginStatus,
  GitSyncConfig,
  WebhookConfig,
  AnalyticsEvent,
} from './entities/platform.entity';
import {
  InstallPluginDto,
  UpdatePluginDto,
  CreateGitSyncDto,
  UpdateGitSyncDto,
  CreateWebhookDto,
  UpdateWebhookDto,
  AnalyticsQueryDto,
} from './platform.dto';
import { ContentItem, ContentStatus } from '../content/entities/content-item.entity';

@Injectable()
export class PlatformService {
  constructor(
    @InjectRepository(Plugin)
    private readonly pluginRepo: Repository<Plugin>,
    @InjectRepository(GitSyncConfig)
    private readonly gitSyncRepo: Repository<GitSyncConfig>,
    @InjectRepository(WebhookConfig)
    private readonly webhookRepo: Repository<WebhookConfig>,
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepo: Repository<AnalyticsEvent>,
    @InjectRepository(ContentItem)
    private readonly contentRepo: Repository<ContentItem>,
  ) {}

  /* ─── Plugins ───────────────────────────── */

  async installPlugin(orgId: string, userId: string, dto: InstallPluginDto) {
    const plugin = this.pluginRepo.create({
      organizationId: orgId,
      installedBy: userId,
      name: dto.name,
      version: dto.version || '1.0.0',
      source: dto.source || '',
      description: dto.description || '',
      hooks: dto.hooks || [],
      config: dto.config || {},
      status: PluginStatus.ACTIVE,
    });
    return this.pluginRepo.save(plugin);
  }

  async listPlugins(orgId: string) {
    return this.pluginRepo.find({
      where: { organizationId: orgId },
      order: { createdAt: 'DESC' },
    });
  }

  async getPlugin(orgId: string, id: string) {
    const p = await this.pluginRepo.findOne({ where: { id, organizationId: orgId } });
    if (!p) throw new NotFoundException('Plugin not found');
    return p;
  }

  async updatePlugin(orgId: string, id: string, dto: UpdatePluginDto) {
    const p = await this.getPlugin(orgId, id);
    if (dto.status) p.status = dto.status;
    if (dto.config) p.config = dto.config;
    return this.pluginRepo.save(p);
  }

  async uninstallPlugin(orgId: string, id: string) {
    const p = await this.getPlugin(orgId, id);
    await this.pluginRepo.remove(p);
    return { deleted: true };
  }

  async executeHook(orgId: string, hookName: string, payload: Record<string, unknown>) {
    const plugins = await this.pluginRepo.find({
      where: { organizationId: orgId, status: PluginStatus.ACTIVE },
    });
    const matching = plugins.filter(p => p.hooks.includes(hookName));
    // In production, run sandboxed plugin code. Stub returns matching plugins.
    return {
      hook: hookName,
      pluginsTriggered: matching.map(p => ({ id: p.id, name: p.name })),
      payload,
    };
  }

  /* ─── Git Sync ──────────────────────────── */

  async createGitSync(orgId: string, dto: CreateGitSyncDto) {
    const config = this.gitSyncRepo.create({
      organizationId: orgId,
      provider: dto.provider,
      repoUrl: dto.repoUrl,
      branch: dto.branch || 'main',
      accessTokenEncrypted: dto.accessToken || '', // encrypt in production
      direction: dto.direction || 'bidirectional' as any,
      contentFormat: dto.contentFormat || 'markdown',
      syncPath: dto.syncPath || 'docs/',
    });
    return this.gitSyncRepo.save(config);
  }

  async listGitSyncs(orgId: string) {
    return this.gitSyncRepo.find({
      where: { organizationId: orgId },
      order: { createdAt: 'DESC' },
    });
  }

  async getGitSync(orgId: string, id: string) {
    const c = await this.gitSyncRepo.findOne({ where: { id, organizationId: orgId } });
    if (!c) throw new NotFoundException('Git sync config not found');
    return c;
  }

  async updateGitSync(orgId: string, id: string, dto: UpdateGitSyncDto) {
    const c = await this.getGitSync(orgId, id);
    Object.assign(c, dto);
    if (dto.accessToken) c.accessTokenEncrypted = dto.accessToken;
    return this.gitSyncRepo.save(c);
  }

  async deleteGitSync(orgId: string, id: string) {
    const c = await this.getGitSync(orgId, id);
    await this.gitSyncRepo.remove(c);
    return { deleted: true };
  }

  async triggerSync(orgId: string, id: string) {
    const config = await this.getGitSync(orgId, id);
    // In production, run the actual git operations. Stub for now.
    config.lastSyncAt = new Date();
    config.lastSyncStatus = 'success';
    await this.gitSyncRepo.save(config);

    return {
      syncId: config.id,
      status: 'success',
      direction: config.direction,
      contentFormat: config.contentFormat,
      timestamp: config.lastSyncAt.toISOString(),
    };
  }

  /* ─── Webhooks / Bots ──────────────────── */

  async createWebhook(orgId: string, dto: CreateWebhookDto) {
    const wh = this.webhookRepo.create({
      organizationId: orgId,
      platform: dto.platform,
      name: dto.name,
      webhookUrl: dto.webhookUrl,
      events: dto.events || [],
    });
    return this.webhookRepo.save(wh);
  }

  async listWebhooks(orgId: string) {
    return this.webhookRepo.find({
      where: { organizationId: orgId },
      order: { createdAt: 'DESC' },
    });
  }

  async getWebhook(orgId: string, id: string) {
    const wh = await this.webhookRepo.findOne({ where: { id, organizationId: orgId } });
    if (!wh) throw new NotFoundException('Webhook not found');
    return wh;
  }

  async updateWebhook(orgId: string, id: string, dto: UpdateWebhookDto) {
    const wh = await this.getWebhook(orgId, id);
    Object.assign(wh, dto);
    return this.webhookRepo.save(wh);
  }

  async deleteWebhook(orgId: string, id: string) {
    const wh = await this.getWebhook(orgId, id);
    await this.webhookRepo.remove(wh);
    return { deleted: true };
  }

  async sendWebhookEvent(orgId: string, eventType: string, data: Record<string, unknown>) {
    const webhooks = await this.webhookRepo.find({
      where: { organizationId: orgId, enabled: true },
    });
    const matching = webhooks.filter(wh => wh.events.includes(eventType) || wh.events.length === 0);

    const results: { id: string; name: string; status: string }[] = [];
    for (const wh of matching) {
      // In production, POST to wh.webhookUrl with the event payload.
      // Formatting depends on platform (Slack blocks, Teams adaptive cards, etc.)
      results.push({ id: wh.id, name: wh.name, status: 'sent' });
    }

    return { event: eventType, dispatched: results.length, results };
  }

  /* ─── Analytics ─────────────────────────── */

  async trackEvent(
    orgId: string,
    eventType: string,
    payload: Record<string, unknown> = {},
    userId?: string,
    entityType?: string,
    entityId?: string,
  ) {
    const event = this.analyticsRepo.create({
      organizationId: orgId,
      eventType,
      userId: userId || null,
      entityType: entityType || '',
      entityId: entityId || null,
      payload,
    });
    return this.analyticsRepo.save(event);
  }

  async queryAnalytics(orgId: string, query: AnalyticsQueryDto) {
    const qb = this.analyticsRepo
      .createQueryBuilder('e')
      .where('e.organization_id = :orgId', { orgId });

    if (query.eventType) qb.andWhere('e.event_type = :eventType', { eventType: query.eventType });
    if (query.entityType) qb.andWhere('e.entity_type = :entityType', { entityType: query.entityType });
    if (query.fromDate) qb.andWhere('e.created_at >= :from', { from: new Date(query.fromDate) });
    if (query.toDate) qb.andWhere('e.created_at <= :to', { to: new Date(query.toDate) });

    qb.orderBy('e.created_at', 'DESC').take(500);
    return qb.getMany();
  }

  async getAnalyticsDashboard(orgId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Content views
    const viewCount = await this.analyticsRepo.count({
      where: { organizationId: orgId, eventType: 'content.view' },
    });

    // Search queries
    const searchCount = await this.analyticsRepo.count({
      where: { organizationId: orgId, eventType: 'search.query' },
    });

    // Top viewed content (last 30 days)
    const topViewed = await this.analyticsRepo
      .createQueryBuilder('e')
      .select('e.entity_id', 'entityId')
      .addSelect('COUNT(*)', 'views')
      .where('e.organization_id = :orgId', { orgId })
      .andWhere('e.event_type = :type', { type: 'content.view' })
      .andWhere('e.created_at >= :since', { since: thirtyDaysAgo })
      .groupBy('e.entity_id')
      .orderBy('views', 'DESC')
      .take(10)
      .getRawMany();

    // Author productivity
    const authorStats = await this.contentRepo
      .createQueryBuilder('c')
      .select('c.created_by', 'authorId')
      .addSelect('COUNT(*)', 'itemCount')
      .where('c.organization_id = :orgId', { orgId })
      .andWhere('c.created_at >= :since', { since: thirtyDaysAgo })
      .groupBy('c.created_by')
      .orderBy('itemCount', 'DESC')
      .take(10)
      .getRawMany();

    // Event type breakdown
    const eventBreakdown = await this.analyticsRepo
      .createQueryBuilder('e')
      .select('e.event_type', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .where('e.organization_id = :orgId', { orgId })
      .andWhere('e.created_at >= :since', { since: thirtyDaysAgo })
      .groupBy('e.event_type')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      totalViews: viewCount,
      totalSearches: searchCount,
      topViewed,
      authorStats,
      eventBreakdown,
      period: '30d',
    };
  }

  /* ─── CLI / GraphQL stubs ──────────────── */

  async cliImport(orgId: string, userId: string, items: { title: string; body: string; type?: string }[]) {
    const created: string[] = [];
    for (const item of items) {
      const slug = item.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const entity = this.contentRepo.create({
        organizationId: orgId,
        createdBy: userId,
        updatedBy: userId,
        title: item.title,
        slug,
        type: (item.type as any) || 'topic',
        shortDescription: '',
        body: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: item.body }] }] },
        metadata: {},
        prolog: {},
        status: ContentStatus.DRAFT,
        locale: 'en',
        sortOrder: 0,
      });
      const saved = await this.contentRepo.save(entity);
      created.push(saved.id);
    }
    return { imported: created.length, ids: created };
  }

  async cliExport(orgId: string, format: string = 'json') {
    const items = await this.contentRepo.find({
      where: { organizationId: orgId, status: ContentStatus.PUBLISHED },
      order: { updatedAt: 'DESC' },
      take: 1000,
    });

    if (format === 'markdown') {
      return items.map(i => ({
        slug: i.slug,
        content: `# ${i.title}\n\n${i.shortDescription || ''}\n\n(structured body omitted)`,
      }));
    }

    return items.map(i => ({
      id: i.id,
      slug: i.slug,
      type: i.type,
      title: i.title,
      shortDescription: i.shortDescription,
      body: i.body,
      locale: i.locale,
      updatedAt: i.updatedAt,
    }));
  }

  async cliSearch(orgId: string, query: string) {
    const items = await this.contentRepo
      .createQueryBuilder('c')
      .where('c.organization_id = :orgId', { orgId })
      .andWhere('(c.title ILIKE :q OR c.short_description ILIKE :q)', { q: `%${query}%` })
      .orderBy('c.updated_at', 'DESC')
      .take(20)
      .getMany();

    return items.map(i => ({
      id: i.id,
      slug: i.slug,
      title: i.title,
      type: i.type,
      status: i.status,
    }));
  }
}
