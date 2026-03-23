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

@Entity('quality_scores')
@Index(['organizationId', 'contentItemId'])
export class QualityScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'content_item_id' })
  contentItemId: string;

  @Column({ type: 'int', default: 0 })
  overallScore: number;

  @Column({ type: 'float', name: 'readability_score', default: 0 })
  readabilityScore: number;

  @Column({ type: 'float', name: 'flesch_kincaid_grade', default: 0 })
  fleschKincaidGrade: number;

  @Column({ type: 'int', name: 'word_count', default: 0 })
  wordCount: number;

  @Column({ type: 'float', name: 'avg_sentence_length', default: 0 })
  avgSentenceLength: number;

  @Column({ type: 'int', name: 'structure_score', default: 0 })
  structureScore: number;

  @Column({ type: 'int', name: 'completeness_score', default: 0 })
  completenessScore: number;

  @Column({ type: 'int', name: 'broken_links', default: 0 })
  brokenLinks: number;

  @Column({ type: 'jsonb', default: [] })
  issues: { type: string; severity: string; message: string; field?: string }[];

  @CreateDateColumn({ name: 'scored_at' })
  scoredAt: Date;
}
