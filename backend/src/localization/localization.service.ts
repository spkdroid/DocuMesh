import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocaleContent, TranslationStatus } from './entities/locale-content.entity';
import { LocaleConfig } from './entities/locale-config.entity';
import { TranslationJob, TranslationJobStatus } from './entities/translation-job.entity';
import { ContentItem } from '../content/entities/content-item.entity';
import { ContentVersion } from '../content/entities/content-version.entity';
import {
  CreateLocaleConfigDto,
  CreateLocaleContentDto,
  UpdateLocaleContentDto,
  StartTranslationJobDto,
} from './dto/localization.dto';

@Injectable()
export class LocalizationService {
  constructor(
    @InjectRepository(LocaleContent)
    private readonly localeContentRepo: Repository<LocaleContent>,
    @InjectRepository(LocaleConfig)
    private readonly configRepo: Repository<LocaleConfig>,
    @InjectRepository(TranslationJob)
    private readonly jobRepo: Repository<TranslationJob>,
    @InjectRepository(ContentItem)
    private readonly contentRepo: Repository<ContentItem>,
    @InjectRepository(ContentVersion)
    private readonly versionRepo: Repository<ContentVersion>,
  ) {}

  // === Locale Config ===
  async createLocaleConfig(orgId: string, dto: CreateLocaleConfigDto) {
    const config = this.configRepo.create({
      organizationId: orgId,
      locale: dto.locale,
      name: dto.name,
      fallbackChain: dto.fallbackChain || [],
      isDefault: dto.isDefault || false,
      isRtl: dto.isRtl || false,
    });
    return this.configRepo.save(config);
  }

  async findAllLocaleConfigs(orgId: string) {
    return this.configRepo.find({
      where: { organizationId: orgId },
      order: { locale: 'ASC' },
    });
  }

