import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentItem, ContentStatus } from '../content/entities/content-item.entity';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(ContentItem)
    private readonly contentRepo: Repository<ContentItem>,
  ) {}

  async getBySlug(slug: string, locale?: string, platform?: string) {
    const qb = this.contentRepo
      .createQueryBuilder('content')
      .where('content.slug = :slug', { slug })
      .andWhere('content.status = :status', {
        status: ContentStatus.PUBLISHED,
      });

    if (locale) {
      qb.andWhere('content.locale = :locale', { locale });
    }

    const item = await qb.getOne();

    if (!item) {
      throw new NotFoundException('Content not found or not published');
    }

    const response: Record<string, unknown> = {
      id: item.id,
      slug: item.slug,
      type: item.type,
      title: item.title,
      body: item.body,
      metadata: item.metadata,
      locale: item.locale,
    };

    if (platform && item.metadata?.['platforms']) {
      response['platformFiltered'] = true;
    }

    return response;
  }
}
