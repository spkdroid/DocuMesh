import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VersionLabel } from './entities/version-label.entity';
import { ContentBranch, BranchStatus } from './entities/content-branch.entity';
import { BranchSnapshot } from './entities/branch-snapshot.entity';
import { Baseline } from './entities/baseline.entity';
import { Release, ReleaseStatus } from './entities/release.entity';
import { ContentVersion } from '../content/entities/content-version.entity';
import { ContentItem, ContentStatus } from '../content/entities/content-item.entity';
import {
  CreateVersionLabelDto,
  CreateBranchDto,
  MergeBranchDto,
  CreateBaselineDto,
  RollbackDto,
  CreateReleaseDto,
  UpdateReleaseDto,
} from './dto/versioning.dto';

@Injectable()
export class VersioningService {
  constructor(
    @InjectRepository(VersionLabel)
    private readonly labelRepo: Repository<VersionLabel>,
    @InjectRepository(ContentBranch)
    private readonly branchRepo: Repository<ContentBranch>,
    @InjectRepository(BranchSnapshot)
    private readonly snapshotRepo: Repository<BranchSnapshot>,
    @InjectRepository(Baseline)
    private readonly baselineRepo: Repository<Baseline>,
    @InjectRepository(Release)
    private readonly releaseRepo: Repository<Release>,
    @InjectRepository(ContentVersion)
    private readonly versionRepo: Repository<ContentVersion>,
    @InjectRepository(ContentItem)
    private readonly contentRepo: Repository<ContentItem>,
  ) {}

  // === Version Diff ===
  async diffVersions(orgId: string, contentItemId: string, versionAId: string, versionBId: string) {
    const [a, b] = await Promise.all([
      this.versionRepo.findOne({ where: { id: versionAId, contentItemId } }),
      this.versionRepo.findOne({ where: { id: versionBId, contentItemId } }),
    ]);
    if (!a || !b) throw new NotFoundException('One or both versions not found');

    const changes: { field: string; before: unknown; after: unknown }[] = [];

    // Compare body
    const bodyA = JSON.stringify(a.body);
    const bodyB = JSON.stringify(b.body);
    if (bodyA !== bodyB) {
      changes.push({ field: 'body', before: a.body, after: b.body });
    }

    // Compare metadata
    const metaA = JSON.stringify(a.metadata);
    const metaB = JSON.stringify(b.metadata);
    if (metaA !== metaB) {
      changes.push({ field: 'metadata', before: a.metadata, after: b.metadata });
    }

    return {
      contentItemId,
      versionA: { id: a.id, versionNumber: a.versionNumber, createdAt: a.createdAt },
      versionB: { id: b.id, versionNumber: b.versionNumber, createdAt: b.createdAt },
      changes,
      identical: changes.length === 0,
    };
  }

  // === Version Labels ===
  async createLabel(orgId: string, userId: string, dto: CreateVersionLabelDto) {
    const version = await this.versionRepo.findOne({
      where: { id: dto.contentVersionId, contentItemId: dto.contentItemId },
    });
    if (!version) throw new NotFoundException('Version not found');

    const label = this.labelRepo.create({
      organizationId: orgId,
      contentItemId: dto.contentItemId,
      contentVersionId: dto.contentVersionId,
      label: dto.label,
      description: dto.description || '',
      createdBy: userId,
    });
    return this.labelRepo.save(label);
  }

  async findLabels(orgId: string, contentItemId: string) {
    return this.labelRepo.find({
      where: { organizationId: orgId, contentItemId },
      order: { createdAt: 'DESC' },
    });
  }

