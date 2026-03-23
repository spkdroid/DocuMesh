import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import {
  OutputTemplate,
  ScheduledPublish,
  ScheduleStatus,
  CdnConfig,
  SiteBuild,
  BuildStatus,
} from './entities/publishing.entity';
import {
  CreateOutputTemplateDto,
  UpdateOutputTemplateDto,
  CreateScheduledPublishDto,
  UpsertCdnConfigDto,
  CreateSiteBuildDto,
} from './publishing.dto';
import { ContentItem, ContentStatus } from '../content/entities/content-item.entity';
import { Publication } from '../publications/entities/publication.entity';
import { PublicationEntry } from '../publications/entities/publication-entry.entity';

@Injectable()
export class PublishingService {
  constructor(
    @InjectRepository(OutputTemplate)
    private readonly templateRepo: Repository<OutputTemplate>,
    @InjectRepository(ScheduledPublish)
    private readonly scheduleRepo: Repository<ScheduledPublish>,
    @InjectRepository(CdnConfig)
    private readonly cdnRepo: Repository<CdnConfig>,
    @InjectRepository(SiteBuild)
    private readonly buildRepo: Repository<SiteBuild>,
    @InjectRepository(ContentItem)
    private readonly contentRepo: Repository<ContentItem>,
    @InjectRepository(Publication)
    private readonly pubRepo: Repository<Publication>,
    @InjectRepository(PublicationEntry)
    private readonly entryRepo: Repository<PublicationEntry>,
  ) {}

  /* ─── Output Templates ──────────────────── */

  async createTemplate(orgId: string, userId: string, dto: CreateOutputTemplateDto) {
    const tpl = this.templateRepo.create({
      organizationId: orgId,
      createdBy: userId,
      ...dto,
    });
    return this.templateRepo.save(tpl);
  }

