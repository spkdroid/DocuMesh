import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export enum AuditAction {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  STATUS_CHANGED = 'status_changed',
  WORKFLOW_TRANSITION = 'workflow_transition',
  REVIEW_ASSIGNED = 'review_assigned',
  REVIEW_COMPLETED = 'review_completed',
  PUBLISHED = 'published',
  ROLLED_BACK = 'rolled_back',
}

@Entity('audit_entries')
@Index(['entityType', 'entityId'])
@Index(['organizationId', 'createdAt'])
export class AuditEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'entity_type', length: 100 })
  entityType: string;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ type: 'jsonb', default: {} })
  details: Record<string, unknown>;

  @Column({ name: 'from_state', type: 'varchar', length: 100, nullable: true })
  fromState: string | null;

  @Column({ name: 'to_state', type: 'varchar', length: 100, nullable: true })
  toState: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
