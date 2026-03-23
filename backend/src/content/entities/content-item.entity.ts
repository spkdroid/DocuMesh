import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { ContentVersion } from './content-version.entity';
import { RelatedLink } from './related-link.entity';
import { TaskStep } from './task-step.entity';

export enum ContentType {
  TOPIC = 'topic',
  CONCEPT = 'concept',
  TASK = 'task',
  REFERENCE = 'reference',
  GLOSSARY = 'glossary',
  TROUBLESHOOTING = 'troubleshooting',
}

export enum ContentStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('content_items')
@Index(['organizationId', 'slug'], { unique: true })
export class ContentItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ length: 500 })
  slug: string;

  @Column({ type: 'enum', enum: ContentType, default: ContentType.TOPIC })
  type: ContentType;

  @Column({ length: 500 })
  title: string;

  @Column({ name: 'short_description', length: 1000, default: '' })
  shortDescription: string;

  @Column({ type: 'jsonb', default: {} })
  body: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @Column({ type: 'jsonb', name: 'prolog', default: {} })
  prolog: Record<string, unknown>;

  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.DRAFT })
  status: ContentStatus;

  @Column({ length: 10, default: 'en' })
  locale: string;

  @ManyToOne(() => ContentItem, (item) => item.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: ContentItem | null;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @OneToMany(() => ContentItem, (item) => item.parent)
  children: ContentItem[];

  @OneToMany(() => ContentVersion, (version) => version.contentItem)
  versions: ContentVersion[];

  @OneToMany(() => RelatedLink, (link) => link.sourceItem, { cascade: true })
  relatedLinks: RelatedLink[];

  @OneToMany(() => TaskStep, (step) => step.contentItem, { cascade: true })
  steps: TaskStep[];

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
