import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ContentTemplate } from './entities/content-template.entity';
import { Snippet } from './entities/snippet.entity';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateSnippetDto,
  UpdateSnippetDto,
} from './dto/templates.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(ContentTemplate)
    private readonly templateRepo: Repository<ContentTemplate>,
    @InjectRepository(Snippet)
    private readonly snippetRepo: Repository<Snippet>,
  ) {}

  // === Templates ===

  async createTemplate(orgId: string, userId: string, dto: CreateTemplateDto) {
    const slug =
      dto.slug ||
      dto.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const template = this.templateRepo.create({
      organizationId: orgId,
      title: dto.title,
      slug,
      description: dto.description || '',
      contentType: dto.contentType,
      body: dto.body || {},
      metadata: dto.metadata || {},
      prolog: dto.prolog || {},
      ditaSections: dto.ditaSections || {},
      createdBy: userId,
    });
    return this.templateRepo.save(template);
  }

  async findAllTemplates(orgId: string, search?: string) {
    const where: Record<string, unknown> = { organizationId: orgId };
    if (search) {
      return this.templateRepo.find({
        where: [
          { organizationId: orgId, title: ILike(`%${search}%`) },
          { organizationId: orgId, description: ILike(`%${search}%`) },
        ],
        order: { updatedAt: 'DESC' },
      });
    }
    return this.templateRepo.find({ where, order: { updatedAt: 'DESC' } });
  }

  async findOneTemplate(orgId: string, id: string) {
    const t = await this.templateRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!t) throw new NotFoundException('Template not found');
    return t;
  }

  async updateTemplate(orgId: string, id: string, dto: UpdateTemplateDto) {
    const t = await this.findOneTemplate(orgId, id);
    if (dto.title !== undefined) t.title = dto.title;
    if (dto.description !== undefined) t.description = dto.description;
    if (dto.contentType !== undefined) t.contentType = dto.contentType;
    if (dto.body !== undefined) t.body = dto.body;
    if (dto.metadata !== undefined) t.metadata = dto.metadata;
    if (dto.prolog !== undefined) t.prolog = dto.prolog;
    if (dto.ditaSections !== undefined) t.ditaSections = dto.ditaSections;
    return this.templateRepo.save(t);
  }

  async removeTemplate(orgId: string, id: string) {
    const t = await this.findOneTemplate(orgId, id);
    await this.templateRepo.remove(t);
    return { deleted: true };
  }

  // === Snippets ===

  async createSnippet(orgId: string, userId: string, dto: CreateSnippetDto) {
    const slug =
      dto.slug ||
      dto.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const snippet = this.snippetRepo.create({
      organizationId: orgId,
      title: dto.title,
      slug,
      description: dto.description || '',
      category: dto.category || 'general',
      body: dto.body || {},
      tags: dto.tags || [],
      createdBy: userId,
    });
    return this.snippetRepo.save(snippet);
  }

  async findAllSnippets(orgId: string, category?: string, search?: string) {
    const qb = this.snippetRepo
      .createQueryBuilder('s')
      .where('s.organization_id = :orgId', { orgId });

    if (category) {
      qb.andWhere('s.category = :category', { category });
    }
    if (search) {
      qb.andWhere('(s.title ILIKE :search OR s.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }
    qb.orderBy('s.updated_at', 'DESC');
    return qb.getMany();
  }

  async findOneSnippet(orgId: string, id: string) {
    const s = await this.snippetRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!s) throw new NotFoundException('Snippet not found');
    return s;
  }

  async updateSnippet(orgId: string, id: string, dto: UpdateSnippetDto) {
    const s = await this.findOneSnippet(orgId, id);
    if (dto.title !== undefined) s.title = dto.title;
    if (dto.description !== undefined) s.description = dto.description;
    if (dto.category !== undefined) s.category = dto.category;
    if (dto.body !== undefined) s.body = dto.body;
    if (dto.tags !== undefined) s.tags = dto.tags;
    return this.snippetRepo.save(s);
  }

  async removeSnippet(orgId: string, id: string) {
    const s = await this.findOneSnippet(orgId, id);
    await this.snippetRepo.remove(s);
    return { deleted: true };
  }
}