  async listTemplates(orgId: string) {
    return this.templateRepo.find({
      where: { organizationId: orgId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTemplate(orgId: string, id: string) {
    const tpl = await this.templateRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!tpl) throw new NotFoundException('Output template not found');
    return tpl;
  }

  async updateTemplate(orgId: string, id: string, dto: UpdateOutputTemplateDto) {
    const tpl = await this.getTemplate(orgId, id);
    Object.assign(tpl, dto);
    return this.templateRepo.save(tpl);
  }

  async deleteTemplate(orgId: string, id: string) {
    const tpl = await this.getTemplate(orgId, id);
    await this.templateRepo.remove(tpl);
    return { deleted: true };
  }

  async previewTemplate(orgId: string, id: string) {
    const tpl = await this.getTemplate(orgId, id);
    const sampleVars: Record<string, string> = {
      title: 'Sample Document',
      author: 'DocMesh User',
      date: new Date().toLocaleDateString(),
      version: '1.0',
      orgName: 'Your Organization',
      ...tpl.variables,
    };

    let html = tpl.htmlTemplate || '<html><body>{{content}}</body></html>';
    for (const [key, val] of Object.entries(sampleVars)) {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
    }
    html = html.replace('{{content}}', '<h1>Sample Content</h1><p>This is a preview of your output template.</p>');

    return { html, css: tpl.cssStyles };
  }

  /* ─── Scheduled Publishing ──────────────── */

  async createSchedule(orgId: string, userId: string, dto: CreateScheduledPublishDto) {
    const schedule = this.scheduleRepo.create({
      organizationId: orgId,
      createdBy: userId,
      contentItemId: dto.contentItemId || null,
      publicationId: dto.publicationId || null,
      scheduledAt: new Date(dto.scheduledAt),
      notes: dto.notes || '',
    });
    return this.scheduleRepo.save(schedule);
  }

  async listSchedules(orgId: string) {
    return this.scheduleRepo.find({
      where: { organizationId: orgId },
      order: { scheduledAt: 'ASC' },
    });
  }

  async cancelSchedule(orgId: string, id: string) {
    const s = await this.scheduleRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!s) throw new NotFoundException('Scheduled publish not found');
    if (s.status !== ScheduleStatus.PENDING) {
      throw new ConflictException('Schedule is not pending');
    }
    s.status = ScheduleStatus.CANCELLED;
    return this.scheduleRepo.save(s);
  }

  async processDueSchedules(): Promise<number> {
    const due = await this.scheduleRepo.find({
      where: {
        status: ScheduleStatus.PENDING,
        scheduledAt: LessThanOrEqual(new Date()),
      },
    });

    let published = 0;
    for (const s of due) {
      try {
        if (s.contentItemId) {
          await this.contentRepo.update(
            { id: s.contentItemId, organizationId: s.organizationId },
            { status: ContentStatus.PUBLISHED },
          );
        }
        s.status = ScheduleStatus.PUBLISHED;
        published++;
      } catch {
        s.status = ScheduleStatus.FAILED;
      }
      await this.scheduleRepo.save(s);
    }
    return published;
  }

  /* ─── CDN Configuration ─────────────────── */

  async getCdnConfig(orgId: string) {
    return this.cdnRepo.findOne({ where: { organizationId: orgId } });
  }

  async upsertCdnConfig(orgId: string, dto: UpsertCdnConfigDto) {
    let config = await this.cdnRepo.findOne({ where: { organizationId: orgId } });

    if (config) {
      Object.assign(config, dto);
      if (dto.apiKey) config.apiKeyEncrypted = dto.apiKey; // In production, encrypt this
    } else {
      config = this.cdnRepo.create({
        organizationId: orgId,
        provider: dto.provider,
        baseUrl: dto.baseUrl || '',
        apiKeyEncrypted: dto.apiKey || '',
        zoneId: dto.zoneId || '',
        defaultTtl: dto.defaultTtl ?? 3600,
        ttlOverrides: dto.ttlOverrides || {},
        enabled: dto.enabled ?? false,
      });
    }
    return this.cdnRepo.save(config);
  }

  async purgeCache(orgId: string) {
    const config = await this.getCdnConfig(orgId);
    if (!config?.enabled) {
      throw new ConflictException('CDN not configured or not enabled');
    }
    // In production, call the CDN API to purge. Stub for now.
    return { purged: true, provider: config.provider, timestamp: new Date().toISOString() };
  }

  /* ─── Static Site Generation ────────────── */

  async triggerBuild(orgId: string, userId: string, dto: CreateSiteBuildDto) {
    const build = this.buildRepo.create({
      organizationId: orgId,
      publicationId: dto.publicationId,
      templateId: dto.templateId || null,
      theme: dto.theme || 'default',
      builtBy: userId,
      status: BuildStatus.QUEUED,
      buildLog: [{ timestamp: new Date().toISOString(), message: 'Build queued' }],
    });
    const saved = await this.buildRepo.save(build);

    // Run build async (in production, dispatch to a worker queue)
    this.runBuild(saved.id, orgId).catch(() => {});

    return saved;
  }

  async listBuilds(orgId: string, publicationId?: string) {
    const where: any = { organizationId: orgId };
    if (publicationId) where.publicationId = publicationId;
    return this.buildRepo.find({ where, order: { createdAt: 'DESC' }, take: 50 });
  }

  async getBuild(orgId: string, buildId: string) {
    const build = await this.buildRepo.findOne({
      where: { id: buildId, organizationId: orgId },
    });
    if (!build) throw new NotFoundException('Build not found');
    return build;
  }

  private async runBuild(buildId: string, orgId: string) {
    const build = await this.buildRepo.findOne({ where: { id: buildId } });
    if (!build) return;

    build.status = BuildStatus.BUILDING;
    build.buildLog.push({ timestamp: new Date().toISOString(), message: 'Build started' });
    await this.buildRepo.save(build);

    try {
      // Gather publication content
      const pub = await this.pubRepo.findOne({
        where: { id: build.publicationId, organizationId: orgId },
      });
      if (!pub) throw new Error('Publication not found');

      const entries = await this.entryRepo.find({
        where: { publicationId: pub.id },
        relations: ['contentItem'],
        order: { sortOrder: 'ASC' },
      });

      // Load template if specified
      let template: OutputTemplate | null = null;
      if (build.templateId) {
        template = await this.templateRepo.findOne({
          where: { id: build.templateId, organizationId: orgId },
        });
      }

      // Generate pages
      const pages: { slug: string; html: string }[] = [];
      for (const entry of entries) {
        if (!entry.contentItem) continue;
        const item = entry.contentItem;
        const bodyHtml = this.renderContentBody(item);
        const pageHtml = this.wrapInTemplate(bodyHtml, item.title, template, build.theme);
        pages.push({ slug: item.slug, html: pageHtml });
      }

      // Generate index page
      const tocHtml = pages.map(p => `<li><a href="${encodeURIComponent(p.slug)}.html">${p.slug}</a></li>`).join('\n');
      const indexBody = `<h1>${pub.title}</h1><nav><ul>${tocHtml}</ul></nav>`;
      const indexHtml = this.wrapInTemplate(indexBody, pub.title, template, build.theme);
      pages.unshift({ slug: 'index', html: indexHtml });

      build.fileCount = pages.length;
      build.totalSizeBytes = pages.reduce((sum, p) => sum + Buffer.byteLength(p.html), 0);
      build.outputUrl = `/builds/${build.id}/`;
      build.status = BuildStatus.COMPLETED;
      build.completedAt = new Date();
      build.buildLog.push({
        timestamp: new Date().toISOString(),
        message: `Build completed — ${pages.length} pages, ${build.totalSizeBytes} bytes`,
      });
    } catch (err) {
      build.status = BuildStatus.FAILED;
      build.buildLog.push({
        timestamp: new Date().toISOString(),
        message: `Build failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    }

    await this.buildRepo.save(build);
  }

  private renderContentBody(item: ContentItem): string {
    const parts: string[] = [];
    if (item.shortDescription) {
      parts.push(`<p class="shortdesc">${this.escapeHtml(item.shortDescription)}</p>`);
    }
    if (item.body && typeof item.body === 'object') {
      // TipTap JSON → simple HTML (basic rendering)
      parts.push(this.jsonToHtml(item.body));
    }
    return parts.join('\n');
  }

  private jsonToHtml(json: Record<string, unknown>): string {
    if (!json.content || !Array.isArray(json.content)) {
      return '<p>(no content)</p>';
    }
    return (json.content as any[])
      .map((node: any) => {
        if (node.type === 'paragraph') {
          const text = (node.content || []).map((c: any) => this.escapeHtml(c.text || '')).join('');
          return `<p>${text}</p>`;
        }
        if (node.type === 'heading') {
          const level = node.attrs?.level || 2;
          const text = (node.content || []).map((c: any) => this.escapeHtml(c.text || '')).join('');
          return `<h${level}>${text}</h${level}>`;
        }
        if (node.type === 'bulletList' || node.type === 'orderedList') {
          const tag = node.type === 'bulletList' ? 'ul' : 'ol';
          const items = (node.content || [])
            .map((li: any) => `<li>${this.jsonToHtml(li)}</li>`)
            .join('');
          return `<${tag}>${items}</${tag}>`;
        }
        return '';
      })
      .join('\n');
  }

  private wrapInTemplate(
    bodyHtml: string,
    title: string,
    template: OutputTemplate | null,
    theme: string,
  ): string {
    if (template?.htmlTemplate) {
      let html = template.htmlTemplate
        .replace(/\{\{title\}\}/g, this.escapeHtml(title))
        .replace(/\{\{content\}\}/g, bodyHtml)
        .replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
      if (template.cssStyles) {
        html = html.replace('</head>', `<style>${template.cssStyles}</style></head>`);
      }
      return html;
    }

    const themeClass = theme === 'api-reference' ? 'theme-api' : theme === 'kb' ? 'theme-kb' : 'theme-docs';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #1a1a2e; }
    h1, h2, h3 { color: #16213e; }
    .shortdesc { color: #667085; font-size: 1.1rem; margin-bottom: 1.5rem; }
    nav ul { list-style: none; padding: 0; }
    nav li { margin: .4rem 0; }
    nav a { color: #5046e5; text-decoration: none; }
    nav a:hover { text-decoration: underline; }
  </style>
</head>
<body class="${themeClass}">
  ${bodyHtml}
</body>
</html>`;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ─── Embed Widget ──────────────────────── */

  async getEmbedContent(slug: string, locale?: string) {
    const qb = this.contentRepo
      .createQueryBuilder('c')
      .where('c.slug = :slug', { slug })
      .andWhere('c.status = :status', { status: ContentStatus.PUBLISHED });

    if (locale) qb.andWhere('c.locale = :locale', { locale });

    const item = await qb.getOne();
    if (!item) throw new NotFoundException('Content not found');

    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      shortDescription: item.shortDescription,
      body: item.body,
      locale: item.locale,
      type: item.type,
    };
  }

  getEmbedScript(): string {
    return `(function(){
  var w=window,d=document;
  var baseUrl=d.currentScript.getAttribute('data-base')||'';
  var el=d.createElement('div');
  el.id='docmesh-widget';
  el.style.cssText='position:fixed;bottom:20px;right:20px;width:360px;max-height:500px;overflow:auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.12);padding:1rem;font-family:system-ui;display:none;z-index:99999';
  d.body.appendChild(el);
  var btn=d.createElement('button');
  btn.textContent='?';
  btn.style.cssText='position:fixed;bottom:20px;right:20px;width:48px;height:48px;border-radius:50%;background:#5046e5;color:#fff;border:none;font-size:1.4rem;cursor:pointer;z-index:100000;box-shadow:0 4px 12px rgba(80,70,229,.4)';
  d.body.appendChild(btn);
  btn.onclick=function(){el.style.display=el.style.display==='none'?'block':'none';btn.style.display=el.style.display==='none'?'block':'none'};
  el.innerHTML='<input id="dm-search" placeholder="Search docs..." style="width:100%;padding:.5rem;border:1px solid #d0d5dd;border-radius:6px;margin-bottom:.5rem"><div id="dm-results"></div><button onclick="this.parentElement.style.display=\\'none\\';document.querySelector(\\'button[style*=border-radius\\:50]\\').style.display=\\'block\\'" style="margin-top:.5rem;background:none;border:none;color:#5046e5;cursor:pointer">Close</button>';
  d.getElementById('dm-search').addEventListener('input',function(e){
    var q=e.target.value;if(q.length<2)return;
    fetch(baseUrl+'/deliver/'+encodeURIComponent(q)+'?lang='+(navigator.language||'en'))
      .then(function(r){return r.ok?r.json():null})
      .then(function(data){if(data)d.getElementById('dm-results').innerHTML='<h3>'+data.title+'</h3><p>'+(data.shortDescription||'')+'</p>'})
      .catch(function(){});
  });
})();`;
  }

  /* ─── Mobile SDK endpoint ───────────────── */

  async getMobileContent(orgId: string, locale?: string, since?: string) {
    const qb = this.contentRepo
      .createQueryBuilder('c')
      .where('c.organization_id = :orgId', { orgId })
      .andWhere('c.status = :status', { status: ContentStatus.PUBLISHED });

    if (locale) qb.andWhere('c.locale = :locale', { locale });
    if (since) qb.andWhere('c.updated_at > :since', { since: new Date(since) });

    const items = await qb.orderBy('c.updated_at', 'DESC').take(200).getMany();

    return {
      items: items.map(i => ({
        id: i.id,
        slug: i.slug,
        type: i.type,
        title: i.title,
        shortDescription: i.shortDescription,
        body: i.body,
        locale: i.locale,
        updatedAt: i.updatedAt,
      })),
      syncTimestamp: new Date().toISOString(),
    };
  }
}
