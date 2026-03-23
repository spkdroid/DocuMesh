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

export enum NotificationType {
  REVIEW_ASSIGNED = 'review_assigned',
  REVIEW_COMPLETED = 'review_completed',
  STATUS_CHANGED = 'status_changed',
  COMMENT_ADDED = 'comment_added',
  MENTION = 'mention',
  DUE_DATE_REMINDER = 'due_date_reminder',
  PUBLISHED = 'published',
}

@Entity('notifications')
@Index(['userId', 'read'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'text', default: '' })
  message: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 100, nullable: true })
  entityType: string | null;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
