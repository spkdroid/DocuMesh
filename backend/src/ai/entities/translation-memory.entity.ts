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

@Entity('translation_memories')
@Index(['organizationId', 'sourceLocale', 'targetLocale'])
export class TranslationMemory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'source_locale', length: 10 })
  sourceLocale: string;

  @Column({ name: 'target_locale', length: 10 })
  targetLocale: string;

  @Column({ type: 'text', name: 'source_text' })
  sourceText: string;

  @Column({ type: 'text', name: 'target_text' })
  targetText: string;

  @Column({ name: 'content_item_id', type: 'uuid', nullable: true })
  contentItemId: string | null;

  @Column({ type: 'int', default: 100 })
  matchScore: number;

  @Column({ name: 'created_by', type: 'varchar', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
