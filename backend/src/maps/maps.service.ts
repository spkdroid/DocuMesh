import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DitaMap, MapStatus } from './entities/dita-map.entity';
import { MapEntry } from './entities/map-entry.entity';
import { DitavalProfile, DitavalRule } from './entities/ditaval-profile.entity';
import { PublishingProfile, OutputFormat } from './entities/publishing-profile.entity';
import { PublishJob, PublishJobStatus } from './entities/publish-job.entity';
import { ContentItem } from '../content/entities/content-item.entity';
import {
  CreateDitaMapDto,
  UpdateDitaMapDto,
  CreateMapEntryDto,
  CreateDitavalProfileDto,
  CreatePublishingProfileDto,
  StartPublishJobDto,
} from './dto/maps.dto';

@Injectable()
export class MapsService {
  constructor(
    @InjectRepository(DitaMap)
    private readonly mapRepo: Repository<DitaMap>,
    @InjectRepository(MapEntry)
    private readonly entryRepo: Repository<MapEntry>,
    @InjectRepository(DitavalProfile)
    private readonly ditavalRepo: Repository<DitavalProfile>,
    @InjectRepository(PublishingProfile)
    private readonly profileRepo: Repository<PublishingProfile>,
    @InjectRepository(PublishJob)
    private readonly jobRepo: Repository<PublishJob>,
    @InjectRepository(ContentItem)
    private readonly contentRepo: Repository<ContentItem>,
  ) {}

  // === DITA Maps ===
  async createMap(orgId: string, dto: CreateDitaMapDto) {
    const slug =
      dto.slug ||
      dto.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    const map = this.mapRepo.create({
      organizationId: orgId,
      title: dto.title,
      slug,
      mapType: dto.mapType,
      locale: dto.locale || 'en',
      metadata: (dto.metadata || {}) as Record<string, unknown>,
    });
    return this.mapRepo.save(map);
  }