  async removeLabel(orgId: string, id: string) {
    const label = await this.labelRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!label) throw new NotFoundException('Label not found');
    await this.labelRepo.remove(label);
    return { deleted: true };
  }

  // === Branching ===
  async createBranch(orgId: string, userId: string, dto: CreateBranchDto) {
    const branch = this.branchRepo.create({
      organizationId: orgId,
      name: dto.name,
      description: dto.description || '',
      sourceBranchId: dto.sourceBranchId || null,
      createdBy: userId,
    });
    const saved = await this.branchRepo.save(branch);

    // Snapshot current state of requested content items into branch
    for (const contentId of dto.contentItemIds) {
      const latestVersion = await this.versionRepo.findOne({
        where: { contentItemId: contentId },
        order: { versionNumber: 'DESC' },
      });
      if (latestVersion) {
        await this.snapshotRepo.save(
          this.snapshotRepo.create({
            organizationId: orgId,
            branchId: saved.id,
            contentItemId: contentId,
            versionId: latestVersion.id,
            body: latestVersion.body,
            metadata: latestVersion.metadata,
          }),
        );
      }
    }

    return saved;
  }

  async findAllBranches(orgId: string) {
    return this.branchRepo.find({
      where: { organizationId: orgId },
      order: { createdAt: 'DESC' },
    });
  }

  async findBranch(orgId: string, id: string) {
    const branch = await this.branchRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async getBranchContents(orgId: string, branchId: string) {
    await this.findBranch(orgId, branchId);
    return this.snapshotRepo.find({
      where: { branchId, organizationId: orgId },
      order: { createdAt: 'ASC' },
    });
  }

  async closeBranch(orgId: string, id: string) {
    const branch = await this.findBranch(orgId, id);
    branch.status = BranchStatus.CLOSED;
    return this.branchRepo.save(branch);
  }

  // === Merge ===
  async mergeBranch(orgId: string, userId: string, dto: MergeBranchDto) {
    const source = await this.findBranch(orgId, dto.sourceBranchId);
    const target = await this.findBranch(orgId, dto.targetBranchId);

    const sourceSnapshots = await this.snapshotRepo.find({
      where: { branchId: source.id, organizationId: orgId },
    });

    const conflicts: { contentItemId: string; reason: string }[] = [];
    const merged: string[] = [];

    for (const snap of sourceSnapshots) {
      const targetSnap = await this.snapshotRepo.findOne({
        where: { branchId: target.id, contentItemId: snap.contentItemId },
      });

      if (targetSnap) {
        // Check for conflict: if target was also modified
        if (targetSnap.versionId !== snap.versionId &&
            JSON.stringify(targetSnap.body) !== JSON.stringify(snap.body)) {
          conflicts.push({
            contentItemId: snap.contentItemId,
            reason: 'Both branches modified this item',
          });
          continue;
        }
      }

      // Apply source snapshot to target branch
      if (targetSnap) {
        targetSnap.versionId = snap.versionId;
        targetSnap.body = snap.body;
        targetSnap.metadata = snap.metadata;
        await this.snapshotRepo.save(targetSnap);
      } else {
        await this.snapshotRepo.save(
          this.snapshotRepo.create({
            organizationId: orgId,
            branchId: target.id,
            contentItemId: snap.contentItemId,
            versionId: snap.versionId,
            body: snap.body,
            metadata: snap.metadata,
          }),
        );
      }
      merged.push(snap.contentItemId);
    }

    source.status = BranchStatus.MERGED;
    await this.branchRepo.save(source);

    return {
      sourceBranch: source.name,
      targetBranch: target.name,
      mergedItems: merged.length,
      conflicts,
      hasConflicts: conflicts.length > 0,
    };
  }

  // === Baselines ===
  async createBaseline(orgId: string, userId: string, dto: CreateBaselineDto) {
    // Validate all items/versions exist
    for (const item of dto.items) {
      const version = await this.versionRepo.findOne({
        where: { id: item.versionId, contentItemId: item.contentItemId },
      });
      if (!version) {
        throw new NotFoundException(
          `Version ${item.versionId} not found for content ${item.contentItemId}`,
        );
      }
    }

    const baseline = this.baselineRepo.create({
      organizationId: orgId,
      name: dto.name,
      description: dto.description || '',
      items: dto.items,
      createdBy: userId,
    });
    return this.baselineRepo.save(baseline);
  }

  async findAllBaselines(orgId: string) {
    return this.baselineRepo.find({
      where: { organizationId: orgId },
      order: { createdAt: 'DESC' },
    });
  }

  async findBaseline(orgId: string, id: string) {
    const b = await this.baselineRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!b) throw new NotFoundException('Baseline not found');
    return b;
  }

  async removeBaseline(orgId: string, id: string) {
    const b = await this.findBaseline(orgId, id);
    await this.baselineRepo.remove(b);
    return { deleted: true };
  }

  // === Rollback ===
  async rollback(orgId: string, userId: string, dto: RollbackDto) {
    const content = await this.contentRepo.findOne({
      where: { id: dto.contentItemId, organizationId: orgId },
    });
    if (!content) throw new NotFoundException('Content item not found');

    const targetVersion = await this.versionRepo.findOne({
      where: { id: dto.targetVersionId, contentItemId: dto.contentItemId },
    });
    if (!targetVersion) throw new NotFoundException('Target version not found');

    // Apply old version's data to current item
    content.body = targetVersion.body;
    content.metadata = targetVersion.metadata;
    content.updatedBy = userId;
    await this.contentRepo.save(content);

    // Create a new version recording the rollback
    const lastVersion = await this.versionRepo.findOne({
      where: { contentItemId: dto.contentItemId },
      order: { versionNumber: 'DESC' },
    });

    const newVersion = this.versionRepo.create({
      contentItemId: dto.contentItemId,
      versionNumber: (lastVersion?.versionNumber || 0) + 1,
      body: targetVersion.body,
      metadata: targetVersion.metadata,
      changeSummary: `Rolled back to version ${targetVersion.versionNumber}`,
      createdBy: userId,
    });
    await this.versionRepo.save(newVersion);

    return {
      contentItemId: dto.contentItemId,
      restoredFromVersion: targetVersion.versionNumber,
      newVersion: newVersion.versionNumber,
    };
  }

  // === Lifecycle ===
  async setLifecycleStatus(orgId: string, contentItemId: string, status: ContentStatus) {
    const content = await this.contentRepo.findOne({
      where: { id: contentItemId, organizationId: orgId },
    });
    if (!content) throw new NotFoundException('Content item not found');
    content.status = status;
    return this.contentRepo.save(content);
  }

  // === Releases ===
  async createRelease(orgId: string, userId: string, dto: CreateReleaseDto) {
    const release = this.releaseRepo.create({
      organizationId: orgId,
      name: dto.name,
      description: dto.description || '',
      version: dto.version || '',
      baselineId: dto.baselineId || null,
      targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
      createdBy: userId,
    });
    return this.releaseRepo.save(release);
  }

  async findAllReleases(orgId: string) {
    return this.releaseRepo.find({
      where: { organizationId: orgId },
      order: { createdAt: 'DESC' },
    });
  }

  async findRelease(orgId: string, id: string) {
    const r = await this.releaseRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!r) throw new NotFoundException('Release not found');
    return r;
  }

  async updateRelease(orgId: string, id: string, dto: UpdateReleaseDto) {
    const r = await this.findRelease(orgId, id);
    if (dto.name !== undefined) r.name = dto.name;
    if (dto.description !== undefined) r.description = dto.description;
    if (dto.status !== undefined) {
      r.status = dto.status;
      if (dto.status === ReleaseStatus.RELEASED) r.releasedAt = new Date();
    }
    if (dto.baselineId !== undefined) r.baselineId = dto.baselineId;
    if (dto.targetDate !== undefined) r.targetDate = new Date(dto.targetDate);
    return this.releaseRepo.save(r);
  }

  async removeRelease(orgId: string, id: string) {
    const r = await this.findRelease(orgId, id);
    await this.releaseRepo.remove(r);
    return { deleted: true };
  }
}
