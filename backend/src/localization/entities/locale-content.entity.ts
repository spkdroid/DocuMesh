import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export enum TranslationStatus {
  NOT_TRANSLATED = 'not_translated',
  IN_TRANSLATION = 'in_translation',
  TRANSLATED = 'translated',
  REVIEWED = 'reviewed',
  OUT_OF_DATE = 'out_of_date',
}

@Entity('locale_contents')
@Index(['organizationId', 'sourceContentId', 'locale'], { unique: true })
export class LocaleContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'source_content_id' })
  sourceContentId: string;

  @Column({ length: 10 })
  locale: string;

  @Column({ length: 500, default: '' })
  title: string;

  @Column({ name: 'short_description', type: 'text', default: '' })
  shortDescription: string;

  @Column({ type: 'jsonb', default: {} })
  body: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @Column({
    name: 'translation_status',
    type: 'enum',
    enum: TranslationStatus,
    default: TranslationStatus.NOT_TRANSLATED,
  })
  translationStatus: TranslationStatus;

  /** Version number of source content this translation is based on */
  @Column({ name: 'source_version', default: 1 })
  sourceVersion: number;

  @Column({ name: 'translated_by', nullable: true })
  translatedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