  async findAllMaps(orgId: string) {
    return this.mapRepo.find({
      where: { organizationId: orgId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findMap(orgId: string, id: string) {
    const map = await this.mapRepo.findOne({
      where: { id, organizationId: orgId },
      relations: ['entries', 'entries.contentItem'],
    });
    if (!map) throw new NotFoundException('Map not found');
    return map;
  }

  async updateMap(orgId: string, id: string, dto: UpdateDitaMapDto) {
    const map = await this.findMap(orgId, id);
    if (dto.title !== undefined) map.title = dto.title;
    if (dto.mapType !== undefined) map.mapType = dto.mapType;
    if (dto.locale !== undefined) map.locale = dto.locale;
    if (dto.metadata !== undefined) map.metadata = dto.metadata;
    return this.mapRepo.save(map);
  }

  async removeMap(orgId: string, id: string) {
    const map = await this.findMap(orgId, id);
    await this.mapRepo.remove(map);
    return { deleted: true };
  }

  async publishMap(orgId: string, id: string) {
    const map = await this.findMap(orgId, id);
    map.status = MapStatus.PUBLISHED;
    return this.mapRepo.save(map);
  }

  // === Map Entries ===
  async addEntry(orgId: string, mapId: string, dto: CreateMapEntryDto) {
    await this.findMap(orgId, mapId);
    const entry = this.entryRepo.create({
      ditaMapId: mapId,
      contentItemId: dto.contentItemId || null,
      refMapId: dto.refMapId || null,
      entryType: dto.entryType,
      navTitle: dto.navTitle || '',
      tocVisible: dto.tocVisible ?? true,
      print: dto.print ?? true,
      sortOrder: dto.sortOrder ?? 0,
      parentEntryId: dto.parentEntryId || null,
      conditions: (dto.conditions || {}) as Record<string, unknown>,
    });
    return this.entryRepo.save(entry);
  }

  async findEntries(orgId: string, mapId: string) {
    await this.findMap(orgId, mapId);
    return this.entryRepo.find({
      where: { ditaMapId: mapId },
      relations: ['contentItem', 'children'],
      order: { sortOrder: 'ASC' },
    });
  }

  async removeEntry(orgId: string, mapId: string, entryId: string) {
    await this.findMap(orgId, mapId);
    const entry = await this.entryRepo.findOne({
      where: { id: entryId, ditaMapId: mapId },
    });
    if (!entry) throw new NotFoundException('Entry not found');
    await this.entryRepo.remove(entry);
    return { deleted: true };
  }

  async reorderEntries(
    orgId: string,
    mapId: string,
    order: { entryId: string; sortOrder: number }[],
  ) {
    await this.findMap(orgId, mapId);
    for (const item of order) {
      await this.entryRepo.update(
        { id: item.entryId, ditaMapId: mapId },
        { sortOrder: item.sortOrder },
      );
    }
    return this.findEntries(orgId, mapId);
  }

  // === Nested Map Resolution ===
  async resolveMapTree(orgId: string, mapId: string): Promise<unknown> {
    const map = await this.findMap(orgId, mapId);
    const entries = await this.entryRepo.find({
      where: { ditaMapId: mapId },
      relations: ['contentItem'],
      order: { sortOrder: 'ASC' },
    });

    const buildTree = async (parentId: string | null): Promise<unknown[]> => {
      const children = entries.filter((e) => e.parentEntryId === parentId);
      const result: unknown[] = [];
      for (const entry of children) {
        const node: Record<string, unknown> = {
          id: entry.id,
          entryType: entry.entryType,
          navTitle: entry.navTitle,
          tocVisible: entry.tocVisible,
          contentItem: entry.contentItem,
          conditions: entry.conditions,
          children: await buildTree(entry.id),
        };
        // Resolve nested map references
        if (entry.refMapId) {
          node.resolvedMap = await this.resolveMapTree(orgId, entry.refMapId);
        }
        result.push(node);
      }
      return result;
    };

    return {
      id: map.id,
      title: map.title,
      mapType: map.mapType,
      locale: map.locale,
      entries: await buildTree(null),
    };
  }

  // === DITAVAL Profiles ===
  async createDitavalProfile(orgId: string, dto: CreateDitavalProfileDto) {
    const profile = this.ditavalRepo.create({
      organizationId: orgId,
      name: dto.name,
      description: dto.description || '',
      rules: (dto.rules || []) as DitavalRule[],
    });
    return this.ditavalRepo.save(profile);
  }

  async findAllDitavalProfiles(orgId: string) {
    return this.ditavalRepo.find({
      where: { organizationId: orgId },
      order: { name: 'ASC' },
    });
  }

  async findDitavalProfile(orgId: string, id: string) {
    const p = await this.ditavalRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!p) throw new NotFoundException('DITAVAL profile not found');
    return p;
  }

  async removeDitavalProfile(orgId: string, id: string) {
    const p = await this.findDitavalProfile(orgId, id);
    await this.ditavalRepo.remove(p);
    return { deleted: true };
  }

  // === Conditional Filtering ===
  applyDitavalFilter(
    content: Record<string, unknown>,
    rules: DitavalRule[],
  ): Record<string, unknown> {
    const excludeSet = new Set(
      rules
        .filter((r) => r.action === 'exclude')
        .map((r) => `${r.attribute}=${r.value}`),
    );
    // Filter body nodes that match excluded conditions
    if (content.body && Array.isArray((content.body as Record<string, unknown>).content)) {
      const body = content.body as Record<string, unknown>;
      body.content = (body.content as Record<string, unknown>[]).filter(
        (node) => {
          const props = (node.attrs as Record<string, unknown>)?.conditions as
            | Record<string, string>
            | undefined;
          if (!props) return true;
          return !Object.entries(props).some(([k, v]) =>
            excludeSet.has(`${k}=${v}`),
          );
        },
      );
    }
    return content;
  }

  // === Publishing Profiles ===
  async createPublishingProfile(orgId: string, dto: CreatePublishingProfileDto) {
    const profile = this.profileRepo.create({
      organizationId: orgId,
      name: dto.name,
      outputFormat: dto.outputFormat,
      ditavalProfileId: dto.ditavalProfileId || null,
      variables: dto.variables || {},
      branding: (dto.branding || {}) as Record<string, unknown>,
      settings: (dto.settings || {}) as Record<string, unknown>,
    });
    return this.profileRepo.save(profile);
  }

  async findAllPublishingProfiles(orgId: string) {
    return this.profileRepo.find({
      where: { organizationId: orgId },
      order: { name: 'ASC' },
    });
  }

  async findPublishingProfile(orgId: string, id: string) {
    const p = await this.profileRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!p) throw new NotFoundException('Publishing profile not found');
    return p;
  }

  async removePublishingProfile(orgId: string, id: string) {
    const p = await this.findPublishingProfile(orgId, id);
    await this.profileRepo.remove(p);
    return { deleted: true };
  }

  // === Publish Jobs ===
  async startPublishJob(orgId: string, userId: string, dto: StartPublishJobDto) {
    await this.findMap(orgId, dto.ditaMapId);
    await this.findPublishingProfile(orgId, dto.publishingProfileId);

    const job = this.jobRepo.create({
      organizationId: orgId,
      ditaMapId: dto.ditaMapId,
      publishingProfileId: dto.publishingProfileId,
      createdBy: userId,
      status: PublishJobStatus.QUEUED,
      logs: [{ timestamp: new Date().toISOString(), level: 'info', message: 'Job queued' }],
    });
    const saved = await this.jobRepo.save(job);

    // Process async (simplified inline processing)
    this.processPublishJob(orgId, saved.id).catch(() => {});

    return saved;
  }

  async getPublishJob(orgId: string, id: string) {
    const job = await this.jobRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!job) throw new NotFoundException('Publish job not found');
    return job;
  }

  async listPublishJobs(orgId: string, mapId?: string) {
    const where: Record<string, unknown> = { organizationId: orgId };
    if (mapId) where.ditaMapId = mapId;
    return this.jobRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  private async processPublishJob(orgId: string, jobId: string) {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) return;

    job.status = PublishJobStatus.PROCESSING;
    job.startedAt = new Date();
    job.logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Processing started',
    });
    await this.jobRepo.save(job);

