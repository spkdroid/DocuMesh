import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { TaxonomyTerm } from './entities/taxonomy-term.entity';
import { ContentTag } from './entities/content-tag.entity';
import { ContentItem } from '../content/entities/content-item.entity';
import {
  CreateTaxonomyTermDto,
  UpdateTaxonomyTermDto,
  TagContentDto,
  SearchDto,
} from './dto/taxonomy.dto';

@Injectable()
export class TaxonomyService {
  constructor(
    @InjectRepository(TaxonomyTerm)
    private readonly termRepo: Repository<TaxonomyTerm>,
    @InjectRepository(ContentTag)
    private readonly tagRepo: Repository<ContentTag>,
    @InjectRepository(ContentItem)
    private readonly contentRepo: Repository<ContentItem>,
  ) {}

  // === Taxonomy Terms ===
  async createTerm(orgId: string, dto: CreateTaxonomyTermDto) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const term = this.termRepo.create({
      organizationId: orgId,
      taxonomyName: dto.taxonomyName,
      name: dto.name,
      slug,
      description: dto.description || '',
      parentId: dto.parentId || undefined,
      sortOrder: dto.sortOrder || 0,
    });
    return this.termRepo.save(term);
  }

  async findTerms(orgId: string, taxonomyName?: string) {
    const where: Record<string, unknown> = { organizationId: orgId };
    if (taxonomyName) where.taxonomyName = taxonomyName;
    return this.termRepo.find({ where, order: { taxonomyName: 'ASC', sortOrder: 'ASC' } });
  }

  async findTermTree(orgId: string, taxonomyName: string) {
    const all = await this.termRepo.find({
      where: { organizationId: orgId, taxonomyName },
      order: { sortOrder: 'ASC' },
    });

    const roots = all.filter((t) => !t.parentId);
    const buildTree = (parent: TaxonomyTerm): Record<string, unknown> => ({
      ...parent,
      children: all.filter((t) => t.parentId === parent.id).map(buildTree),
    });

    return roots.map(buildTree);
  }

  async findTerm(orgId: string, id: string) {
    const t = await this.termRepo.findOne({ where: { id, organizationId: orgId } });
    if (!t) throw new NotFoundException('Taxonomy term not found');
    return t;
  }

  async updateTerm(orgId: string, id: string, dto: UpdateTaxonomyTermDto) {
    const t = await this.findTerm(orgId, id);
    if (dto.name !== undefined) {
      t.name = dto.name;
      t.slug = dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (dto.description !== undefined) t.description = dto.description;
    if (dto.parentId !== undefined) t.parentId = dto.parentId;
    if (dto.sortOrder !== undefined) t.sortOrder = dto.sortOrder;
    return this.termRepo.save(t);
  }

  async removeTerm(orgId: string, id: string) {
    const t = await this.findTerm(orgId, id);
    await this.termRepo.remove(t);
    return { deleted: true };
  }

  // === Tagging ===
  async tagContent(orgId: string, userId: string, dto: TagContentDto) {
    const tag = this.tagRepo.create({
      organizationId: orgId,
      contentItemId: dto.contentItemId,
      taxonomyTermId: dto.taxonomyTermId || undefined,
      freeformTag: dto.freeformTag || undefined,
      taggedBy: userId,
    });
    return this.tagRepo.save(tag);
  }

  async getContentTags(orgId: string, contentItemId: string) {
    const tags = await this.tagRepo.find({
      where: { organizationId: orgId, contentItemId },
    });

    const termIds = tags.filter((t) => t.taxonomyTermId).map((t) => t.taxonomyTermId);
    const terms = termIds.length
      ? await this.termRepo.findByIds(termIds)
      : [];
    const termMap = new Map(terms.map((t) => [t.id, t]));

    return tags.map((tag) => ({
      ...tag,
      term: tag.taxonomyTermId ? termMap.get(tag.taxonomyTermId) || null : null,
    }));
  }

  async removeTag(orgId: string, id: string) {
    const tag = await this.tagRepo.findOne({ where: { id, organizationId: orgId } });
    if (!tag) throw new NotFoundException('Tag not found');
    await this.tagRepo.remove(tag);
    return { deleted: true };
  }

  async findContentByTerm(orgId: string, termId: string) {
    const tags = await this.tagRepo.find({
      where: { organizationId: orgId, taxonomyTermId: termId },
    });
    if (!tags.length) return [];
    const contentIds = [...new Set(tags.map((t) => t.contentItemId))];
    return this.contentRepo
      .createQueryBuilder('c')
      .where('c.id IN (:...ids)', { ids: contentIds })
      .andWhere('c.organization_id = :orgId', { orgId })
      .getMany();
  }

  // === Full-text Search (PostgreSQL) ===
  async search(orgId: string, dto: SearchDto) {
    const limit = dto.limit || 20;
    const offset = dto.offset || 0;

    let qb = this.contentRepo
      .createQueryBuilder('c')
      .where('c.organization_id = :orgId', { orgId });

    // Full-text search using PostgreSQL tsvector
    if (dto.query) {
      const tsQuery = dto.query
        .trim()
        .split(/\s+/)
        .map((w) => `${w}:*`)
        .join(' & ');
      qb = qb
        .addSelect(
          `ts_rank(to_tsvector('english', c.title || ' ' || c.short_description), to_tsquery('english', :tsQuery))`,
          'rank',
        )
        .andWhere(
          `to_tsvector('english', c.title || ' ' || c.short_description) @@ to_tsquery('english', :tsQuery)`,
          { tsQuery },
        )
        .orderBy('rank', 'DESC');
    } else {
      qb = qb.orderBy('c.updatedAt', 'DESC');
    }

    // Faceted filters
    if (dto.contentType) {
      qb = qb.andWhere('c.type = :contentType', { contentType: dto.contentType });
    }
    if (dto.status) {
      qb = qb.andWhere('c.status = :status', { status: dto.status });
    }
    if (dto.locale) {
      qb = qb.andWhere('c.locale = :locale', { locale: dto.locale });
    }
    if (dto.dateFrom) {
      qb = qb.andWhere('c.updatedAt >= :dateFrom', { dateFrom: dto.dateFrom });
    }
    if (dto.dateTo) {
      qb = qb.andWhere('c.updatedAt <= :dateTo', { dateTo: dto.dateTo });
    }

    // Taxonomy/tag filter
    if (dto.taxonomyTerm) {
      qb = qb.andWhere((qb2) => {
        const subQuery = qb2
          .subQuery()
          .select('ct.contentItemId')
          .from(ContentTag, 'ct')
          .where('ct.taxonomyTermId = :termId')
          .getQuery();
        return `c.id IN ${subQuery}`;
      }).setParameter('termId', dto.taxonomyTerm);
    }

    const [items, total] = await qb.skip(offset).take(limit).getManyAndCount();

    // Facet counts
    const facets = await this.buildFacets(orgId, dto);

    return { items, total, offset, limit, facets };
  }

  private async buildFacets(orgId: string, dto: SearchDto) {
    const typeFacets = await this.contentRepo
      .createQueryBuilder('c')
      .select('c.type', 'value')
      .addSelect('COUNT(*)', 'count')
      .where('c.organization_id = :orgId', { orgId })
      .groupBy('c.type')
      .getRawMany();

    const statusFacets = await this.contentRepo
      .createQueryBuilder('c')
      .select('c.status', 'value')
      .addSelect('COUNT(*)', 'count')
      .where('c.organization_id = :orgId', { orgId })
      .groupBy('c.status')
      .getRawMany();

    return { contentType: typeFacets, status: statusFacets };
  }

  // === Semantic search placeholder ===
  async semanticSearch(orgId: string, query: string) {
    // Placeholder for pgvector integration
    // In production: embed query with OpenAI/Cohere, then query pgvector index
    return {
      message: 'Semantic search requires pgvector extension and embedding model configuration',
      query,
      results: [],
    };
  }
}
