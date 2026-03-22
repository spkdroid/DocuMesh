import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ContentItem } from './content-item.entity';

export enum LinkRelationType {
  PARENT = 'parent',
  CHILD = 'child',
  SIBLING = 'sibling',
  SEE_ALSO = 'see_also',
  PREREQUISITE = 'prerequisite',
  NEXT = 'next',
  PREVIOUS = 'previous',
}

@Entity('related_links')
export class RelatedLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ContentItem, (item) => item.relatedLinks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'source_item_id' })
  sourceItem: ContentItem;

  @Column({ name: 'source_item_id' })
  sourceItemId: string;

  @ManyToOne(() => ContentItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_item_id' })
  targetItem: ContentItem;

  @Column({ name: 'target_item_id' })
  targetItemId: string;

  @Column({
    name: 'relation_type',
    type: 'enum',
    enum: LinkRelationType,
    default: LinkRelationType.SEE_ALSO,
  })
  relationType: LinkRelationType;

  @Column({ name: 'nav_title', length: 500, default: '' })
  navTitle: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
