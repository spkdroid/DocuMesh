import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ContentItem } from './content-item.entity';

export enum ReferenceType {
  EMBED = 'embed',
  LINK = 'link',
  CONREF = 'conref',
}

@Entity('content_references')
export class ContentReference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ContentItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_id' })
  source: ContentItem;

  @Column({ name: 'source_id' })
  sourceId: string;

  @ManyToOne(() => ContentItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_id' })
  target: ContentItem;

  @Column({ name: 'target_id' })
  targetId: string;

  @Column({
    name: 'ref_type',
    type: 'enum',
    enum: ReferenceType,
    default: ReferenceType.LINK,
  })
  refType: ReferenceType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
