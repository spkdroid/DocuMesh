import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export enum TranslationJobStatus {
  PENDING = 'pending',
  SENT = 'sent',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('translation_jobs')
export class TranslationJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'source_content_id' })
  sourceContentId: string;

  @Column({ name: 'source_locale', length: 10 })
  sourceLocale: string;

  @Column({ name: 'target_locale', length: 10 })
  targetLocale: string;

  @Column({
    type: 'enum',
    enum: TranslationJobStatus,
    default: TranslationJobStatus.PENDING,
  })
  status: TranslationJobStatus;

  /** TMS provider name (e.g. 'memoQ', 'phrase', 'trados') */
  @Column({ length: 100, default: '' })
  provider: string;

  @Column({ name: 'external_id', length: 255, default: '' })
  externalId: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
