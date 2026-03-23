import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  ApprovalChain,
  ApprovalChainStatus,
  ApprovalStepStatus,
  Discussion,
  ContentLock,
  PresenceRecord,
} from './entities/collaboration.entity';
import {
  CreateApprovalChainDto,
  ApproveStepDto,
  CreateDiscussionDto,
  CreateLockDto,
  UpdatePresenceDto,
} from './dto/collaboration.dto';

@Injectable()
export class CollaborationService {
  constructor(
    @InjectRepository(ApprovalChain)
    private readonly approvalRepo: Repository<ApprovalChain>,
    @InjectRepository(Discussion)
    private readonly discussionRepo: Repository<Discussion>,
    @InjectRepository(ContentLock)
    private readonly lockRepo: Repository<ContentLock>,
    @InjectRepository(PresenceRecord)
    private readonly presenceRepo: Repository<PresenceRecord>,
  ) {}

  /* ─── Approval Chains ─────────────────────────────── */

  async createApprovalChain(
    orgId: string,
    userId: string,
    dto: CreateApprovalChainDto,
  ): Promise<ApprovalChain> {
    const steps = dto.steps.map((s, i) => ({
      stepNumber: s.stepNumber ?? i,
      title: s.title,
      assigneeIds: s.assigneeIds,
      requiredApprovals: s.requiredApprovals ?? 1,
      parallel: s.parallel ?? false,
      status: ApprovalStepStatus.PENDING,
      approvedBy: [] as string[],
      rejectedBy: [] as string[],
      completedAt: null,
    }));

    const chain = this.approvalRepo.create({
      organizationId: orgId,
      contentItemId: dto.contentItemId,
      title: dto.title,
      createdBy: userId,
      steps,
      currentStep: 0,
    });
    return this.approvalRepo.save(chain);
  }

  async getApprovalChain(orgId: string, chainId: string): Promise<ApprovalChain> {
    const chain = await this.approvalRepo.findOne({
      where: { id: chainId, organizationId: orgId },
    });
    if (!chain) throw new NotFoundException('Approval chain not found');
    return chain;
  }

