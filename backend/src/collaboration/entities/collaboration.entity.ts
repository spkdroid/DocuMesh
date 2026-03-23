import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export enum ApprovalChainStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ApprovalStepStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SKIPPED = 'skipped',
}

@Entity('approval_chains')
@Index(['organizationId', 'contentItemId'])
export class ApprovalChain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'content_item_id' })
  contentItemId: string;

  @Column({ length: 300 })
  title: string;

  @Column({ type: 'enum', enum: ApprovalChainStatus, default: ApprovalChainStatus.ACTIVE })
  status: ApprovalChainStatus;

  @Column({ type: 'int', name: 'current_step', default: 0 })
  currentStep: number;

  @Column({ type: 'jsonb', default: [] })
  steps: {
    stepNumber: number;
    title: string;
    assigneeIds: string[];
    requiredApprovals: number;
    parallel: boolean;
    status: ApprovalStepStatus;
    approvedBy: string[];
    rejectedBy: string[];
    completedAt: string | null;
  }[];

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('discussions')
@Index(['organizationId', 'contentItemId'])
export class Discussion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'content_item_id' })
  contentItemId: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'author_id' })
  authorId: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @Column({ type: 'jsonb', name: 'section_ref', nullable: true })
  sectionRef: { sectionId: string; from: number; to: number } | null;

  @Column({ type: 'simple-array', default: '' })
  mentions: string[];

  @Column({ default: false })
  resolved: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('content_locks')
@Index(['organizationId', 'contentItemId'], { unique: true })
export class ContentLock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'content_item_id' })
  contentItemId: string;

  @Column({ name: 'locked_by' })
  lockedBy: string;

  @Column({ length: 500, default: '' })
  reason: string;

  @Column({ type: 'enum', enum: ['freeze', 'editing'], default: 'freeze' })
  lockType: string;

  @CreateDateColumn({ name: 'locked_at' })
  lockedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;
}

@Entity('presence_records')
@Index(['organizationId', 'userId'])
export class PresenceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'user_name', length: 300, default: '' })
  userName: string;

  @Column({ name: 'content_item_id', nullable: true })
  contentItemId: string | null;

  @Column({ length: 50, default: 'online' })
  status: string;

  @Column({ name: 'last_seen', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastSeen: Date;
}
