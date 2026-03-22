import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('content_tags')
@Index(['organizationId', 'contentItemId', 'taxonomyTermId'], { unique: true })
@Index(['organizationId', 'contentItemId', 'freeformTag'])
export class ContentTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  contentItemId: string;

  @Column({ nullable: true })
  taxonomyTermId: string;

  @Column({ nullable: true })
  freeformTag: string;

  @Column()
  taggedBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
