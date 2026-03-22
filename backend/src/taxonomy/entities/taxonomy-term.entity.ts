import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('taxonomy_terms')
@Index(['organizationId', 'taxonomyName', 'slug'], { unique: true })
export class TaxonomyTerm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  taxonomyName: string; // 'product', 'audience', 'category', 'technology'

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ default: '' })
  description: string;

  @Column({ nullable: true })
  parentId: string;

  @ManyToOne(() => TaxonomyTerm, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent: TaxonomyTerm;

  @Column({ default: 0 })
  sortOrder: number;

  @Column('jsonb', { default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
