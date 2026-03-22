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

export enum ReviewTaskStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CHANGES_REQUESTED = 'changes_requested',
}

@Entity('review_tasks')
@Index(['contentItemId'])
@Index(['assigneeId'])
export class ReviewTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'content_item_id' })
  contentItemId: string;

  @Column({ name: 'workflow_instance_id', nullable: true })
  workflowInstanceId: string | null;

  @Column({ name: 'assignee_id' })
  assigneeId: string;

  @Column({ name: 'assigned_by' })
  assignedBy: string;

  @Column({
    type: 'enum',
    enum: ReviewTaskStatus,
    default: ReviewTaskStatus.PENDING,
  })
  status: ReviewTaskStatus;

  @Column({ type: 'text', default: '' })
  instructions: string;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'text', name: 'review_notes', default: '' })
  reviewNotes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
