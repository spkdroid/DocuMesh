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

/* ── Output Template ─────────────────────── */

export enum OutputFormat {
  HTML = 'html',
  PDF = 'pdf',
}

@Entity('output_templates')
@Index(['organizationId'])
export class OutputTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ length: 300 })
  name: string;

  @Column({ type: 'enum', enum: OutputFormat, default: OutputFormat.HTML })
  format: OutputFormat;

  @Column({ type: 'text', name: 'html_template', default: '' })
  htmlTemplate: string;

  @Column({ type: 'text', name: 'css_styles', default: '' })
  cssStyles: string;

  @Column({ type: 'jsonb', default: {} })
  variables: Record<string, string>;

  @Column({ name: 'cover_page_html', type: 'text', default: '' })
  coverPageHtml: string;

  @Column({ name: 'header_html', type: 'text', default: '' })
  headerHtml: string;

  @Column({ name: 'footer_html', type: 'text', default: '' })
  footerHtml: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/* ── Scheduled Publish ───────────────────── */

export enum ScheduleStatus {
  PENDING = 'pending',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

@Entity('scheduled_publishes')
@Index(['organizationId', 'scheduledAt'])
export class ScheduledPublish {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'content_item_id', nullable: true })
  contentItemId: string | null;

  @Column({ name: 'publication_id', nullable: true })
  publicationId: string | null;

  @Column({ type: 'timestamp', name: 'scheduled_at' })
  scheduledAt: Date;

  @Column({ type: 'enum', enum: ScheduleStatus, default: ScheduleStatus.PENDING })
  status: ScheduleStatus;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ type: 'text', default: '' })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/* ── CDN Configuration ───────────────────── */

export enum CdnProvider {
  CLOUDFLARE = 'cloudflare',
  CLOUDFRONT = 'cloudfront',
  FASTLY = 'fastly',
  CUSTOM = 'custom',
}

@Entity('cdn_configs')
@Index(['organizationId'], { unique: true })
export class CdnConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'enum', enum: CdnProvider, default: CdnProvider.CLOUDFLARE })
  provider: CdnProvider;

  @Column({ name: 'base_url', length: 500, default: '' })
  baseUrl: string;

  @Column({ name: 'api_key_encrypted', type: 'text', default: '' })
  apiKeyEncrypted: string;

  @Column({ name: 'zone_id', length: 200, default: '' })
  zoneId: string;

  @Column({ type: 'int', name: 'default_ttl', default: 3600 })
  defaultTtl: number;

  @Column({ type: 'jsonb', name: 'ttl_overrides', default: {} })
  ttlOverrides: Record<string, number>;

  @Column({ default: false })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/* ── Static Site Build ───────────────────── */

export enum BuildStatus {
  QUEUED = 'queued',
  BUILDING = 'building',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('site_builds')
@Index(['organizationId', 'publicationId'])
export class SiteBuild {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'publication_id' })
  publicationId: string;

  @Column({ name: 'template_id', nullable: true })
  templateId: string | null;

  @Column({ type: 'enum', enum: BuildStatus, default: BuildStatus.QUEUED })
  status: BuildStatus;

  @Column({ length: 100, default: 'default' })
  theme: string;

  @Column({ name: 'output_url', length: 500, default: '' })
  outputUrl: string;

  @Column({ type: 'jsonb', default: {} })
  buildLog: { timestamp: string; message: string }[];

  @Column({ name: 'file_count', type: 'int', default: 0 })
  fileCount: number;

  @Column({ name: 'total_size_bytes', type: 'bigint', default: 0 })
  totalSizeBytes: number;

  @Column({ name: 'built_by' })
  builtBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;
}