  async findLocaleConfig(orgId: string, id: string) {
    const c = await this.configRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!c) throw new NotFoundException('Locale config not found');
    return c;
  }

  async removeLocaleConfig(orgId: string, id: string) {
    const c = await this.findLocaleConfig(orgId, id);
    await this.configRepo.remove(c);
    return { deleted: true };
  }

  // === Locale Content ===
  async createLocaleContent(orgId: string, userId: string, dto: CreateLocaleContentDto) {
    const source = await this.contentRepo.findOne({
      where: { id: dto.sourceContentId, organizationId: orgId },
    });
    if (!source) throw new NotFoundException('Source content not found');

    const lastVersion = await this.versionRepo.findOne({
      where: { contentItemId: dto.sourceContentId },
      order: { versionNumber: 'DESC' },
    });

    const lc = this.localeContentRepo.create({
      organizationId: orgId,
      sourceContentId: dto.sourceContentId,
      locale: dto.locale,
      title: dto.title || source.title,
      shortDescription: dto.shortDescription || source.shortDescription,
      body: dto.body || source.body,
      metadata: dto.metadata || {},
      translationStatus: dto.translationStatus || TranslationStatus.NOT_TRANSLATED,
      sourceVersion: dto.sourceVersion || lastVersion?.versionNumber || 1,
      translatedBy: userId,
    });
    return this.localeContentRepo.save(lc);
  }

  async findLocaleContents(orgId: string, sourceContentId: string) {
    return this.localeContentRepo.find({
      where: { organizationId: orgId, sourceContentId },
      order: { locale: 'ASC' },
    });
  }

  async findLocaleContent(orgId: string, id: string) {
    const lc = await this.localeContentRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!lc) throw new NotFoundException('Locale content not found');
    return lc;
  }

  async updateLocaleContent(orgId: string, id: string, dto: UpdateLocaleContentDto) {
    const lc = await this.findLocaleContent(orgId, id);
    if (dto.title !== undefined) lc.title = dto.title;
    if (dto.shortDescription !== undefined) lc.shortDescription = dto.shortDescription;
    if (dto.body !== undefined) lc.body = dto.body;
    if (dto.metadata !== undefined) lc.metadata = dto.metadata;
    if (dto.translationStatus !== undefined) lc.translationStatus = dto.translationStatus;
    return this.localeContentRepo.save(lc);
  }

  async removeLocaleContent(orgId: string, id: string) {
    const lc = await this.findLocaleContent(orgId, id);
    await this.localeContentRepo.remove(lc);
    return { deleted: true };
  }

  // === Fallback resolution ===
  async resolveWithFallback(orgId: string, sourceContentId: string, locale: string) {
    // Try exact locale
    const exact = await this.localeContentRepo.findOne({
      where: { organizationId: orgId, sourceContentId, locale },
    });
    if (exact?.translationStatus === TranslationStatus.TRANSLATED ||
        exact?.translationStatus === TranslationStatus.REVIEWED) {
      return exact;
    }

    // Try fallback chain
    const config = await this.configRepo.findOne({
      where: { organizationId: orgId, locale },
    });
    if (config?.fallbackChain?.length) {
      for (const fb of config.fallbackChain) {
        const fallback = await this.localeContentRepo.findOne({
          where: { organizationId: orgId, sourceContentId, locale: fb },
        });
        if (fallback?.translationStatus === TranslationStatus.TRANSLATED ||
            fallback?.translationStatus === TranslationStatus.REVIEWED) {
          return { ...fallback, _fallbackFrom: locale, _resolvedLocale: fb };
        }
      }
    }

    // Fall back to source
    const source = await this.contentRepo.findOne({
      where: { id: sourceContentId, organizationId: orgId },
    });
    return { ...source, _fallbackFrom: locale, _resolvedLocale: source?.locale || 'en' };
  }

  // === Source change detection ===
  async detectOutOfDate(orgId: string) {
    const locales = await this.localeContentRepo.find({
      where: { organizationId: orgId },
    });

    const outOfDate: { localeContentId: string; locale: string; sourceContentId: string; currentSourceVersion: number; translatedVersion: number }[] = [];

    for (const lc of locales) {
      const latestVersion = await this.versionRepo.findOne({
        where: { contentItemId: lc.sourceContentId },
        order: { versionNumber: 'DESC' },
      });
      if (latestVersion && latestVersion.versionNumber > lc.sourceVersion) {
        outOfDate.push({
          localeContentId: lc.id,
          locale: lc.locale,
          sourceContentId: lc.sourceContentId,
          currentSourceVersion: latestVersion.versionNumber,
          translatedVersion: lc.sourceVersion,
        });

        // Auto-flag as out of date
        if (lc.translationStatus !== TranslationStatus.OUT_OF_DATE) {
          lc.translationStatus = TranslationStatus.OUT_OF_DATE;
          await this.localeContentRepo.save(lc);
        }
      }
    }

    return { outOfDate, total: outOfDate.length };
  }

  // === Translation status summary ===
  async getTranslationStatus(orgId: string, sourceContentId: string) {
    const locales = await this.localeContentRepo.find({
      where: { organizationId: orgId, sourceContentId },
    });
    const configs = await this.configRepo.find({
      where: { organizationId: orgId, enabled: true },
    });

    return configs.map((config) => {
      const lc = locales.find((l) => l.locale === config.locale);
      return {
        locale: config.locale,
        name: config.name,
        isRtl: config.isRtl,
        status: lc?.translationStatus || TranslationStatus.NOT_TRANSLATED,
        localeContentId: lc?.id || null,
      };
    });
  }

  // === Translation Jobs (TMS integration placeholder) ===
  async startTranslationJob(orgId: string, userId: string, dto: StartTranslationJobDto) {
    const source = await this.contentRepo.findOne({
      where: { id: dto.sourceContentId, organizationId: orgId },
    });
    if (!source) throw new NotFoundException('Source content not found');

    const job = this.jobRepo.create({
      organizationId: orgId,
      sourceContentId: dto.sourceContentId,
      sourceLocale: dto.sourceLocale,
      targetLocale: dto.targetLocale,
      provider: dto.provider || '',
      createdBy: userId,
      status: TranslationJobStatus.PENDING,
    });
    return this.jobRepo.save(job);
  }

  async findTranslationJobs(orgId: string, sourceContentId?: string) {
    const where: Record<string, unknown> = { organizationId: orgId };
    if (sourceContentId) where.sourceContentId = sourceContentId;
    return this.jobRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async updateTranslationJobStatus(orgId: string, id: string, status: TranslationJobStatus) {
    const job = await this.jobRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!job) throw new NotFoundException('Translation job not found');
    job.status = status;
    return this.jobRepo.save(job);
  }

  // === XLIFF export/import ===
  async exportXliff(orgId: string, sourceContentId: string, targetLocale: string) {
    const source = await this.contentRepo.findOne({
      where: { id: sourceContentId, organizationId: orgId },
    });
    if (!source) throw new NotFoundException('Source content not found');

    const target = await this.localeContentRepo.findOne({
      where: { organizationId: orgId, sourceContentId, locale: targetLocale },
    });

    // Build XLIFF 2.0 structure
    const xliff = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="2.0" xmlns="urn:oasis:names:tc:xliff:document:2.0"
       srcLang="${source.locale}" trgLang="${targetLocale}">
  <file id="${sourceContentId}">
    <unit id="title">
      <segment>
        <source>${this.escapeXml(source.title)}</source>
        <target>${this.escapeXml(target?.title || '')}</target>
      </segment>
    </unit>
    <unit id="shortDescription">
      <segment>
        <source>${this.escapeXml(source.shortDescription)}</source>
        <target>${this.escapeXml(target?.shortDescription || '')}</target>
      </segment>
    </unit>
    <unit id="body">
      <segment>
        <source>${this.escapeXml(JSON.stringify(source.body))}</source>
        <target>${this.escapeXml(target ? JSON.stringify(target.body) : '')}</target>
      </segment>
    </unit>
  </file>
</xliff>`;

    return { xliff, sourceLocale: source.locale, targetLocale };
  }

  async importXliff(orgId: string, userId: string, xliffContent: string) {
    // Parse XLIFF and extract translations
    // Simplified parser for key segments
    const srcLangMatch = xliffContent.match(/srcLang="([^"]+)"/);
    const trgLangMatch = xliffContent.match(/trgLang="([^"]+)"/);
    const fileIdMatch = xliffContent.match(/file id="([^"]+)"/);

    if (!srcLangMatch || !trgLangMatch || !fileIdMatch) {
      throw new NotFoundException('Invalid XLIFF format');
    }

    const targetLocale = trgLangMatch[1];
    const sourceContentId = fileIdMatch[1];

    // Extract target segments
    const titleMatch = xliffContent.match(
      /<unit id="title">[\s\S]*?<target>([\s\S]*?)<\/target>/,
    );
    const descMatch = xliffContent.match(
      /<unit id="shortDescription">[\s\S]*?<target>([\s\S]*?)<\/target>/,
    );

    let lc = await this.localeContentRepo.findOne({
      where: { organizationId: orgId, sourceContentId, locale: targetLocale },
    });

    if (lc) {
      if (titleMatch?.[1]) lc.title = this.unescapeXml(titleMatch[1]);
      if (descMatch?.[1]) lc.shortDescription = this.unescapeXml(descMatch[1]);
      lc.translationStatus = TranslationStatus.TRANSLATED;
      lc.translatedBy = userId;
    } else {
      lc = this.localeContentRepo.create({
        organizationId: orgId,
        sourceContentId,
        locale: targetLocale,
        title: titleMatch?.[1] ? this.unescapeXml(titleMatch[1]) : '',
        shortDescription: descMatch?.[1] ? this.unescapeXml(descMatch[1]) : '',
        body: {},
        translationStatus: TranslationStatus.TRANSLATED,
        translatedBy: userId,
      });
    }

    return this.localeContentRepo.save(lc);
  }

  // === Side-by-side data ===
  async getSideBySide(orgId: string, sourceContentId: string, targetLocale: string) {
    const source = await this.contentRepo.findOne({
      where: { id: sourceContentId, organizationId: orgId },
    });
    if (!source) throw new NotFoundException('Source content not found');

    const target = await this.localeContentRepo.findOne({
      where: { organizationId: orgId, sourceContentId, locale: targetLocale },
    });

    return {
      source: {
        locale: source.locale,
        title: source.title,
        shortDescription: source.shortDescription,
        body: source.body,
      },
      target: target
        ? {
            locale: target.locale,
            title: target.title,
            shortDescription: target.shortDescription,
            body: target.body,
            status: target.translationStatus,
          }
        : null,
    };
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private unescapeXml(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
  }
}