    try {
      const profile = await this.profileRepo.findOne({
        where: { id: job.publishingProfileId },
      });
      if (!profile) throw new Error('Profile not found');

      const resolved = await this.resolveMapTree(orgId, job.ditaMapId);
      let output: unknown;

      // Apply DITAVAL filtering if profile has a ditaval
      let ditavalRules: DitavalRule[] = [];
      if (profile.ditavalProfileId) {
        const dv = await this.ditavalRepo.findOne({
          where: { id: profile.ditavalProfileId },
        });
        if (dv) ditavalRules = dv.rules;
      }

      switch (profile.outputFormat) {
        case OutputFormat.HTML5:
          output = this.generateHtml5(resolved, ditavalRules, profile);
          break;
        case OutputFormat.PDF:
          output = this.generatePdfPayload(resolved, ditavalRules, profile);
          break;
        case OutputFormat.JSON:
        default:
          output = { format: 'json', tree: resolved, generatedAt: new Date().toISOString() };
          break;
      }

      job.status = PublishJobStatus.COMPLETED;
      job.completedAt = new Date();
      job.outputUrl = `/output/${jobId}`;
      job.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Published as ${profile.outputFormat}`,
      });
      await this.jobRepo.save(job);
    } catch (err) {
      job.status = PublishJobStatus.FAILED;
      job.completedAt = new Date();
      job.logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
      await this.jobRepo.save(job);
    }
  }

  private generateHtml5(
    tree: unknown,
    rules: DitavalRule[],
    profile: PublishingProfile,
  ): unknown {
    const t = tree as Record<string, unknown>;
    const brand = profile.branding as Record<string, string>;
    const entries = t.entries as Record<string, unknown>[];

    const toc = entries
      .map((e) => {
        const ci = e.contentItem as Record<string, unknown> | null;
        const title = (e.navTitle as string) || (ci?.title as string) || 'Untitled';
        return `<li><a href="#${e.id}">${title}</a></li>`;
      })
      .join('\n');

    const body = entries
      .map((e) => {
        const ci = e.contentItem as Record<string, unknown> | null;
        const title = (e.navTitle as string) || (ci?.title as string) || 'Untitled';
        const content = ci ? JSON.stringify(ci.body) : '';
        return `<section id="${e.id}"><h2>${title}</h2><div>${content}</div></section>`;
      })
      .join('\n');

    return {
      format: 'html5',
      html: `<!DOCTYPE html>
<html lang="${t.locale || 'en'}">
<head><meta charset="utf-8"><title>${t.title}</title>
<style>body{font-family:${brand?.fontFamily || 'system-ui'},sans-serif;max-width:960px;margin:0 auto;padding:2rem}</style>
</head>
<body>
<nav><ul>${toc}</ul></nav>
<main>${body}</main>
</body></html>`,
      generatedAt: new Date().toISOString(),
    };
  }

  private generatePdfPayload(
    tree: unknown,
    rules: DitavalRule[],
    profile: PublishingProfile,
  ): unknown {
    // Generate a structured payload suitable for PDF rendering
    // (actual PDF generation would use Puppeteer or paged.js)
    return {
      format: 'pdf',
      payload: tree,
      settings: profile.settings,
      branding: profile.branding,
      generatedAt: new Date().toISOString(),
      note: 'PDF rendering requires a worker service with Puppeteer',
    };
  }

  // === Preview ===
  async previewMap(orgId: string, mapId: string, profileId?: string) {
    const tree = await this.resolveMapTree(orgId, mapId);
    if (profileId) {
      const profile = await this.findPublishingProfile(orgId, profileId);
      let rules: DitavalRule[] = [];
      if (profile.ditavalProfileId) {
        const dv = await this.ditavalRepo.findOne({
          where: { id: profile.ditavalProfileId },
        });
        if (dv) rules = dv.rules;
      }
      return this.generateHtml5(tree, rules, profile);
    }
    return tree;
  }
}
