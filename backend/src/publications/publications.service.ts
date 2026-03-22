import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Publication } from './entities/publication.entity';
import { PublicationEntry } from './entities/publication-entry.entity';
import { CreatePublicationDto } from './dto/create-publication.dto';

@Injectable()
export class PublicationsService {
  constructor(
    @InjectRepository(Publication)
    private readonly pubRepo: Repository<Publication>,
    @InjectRepository(PublicationEntry)
    private readonly entryRepo: Repository<PublicationEntry>,
  ) {}

  async create(orgId: string, dto: CreatePublicationDto) {
    const slug =
      dto.slug ||
      dto.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const pub = this.pubRepo.create({
      organizationId: orgId,
      title: dto.title,
      slug,
      locale: dto.locale || 'en',
    });

    return this.pubRepo.save(pub);
  }

  async findAll(orgId: string) {
    return this.pubRepo.find({
      where: { organizationId: orgId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(orgId: string, id: string) {
    const pub = await this.pubRepo.findOne({
      where: { id, organizationId: orgId },
      relations: ['entries', 'entries.contentItem', 'entries.children'],
    });
    if (!pub) {
      throw new NotFoundException('Publication not found');
    }
    return pub;
  }

  async remove(orgId: string, id: string) {
    const pub = await this.findOne(orgId, id);
    await this.pubRepo.remove(pub);
    return { deleted: true };
  }

  async addEntry(
    orgId: string,
    pubId: string,
    contentItemId: string,
    parentEntryId?: string,
    sortOrder?: number,
  ) {
    await this.findOne(orgId, pubId);

    const entry = this.entryRepo.create({
      publicationId: pubId,
      contentItemId,
      parentEntryId: parentEntryId || null,
      sortOrder: sortOrder || 0,
    });

    return this.entryRepo.save(entry);
  }

  async removeEntry(orgId: string, pubId: string, entryId: string) {
    await this.findOne(orgId, pubId);
    const entry = await this.entryRepo.findOne({ where: { id: entryId } });
    if (!entry) {
      throw new NotFoundException('Publication entry not found');
    }
    await this.entryRepo.remove(entry);
    return { deleted: true };
  }
}
