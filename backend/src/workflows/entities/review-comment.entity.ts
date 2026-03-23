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

@Entity('review_comments')
@Index(['contentItemId'])
export class ReviewComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'content_item_id' })
  contentItemId: string;

  @Column({ name: 'review_task_id', type: 'uuid', nullable: true })
  reviewTaskId: string | null;

  @Column({ name: 'author_id' })
  authorId: string;

  @Column({ type: 'text' })
  body: string;

  /** JSON range: { from: number, to: number } for inline annotations */
  @Column({ type: 'jsonb', name: 'text_range', nullable: true })
  textRange: { from: number; to: number } | null;

  @Column({ name: 'parent_comment_id', type: 'uuid', nullable: true })
  parentCommentId: string | null;

  @Column({ default: false })
  resolved: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
