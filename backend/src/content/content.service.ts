import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentItem } from './entities/content-item.entity';
import { ContentVersion } from './entities/content-version.entity';
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
      body: dto.body || {},
      metadata: dto.metadata || {},
      locale: dto.locale || 'en',
      parentId: dto.parentId || null,
      sortOrder: dto.sortOrder || 0,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.contentRepo.save(item);

    await this.versionRepo.save(
      this.versionRepo.create({
        contentItemId: saved.id,
        versionNumber: 1,
        body: saved.body,
        metadata: saved.metadata,
        changeSummary: 'Initial version',
        createdBy: userId,
      }),
    );

    return saved;
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
      qb.andWhere('content.title ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('content.updated_at', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return { items, total, page, limit };
  }

  async findOne(orgId: string, id: string) {
    const item = await this.contentRepo.findOne({
      where: { id, organizationId: orgId },
      relations: ['children', 'parent'],
    });
    if (!item) {
      throw new NotFoundException('Content item not found');
    }
    return item;
  }

  async update(orgId: string, userId: string, id: string, dto: UpdateContentDto) {
    const item = await this.findOne(orgId, id);

    if (dto.title !== undefined) item.title = dto.title;
    if (dto.body !== undefined) item.body = dto.body;
    if (dto.metadata !== undefined) item.metadata = dto.metadata;
    if (dto.status !== undefined) item.status = dto.status;
    if (dto.locale !== undefined) item.locale = dto.locale;
    if (dto.sortOrder !== undefined) item.sortOrder = dto.sortOrder;
    item.updatedBy = userId;

    const saved = await this.contentRepo.save(item);

    const lastVersion = await this.versionRepo.findOne({
      where: { contentItemId: id },
      order: { versionNumber: 'DESC' },
    });

    await this.versionRepo.save(
      this.versionRepo.create({
        contentItemId: saved.id,
        versionNumber: (lastVersion?.versionNumber || 0) + 1,
        body: saved.body,
        metadata: saved.metadata,
        changeSummary: dto.changeSummary || '',
        createdBy: userId,
      }),
    );

    return saved;
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
}