  async listApprovalChains(orgId: string, contentItemId?: string) {
    const where: any = { organizationId: orgId };
    if (contentItemId) where.contentItemId = contentItemId;
    return this.approvalRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async advanceApproval(
    orgId: string,
    userId: string,
    chainId: string,
    dto: ApproveStepDto,
  ): Promise<ApprovalChain> {
    const chain = await this.getApprovalChain(orgId, chainId);
    if (chain.status !== ApprovalChainStatus.ACTIVE) {
      throw new ConflictException('Approval chain is not active');
    }

    const step = chain.steps[chain.currentStep];
    if (!step) throw new ConflictException('No current step');

    if (!step.assigneeIds.includes(userId)) {
      throw new ForbiddenException('You are not an assignee of this step');
    }

    if (dto.decision === 'approved') {
      if (!step.approvedBy.includes(userId)) step.approvedBy.push(userId);
      if (step.approvedBy.length >= step.requiredApprovals) {
        step.status = ApprovalStepStatus.APPROVED;
        step.completedAt = new Date().toISOString();
        chain.currentStep++;
        if (chain.currentStep >= chain.steps.length) {
          chain.status = ApprovalChainStatus.COMPLETED;
        }
      }
    } else {
      if (!step.rejectedBy.includes(userId)) step.rejectedBy.push(userId);
      step.status = ApprovalStepStatus.REJECTED;
      step.completedAt = new Date().toISOString();
      chain.status = ApprovalChainStatus.CANCELLED;
    }

    return this.approvalRepo.save(chain);
  }

  async cancelApprovalChain(orgId: string, chainId: string): Promise<ApprovalChain> {
    const chain = await this.getApprovalChain(orgId, chainId);
    chain.status = ApprovalChainStatus.CANCELLED;
    return this.approvalRepo.save(chain);
  }

  /* ─── Discussions ──────────────────────────────────── */

  async createDiscussion(
    orgId: string,
    userId: string,
    dto: CreateDiscussionDto,
  ): Promise<Discussion> {
    const disc = this.discussionRepo.create({
      organizationId: orgId,
      contentItemId: dto.contentItemId,
      body: dto.body,
      authorId: userId,
      parentId: dto.parentId ?? null,
      sectionRef: dto.sectionRef ?? null,
      mentions: dto.mentions ?? [],
    });
    return this.discussionRepo.save(disc);
  }

  async listDiscussions(orgId: string, contentItemId: string) {
    return this.discussionRepo.find({
      where: { organizationId: orgId, contentItemId },
      order: { createdAt: 'ASC' },
    });
  }

  async resolveDiscussion(orgId: string, discussionId: string): Promise<Discussion> {
    const disc = await this.discussionRepo.findOne({
      where: { id: discussionId, organizationId: orgId },
    });
    if (!disc) throw new NotFoundException('Discussion not found');
    disc.resolved = true;
    return this.discussionRepo.save(disc);
  }

  async deleteDiscussion(orgId: string, discussionId: string): Promise<void> {
    const disc = await this.discussionRepo.findOne({
      where: { id: discussionId, organizationId: orgId },
    });
    if (!disc) throw new NotFoundException('Discussion not found');
    await this.discussionRepo.remove(disc);
  }

  /* ─── Content Locks ────────────────────────────────── */

  async acquireLock(orgId: string, userId: string, dto: CreateLockDto): Promise<ContentLock> {
    // Remove expired locks first
    await this.lockRepo.delete({
      organizationId: orgId,
      contentItemId: dto.contentItemId,
      expiresAt: LessThan(new Date()),
    });

    const existing = await this.lockRepo.findOne({
      where: { organizationId: orgId, contentItemId: dto.contentItemId },
    });
    if (existing) {
      throw new ConflictException(
        `Content is already locked by ${existing.lockedBy} (${existing.lockType})`,
      );
    }

    const lock = this.lockRepo.create({
      organizationId: orgId,
      contentItemId: dto.contentItemId,
      lockedBy: userId,
      reason: dto.reason ?? '',
      lockType: dto.lockType ?? 'freeze',
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
    return this.lockRepo.save(lock);
  }

  async releaseLock(orgId: string, contentItemId: string): Promise<void> {
    const lock = await this.lockRepo.findOne({
      where: { organizationId: orgId, contentItemId },
    });
    if (!lock) throw new NotFoundException('No lock found');
    await this.lockRepo.remove(lock);
  }

  async getLock(orgId: string, contentItemId: string): Promise<ContentLock | null> {
    return this.lockRepo.findOne({
      where: { organizationId: orgId, contentItemId },
    });
  }

  async listLocks(orgId: string) {
    return this.lockRepo.find({
      where: { organizationId: orgId },
      order: { lockedAt: 'DESC' },
    });
  }

  /* ─── Presence ─────────────────────────────────────── */

  async heartbeat(
    orgId: string,
    userId: string,
    userName: string,
    dto: UpdatePresenceDto,
  ): Promise<PresenceRecord> {
    let record = await this.presenceRepo.findOne({
      where: { organizationId: orgId, userId },
    });

    if (record) {
      record.lastSeen = new Date();
      if (dto.contentItemId !== undefined) record.contentItemId = dto.contentItemId;
      if (dto.status) record.status = dto.status;
      record.userName = userName;
    } else {
      record = this.presenceRepo.create({
        organizationId: orgId,
        userId,
        userName,
        contentItemId: dto.contentItemId ?? null,
        status: dto.status ?? 'online',
        lastSeen: new Date(),
      });
    }
    return this.presenceRepo.save(record);
  }

  async getPresence(orgId: string, contentItemId?: string) {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000); // last 5 min
    const qb = this.presenceRepo
      .createQueryBuilder('p')
      .where('p.organization_id = :orgId', { orgId })
      .andWhere('p.last_seen > :cutoff', { cutoff })
      .orderBy('p.last_seen', 'DESC');

    if (contentItemId) {
      qb.andWhere('p.content_item_id = :contentItemId', { contentItemId });
    }
    return qb.getMany();
  }

  async clearPresence(orgId: string, userId: string): Promise<void> {
    await this.presenceRepo.delete({ organizationId: orgId, userId });
  }
}
