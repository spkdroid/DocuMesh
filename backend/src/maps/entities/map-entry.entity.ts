import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { DitaMap } from './dita-map.entity';
import { ContentItem } from '../../content/entities/content-item.entity';

export enum EntryType {
  TOPICREF = 'topicref',
  TOPICHEAD = 'topichead',
  TOPICGROUP = 'topicgroup',
  MAPREF = 'mapref',
  CHAPTER = 'chapter',
  APPENDIX = 'appendix',
  FRONTMATTER = 'frontmatter',
  BACKMATTER = 'backmatter',
  GLOSSARYLIST = 'glossarylist',
  PART = 'part',
}

@Entity('map_entries')
export class MapEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DitaMap, (map) => map.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dita_map_id' })
  ditaMap: DitaMap;

  @Column({ name: 'dita_map_id' })
  ditaMapId: string;

  @ManyToOne(() => ContentItem, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'content_item_id' })
  contentItem: ContentItem | null;

  @Column({ name: 'content_item_id', type: 'uuid', nullable: true })
  contentItemId: string | null;

  @Column({ name: 'ref_map_id', type: 'uuid', nullable: true })
  refMapId: string | null;

  @Column({
    name: 'entry_type',
    type: 'enum',
    enum: EntryType,
    default: EntryType.TOPICREF,
  })
  entryType: EntryType;

  @Column({ name: 'nav_title', length: 500, default: '' })
  navTitle: string;

  @Column({ name: 'toc_visible', default: true })
  tocVisible: boolean;

  @Column({ default: true })
  print: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ManyToOne(() => MapEntry, (entry) => entry.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_entry_id' })
  parentEntry: MapEntry | null;

  @Column({ name: 'parent_entry_id', type: 'uuid', nullable: true })
  parentEntryId: string | null;

  @OneToMany(() => MapEntry, (entry) => entry.parentEntry)
  children: MapEntry[];

  @Column({ type: 'jsonb', default: {} })
  conditions: Record<string, unknown>;
}
