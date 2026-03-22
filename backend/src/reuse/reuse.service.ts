import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KeyMap } from './entities/key-map.entity';
import { Variable } from './entities/variable.entity';
import { ContentFragment } from './entities/content-fragment.entity';
import { ContentReference } from '../content/entities/content-reference.entity';
import { ContentItem } from '../content/entities/content-item.entity';
import { RelatedLink } from '../content/entities/related-link.entity';
import {
  CreateKeyMapDto,
  CreateVariableDto,
  CreateFragmentDto,
  UpdateKeyMapDto,
  UpdateVariableDto,
  UpdateFragmentDto,
} from './dto/reuse.dto';

@Injectable()
export class ReuseService {
  constructor(
    @InjectRepository(KeyMap)
    private readonly keyMapRepo: Repository<KeyMap>,
    @InjectRepository(Variable)
    private readonly variableRepo: Repository<Variable>,
    @InjectRepository(ContentFragment)
    private readonly fragmentRepo: Repository<ContentFragment>,
    @InjectRepository(ContentReference)
    private readonly referenceRepo: Repository<ContentReference>,
    @InjectRepository(ContentItem)
    private readonly contentRepo: Repository<ContentItem>,
    @InjectRepository(RelatedLink)
    private readonly relatedLinkRepo: Repository<RelatedLink>,
  ) {}

  // === Key Maps ===
  async createKeyMap(orgId: string, dto: CreateKeyMapDto) {
    const keyMap = this.keyMapRepo.create({
      organizationId: orgId,
      keyName: dto.keyName,
      targetContentId: dto.targetContentId || null,
      value: dto.value || '',
      description: dto.description || '',
      scope: dto.scope || 'global',
    });
    return this.keyMapRepo.save(keyMap);
  }

  async findAllKeyMaps(orgId: string, scope?: string) {
    const where: Record<string, unknown> = { organizationId: orgId };
    if (scope) where.scope = scope;
    return this.keyMapRepo.find({ where, order: { keyName: 'ASC' } });
  }

