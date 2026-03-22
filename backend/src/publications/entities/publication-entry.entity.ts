import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Publication } from './publication.entity';
import { ContentItem } from '../../content/entities/content-item.entity';

@Entity('publication_entries')
export class PublicationEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Publication, (pub) => pub.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'publication_id' })
  publication: Publication;

  @Column({ name: 'publication_id' })
  publicationId: string;

  @ManyToOne(() => ContentItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_item_id' })
  contentItem: ContentItem;

  @Column({ name: 'content_item_id' })
  contentItemId: string;

  @ManyToOne(() => PublicationEntry, (entry) => entry.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_entry_id' })
  parentEntry: PublicationEntry | null;

  @Column({ name: 'parent_entry_id', nullable: true })
  parentEntryId: string | null;

  @OneToMany(() => PublicationEntry, (entry) => entry.parentEntry)
  children: PublicationEntry[];

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
