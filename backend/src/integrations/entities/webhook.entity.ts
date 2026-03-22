import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum WebhookEvent {
  CONTENT_CREATED = 'content.created',
  CONTENT_UPDATED = 'content.updated',
  CONTENT_DELETED = 'content.deleted',
  CONTENT_PUBLISHED = 'content.published',
  REVIEW_COMPLETED = 'review.completed',
  TRANSLATION_COMPLETED = 'translation.completed',
  MAP_PUBLISHED = 'map.published',
  WORKFLOW_TRANSITION = 'workflow.transition',
}

@Entity('webhooks')
@Index(['organizationId'])
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  secret: string;

  @Column('simple-array')
  events: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  failureCount: number;

  @Column({ nullable: true })
  lastTriggeredAt: Date;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