  async findKeyMap(orgId: string, id: string) {
    const km = await this.keyMapRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!km) throw new NotFoundException('Key map not found');
    return km;
  }

  async updateKeyMap(orgId: string, id: string, dto: UpdateKeyMapDto) {
    const km = await this.findKeyMap(orgId, id);
    if (dto.targetContentId !== undefined) km.targetContentId = dto.targetContentId;
    if (dto.value !== undefined) km.value = dto.value;
    if (dto.description !== undefined) km.description = dto.description;
    if (dto.scope !== undefined) km.scope = dto.scope;
    return this.keyMapRepo.save(km);
  }

  async removeKeyMap(orgId: string, id: string) {
    const km = await this.findKeyMap(orgId, id);
    await this.keyMapRepo.remove(km);
    return { deleted: true };
  }

  async resolveKey(orgId: string, keyName: string, scope?: string) {
    const where: Record<string, unknown> = { organizationId: orgId, keyName };
    if (scope) where.scope = scope;
    const km = await this.keyMapRepo.findOne({ where });
    if (!km) throw new NotFoundException(`Key "${keyName}" not found`);
    if (km.targetContentId) {
      const content = await this.contentRepo.findOne({
        where: { id: km.targetContentId },
      });
      return { key: km, resolvedContent: content };
    }
    return { key: km, resolvedContent: null };
  }

  // === Variables ===
  async createVariable(orgId: string, dto: CreateVariableDto) {
    const variable = this.variableRepo.create({
      organizationId: orgId,
      name: dto.name,
      value: dto.value,
      description: dto.description || '',
      scope: dto.scope || 'global',
    });
    return this.variableRepo.save(variable);
  }

  async findAllVariables(orgId: string, scope?: string) {
    const where: Record<string, unknown> = { organizationId: orgId };
    if (scope) where.scope = scope;
    return this.variableRepo.find({ where, order: { name: 'ASC' } });
  }

  async findVariable(orgId: string, id: string) {
    const v = await this.variableRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!v) throw new NotFoundException('Variable not found');
    return v;
  }

  async updateVariable(orgId: string, id: string, dto: UpdateVariableDto) {
    const v = await this.findVariable(orgId, id);
    if (dto.value !== undefined) v.value = dto.value;
    if (dto.description !== undefined) v.description = dto.description;
    if (dto.scope !== undefined) v.scope = dto.scope;
    return this.variableRepo.save(v);
  }

  async removeVariable(orgId: string, id: string) {
    const v = await this.findVariable(orgId, id);
    await this.variableRepo.remove(v);
    return { deleted: true };
  }

  async resolveVariables(orgId: string, text: string, scope?: string) {
    const variables = await this.findAllVariables(orgId, scope);
    let resolved = text;
    for (const v of variables) {
      resolved = resolved.replace(
        new RegExp(`\\$\\{${v.name}\\}`, 'g'),
        v.value,
      );
    }
    return { original: text, resolved, variablesApplied: variables.length };
  }

  // === Content Fragments ===
  async createFragment(orgId: string, dto: CreateFragmentDto) {
    const slug =
      dto.slug ||
      dto.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    const fragment = this.fragmentRepo.create({
      organizationId: orgId,
      title: dto.title,
      slug,
      body: dto.body || {},
      fragmentType: dto.fragmentType || 'block',
      tags: dto.tags || [],
    });
    return this.fragmentRepo.save(fragment);
  }

  async findAllFragments(orgId: string) {
    return this.fragmentRepo.find({
      where: { organizationId: orgId },
      order: { title: 'ASC' },
    });
  }

  async findFragment(orgId: string, id: string) {
    const f = await this.fragmentRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!f) throw new NotFoundException('Fragment not found');
    return f;
  }

  async updateFragment(orgId: string, id: string, dto: UpdateFragmentDto) {
    const f = await this.findFragment(orgId, id);
    if (dto.title !== undefined) f.title = dto.title;
    if (dto.body !== undefined) f.body = dto.body;
    if (dto.fragmentType !== undefined) f.fragmentType = dto.fragmentType;
    if (dto.tags !== undefined) f.tags = dto.tags;
    return this.fragmentRepo.save(f);
  }

  async removeFragment(orgId: string, id: string) {
    const f = await this.findFragment(orgId, id);
    await this.fragmentRepo.remove(f);
    return { deleted: true };
  }

  // === Where-Used Tracking ===
  async getWhereUsed(orgId: string, contentId: string) {
    // Find all references where this item is the target
    const asTarget = await this.referenceRepo.find({
      where: { targetId: contentId },
      relations: ['source'],
    });

    // Find all related links pointing to this item
    const asRelatedTarget = await this.relatedLinkRepo.find({
      where: { targetItemId: contentId },
      relations: ['sourceItem'],
    });

    // Find key maps pointing to this content
    const keyMaps = await this.keyMapRepo.find({
      where: { organizationId: orgId, targetContentId: contentId },
    });

    return {
      contentId,
      referencedBy: asTarget.map((r) => ({
        id: r.sourceId,
        title: r.source?.title,
        refType: r.refType,
      })),
      relatedLinkSources: asRelatedTarget.map((l) => ({
        id: l.sourceItemId,
        title: l.sourceItem?.title,
        relationType: l.relationType,
      })),
      keyMaps: keyMaps.map((km) => ({
        id: km.id,
        keyName: km.keyName,
        scope: km.scope,
      })),
      totalUsages:
        asTarget.length + asRelatedTarget.length + keyMaps.length,
    };
  }

  // === Dependency Graph ===
  async getDependencyGraph(orgId: string, contentId: string) {
    // Forward deps: things this item references
    const outgoingRefs = await this.referenceRepo.find({
      where: { sourceId: contentId },
      relations: ['target'],
    });

    const outgoingLinks = await this.relatedLinkRepo.find({
      where: { sourceItemId: contentId },
      relations: ['targetItem'],
    });

    // Reverse deps: things that reference this item
    const incomingRefs = await this.referenceRepo.find({
      where: { targetId: contentId },
      relations: ['source'],
    });

    const incomingLinks = await this.relatedLinkRepo.find({
      where: { targetItemId: contentId },
      relations: ['sourceItem'],
    });

    return {
      contentId,
      dependsOn: [
        ...outgoingRefs.map((r) => ({
          id: r.targetId,
          title: r.target?.title,
          type: 'reference',
          refType: r.refType,
        })),
        ...outgoingLinks.map((l) => ({
          id: l.targetItemId,
          title: l.targetItem?.title,
          type: 'related_link',
          refType: l.relationType,
        })),
      ],
      dependedOnBy: [
        ...incomingRefs.map((r) => ({
          id: r.sourceId,
          title: r.source?.title,
          type: 'reference',
          refType: r.refType,
        })),
        ...incomingLinks.map((l) => ({
          id: l.sourceItemId,
          title: l.sourceItem?.title,
          type: 'related_link',
          refType: l.relationType,
        })),
      ],
    };
  }

  // === Broken Reference Detection ===
  async detectBrokenReferences(orgId: string) {
    // Check content references
    const refs = await this.referenceRepo
      .createQueryBuilder('ref')
      .innerJoin('ref.source', 'source')
      .leftJoin('ref.target', 'target')
      .where('source.organization_id = :orgId', { orgId })
      .andWhere('target.id IS NULL')
      .select(['ref.id', 'ref.sourceId', 'ref.targetId', 'ref.refType'])
      .getMany();

    // Check related links
    const links = await this.relatedLinkRepo
      .createQueryBuilder('link')
      .innerJoin('link.sourceItem', 'source')
      .leftJoin('link.targetItem', 'target')
      .where('source.organization_id = :orgId', { orgId })
      .andWhere('target.id IS NULL')
      .select([
        'link.id',
        'link.sourceItemId',
        'link.targetItemId',
        'link.relationType',
      ])
      .getMany();

    // Check key maps
    const keyMaps = await this.keyMapRepo
      .createQueryBuilder('km')
      .leftJoin(
        ContentItem,
        'content',
        'content.id = km.target_content_id',
      )
      .where('km.organization_id = :orgId', { orgId })
      .andWhere('km.target_content_id IS NOT NULL')
      .andWhere('content.id IS NULL')
      .select(['km.id', 'km.keyName', 'km.targetContentId'])
      .getMany();

    return {
      brokenReferences: refs,
      brokenRelatedLinks: links,
      brokenKeyMaps: keyMaps,
      totalBroken: refs.length + links.length + keyMaps.length,
    };
  }
}
