import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentItem, ContentStatus } from './entities/content-item.entity';
import { ContentVersion } from './entities/content-version.entity';
import { RelatedLink } from './entities/related-link.entity';
import { TaskStep } from './entities/task-step.entity';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(ContentItem)
    private readonly contentRepo: Repository<ContentItem>,
    @InjectRepository(ContentVersion)
    private readonly versionRepo: Repository<ContentVersion>,
    @InjectRepository(RelatedLink)
    private readonly relatedLinkRepo: Repository<RelatedLink>,
    @InjectRepository(TaskStep)
    private readonly taskStepRepo: Repository<TaskStep>,
  ) {}

  async create(orgId: string, userId: string, dto: CreateContentDto) {
    const slug =
      dto.slug ||
      dto.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const item = this.contentRepo.create({
      organizationId: orgId,
      slug,
      type: dto.type,
      title: dto.title,
      shortDescription: dto.shortDescription || '',
      body: dto.body || {},
      metadata: dto.metadata || {},
      prolog: (dto.prolog || {}) as Record<string, unknown>,
      locale: dto.locale || 'en',
      parentId: dto.parentId || null,
      sortOrder: dto.sortOrder || 0,
      reviewByDate: dto.reviewByDate ? new Date(dto.reviewByDate) : null,
      autoArchiveOnExpiry: dto.autoArchiveOnExpiry || false,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved: ContentItem = await this.contentRepo.save(item);

    // Save task steps if provided (for task/troubleshooting types)
    if (dto.steps?.length) {
      await this.saveSteps(saved.id, dto.steps);
    }

    // Save related links if provided
    if (dto.relatedLinks?.length) {
      await this.saveRelatedLinks(saved.id, dto.relatedLinks);
    }

    await this.versionRepo.save(
      this.versionRepo.create({
        contentItemId: saved.id,
        versionNumber: 1,
        body: saved.body,
        metadata: { ...saved.metadata, prolog: saved.prolog },
        changeSummary: 'Initial version',
        createdBy: userId,
      }),
    );

    return this.findOne(orgId, saved.id);
  }

  async findAll(orgId: string, query: QueryContentDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);

    const qb = this.contentRepo
      .createQueryBuilder('content')
      .where('content.organization_id = :orgId', { orgId });

    if (query.type) {
      qb.andWhere('content.type = :type', { type: query.type });
    }
    if (query.status) {
      qb.andWhere('content.status = :status', { status: query.status });
    }
    if (query.locale) {
      qb.andWhere('content.locale = :locale', { locale: query.locale });
    }
    if (query.search) {
      qb.andWhere(
        '(content.title ILIKE :search OR content.short_description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('content.updated_at', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return { items, total, page, limit };
  }

  async findOne(orgId: string, id: string) {
    const item = await this.contentRepo.findOne({
      where: { id, organizationId: orgId },
      relations: ['children', 'parent', 'relatedLinks', 'relatedLinks.targetItem', 'steps'],
    });
    if (!item) {
      throw new NotFoundException('Content item not found');
    }
    // Sort steps by stepNumber
    if (item.steps) {
      item.steps.sort((a, b) => a.stepNumber - b.stepNumber);
    }
    return item;
  }

  async update(orgId: string, userId: string, id: string, dto: UpdateContentDto) {
    const item = await this.findOne(orgId, id);

    if (dto.title !== undefined) item.title = dto.title;
    if (dto.shortDescription !== undefined) item.shortDescription = dto.shortDescription;
    if (dto.body !== undefined) item.body = dto.body;
    if (dto.metadata !== undefined) item.metadata = dto.metadata;
    if (dto.prolog !== undefined) item.prolog = dto.prolog as Record<string, unknown>;
    if (dto.status !== undefined) item.status = dto.status;
    if (dto.locale !== undefined) item.locale = dto.locale;
    if (dto.sortOrder !== undefined) item.sortOrder = dto.sortOrder;
    if (dto.reviewByDate !== undefined) item.reviewByDate = dto.reviewByDate ? new Date(dto.reviewByDate) : null;
    if (dto.autoArchiveOnExpiry !== undefined) item.autoArchiveOnExpiry = dto.autoArchiveOnExpiry;
    item.updatedBy = userId;

    const saved = await this.contentRepo.save(item);

    // Replace steps if provided
    if (dto.steps !== undefined) {
      await this.taskStepRepo.delete({ contentItemId: id });
      if (dto.steps.length) {
        await this.saveSteps(id, dto.steps);
      }
    }

    // Replace related links if provided
    if (dto.relatedLinks !== undefined) {
      await this.relatedLinkRepo.delete({ sourceItemId: id });
      if (dto.relatedLinks.length) {
        await this.saveRelatedLinks(id, dto.relatedLinks);
      }
    }

    const lastVersion = await this.versionRepo.findOne({
      where: { contentItemId: id },
      order: { versionNumber: 'DESC' },
    });

    await this.versionRepo.save(
      this.versionRepo.create({
        contentItemId: saved.id,
        versionNumber: (lastVersion?.versionNumber || 0) + 1,
        body: saved.body,
        metadata: { ...saved.metadata, prolog: saved.prolog },
        changeSummary: dto.changeSummary || '',
        createdBy: userId,
      }),
    );

    return this.findOne(orgId, saved.id);
  }

  async remove(orgId: string, id: string) {
    const item = await this.findOne(orgId, id);
    await this.contentRepo.remove(item);
    return { deleted: true };
  }

  async getVersions(orgId: string, contentId: string) {
    await this.findOne(orgId, contentId);
    return this.versionRepo.find({
      where: { contentItemId: contentId },
      order: { versionNumber: 'DESC' },
    });
  }

  private async saveSteps(
    contentItemId: string,
    steps: CreateContentDto['steps'],
    parentStepId: string | null = null,
  ) {
    if (!steps) return;
    for (const stepDto of steps) {
      const step = this.taskStepRepo.create({
        contentItemId,
        stepNumber: stepDto.stepNumber,
        title: stepDto.title,
        body: stepDto.body || {},
        stepResult: stepDto.stepResult || '',
        info: stepDto.info || '',
        parentStepId,
      });
      const saved = await this.taskStepRepo.save(step);
      if (stepDto.subSteps?.length) {
        await this.saveSteps(contentItemId, stepDto.subSteps, saved.id);
      }
    }
  }

  private async saveRelatedLinks(
    sourceItemId: string,
    links: CreateContentDto['relatedLinks'],
  ) {
    if (!links) return;
    for (const linkDto of links) {
      await this.relatedLinkRepo.save(
        this.relatedLinkRepo.create({
          sourceItemId,
          targetItemId: linkDto.targetItemId,
          relationType: linkDto.relationType as any,
          navTitle: linkDto.navTitle || '',
          sortOrder: linkDto.sortOrder || 0,
        }),
      );
    }
  }

  // === Content Expiry & Staleness ===

  async getExpiringContent(orgId: string, daysAhead = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);

    return this.contentRepo
      .createQueryBuilder('c')
      .where('c.organization_id = :orgId', { orgId })
      .andWhere('c.review_by_date IS NOT NULL')
      .andWhere('c.review_by_date <= :cutoff', { cutoff })
      .andWhere('c.status != :archived', { archived: 'archived' })
      .orderBy('c.review_by_date', 'ASC')
      .getMany();
  }

  async getStaleContent(orgId: string, staleDays = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - staleDays);

    return this.contentRepo
      .createQueryBuilder('c')
      .where('c.organization_id = :orgId', { orgId })
      .andWhere('c.updated_at < :cutoff', { cutoff })
      .andWhere('c.status != :archived', { archived: 'archived' })
      .orderBy('c.updated_at', 'ASC')
      .getMany();
  }

  async getStalenessStats(orgId: string) {
    const now = new Date();

    const expiredCount = await this.contentRepo
      .createQueryBuilder('c')
      .where('c.organization_id = :orgId', { orgId })
      .andWhere('c.review_by_date IS NOT NULL')
      .andWhere('c.review_by_date < :now', { now })
      .andWhere('c.status != :archived', { archived: 'archived' })
      .getCount();

    const expiringSoonDate = new Date();
    expiringSoonDate.setDate(expiringSoonDate.getDate() + 30);
    const expiringSoonCount = await this.contentRepo
      .createQueryBuilder('c')
      .where('c.organization_id = :orgId', { orgId })
      .andWhere('c.review_by_date IS NOT NULL')
      .andWhere('c.review_by_date >= :now', { now })
      .andWhere('c.review_by_date <= :soon', { soon: expiringSoonDate })
      .andWhere('c.status != :archived', { archived: 'archived' })
      .getCount();

    const stale90 = new Date();
    stale90.setDate(stale90.getDate() - 90);
    const staleCount = await this.contentRepo
      .createQueryBuilder('c')
      .where('c.organization_id = :orgId', { orgId })
      .andWhere('c.updated_at < :cutoff', { cutoff: stale90 })
      .andWhere('c.status != :archived', { archived: 'archived' })
      .getCount();

    const totalCount = await this.contentRepo.count({
      where: { organizationId: orgId },
    });

    return { totalCount, expiredCount, expiringSoonCount, staleCount };
  }

  async autoArchiveExpired(orgId: string) {
    const now = new Date();
    const result = await this.contentRepo
      .createQueryBuilder()
      .update(ContentItem)
      .set({ status: ContentStatus.ARCHIVED })
      .where('organization_id = :orgId', { orgId })
      .andWhere('review_by_date IS NOT NULL')
      .andWhere('review_by_date < :now', { now })
      .andWhere('auto_archive_on_expiry = true')
      .andWhere('status != :archived', { archived: 'archived' })
      .execute();

    return { archivedCount: result.affected || 0 };
  }
}
