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

/* ── Plugin / Extension ──────────────────── */

export enum PluginStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  ERROR = 'error',
}

@Entity('plugins')
@Index(['organizationId'])
export class Plugin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 100, default: '0.0.0' })
  version: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ length: 500, default: '' })
  source: string; // registry name or git URL

  @Column({ type: 'enum', enum: PluginStatus, default: PluginStatus.ACTIVE })
  status: PluginStatus;

  @Column({ type: 'jsonb', default: [] })
  hooks: string[]; // e.g., ['pre-save', 'post-publish', 'custom-validator']

  @Column({ type: 'jsonb', default: {} })
  config: Record<string, unknown>;

  @Column({ name: 'installed_by' })
  installedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/* ── Git Sync Config ─────────────────────── */

export enum GitProvider {
  GITHUB = 'github',
  GITLAB = 'gitlab',
}

export enum SyncDirection {
  PUSH = 'push',
  PULL = 'pull',
  BIDIRECTIONAL = 'bidirectional',
}

@Entity('git_sync_configs')
@Index(['organizationId'])
export class GitSyncConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'enum', enum: GitProvider })
  provider: GitProvider;

  @Column({ name: 'repo_url', length: 500 })
  repoUrl: string;

  @Column({ length: 200, default: 'main' })
  branch: string;

  @Column({ name: 'access_token_encrypted', type: 'text', default: '' })
  accessTokenEncrypted: string;

  @Column({ type: 'enum', enum: SyncDirection, default: SyncDirection.BIDIRECTIONAL })
  direction: SyncDirection;

  @Column({ name: 'content_format', length: 50, default: 'markdown' })
  contentFormat: string; // 'markdown' | 'dita-xml' | 'json'

  @Column({ name: 'sync_path', length: 300, default: 'docs/' })
  syncPath: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ name: 'last_sync_at', type: 'timestamp', nullable: true })
  lastSyncAt: Date | null;

  @Column({ name: 'last_sync_status', length: 100, default: '' })
  lastSyncStatus: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/* ── Webhook / Bot Config ────────────────── */

export enum WebhookPlatform {
  SLACK = 'slack',
  TEAMS = 'teams',
  CUSTOM = 'custom',
}

@Entity('webhook_configs')
@Index(['organizationId'])
export class WebhookConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'enum', enum: WebhookPlatform })
  platform: WebhookPlatform;

  @Column({ length: 200, default: 'Notifications' })
  name: string;

  @Column({ name: 'webhook_url', length: 500 })
  webhookUrl: string;

  @Column({ type: 'jsonb', default: [] })
  events: string[]; // e.g., ['content.published', 'review.approved', 'review.rejected']

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/* ── Analytics Event ─────────────────────── */

@Entity('analytics_events')
@Index(['organizationId', 'eventType', 'createdAt'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'event_type', length: 100 })
  eventType: string; // 'content.view', 'search.query', 'api.request', etc.

  @Column({ name: 'entity_type', length: 100, default: '' })
  entityType: string;

  @Column({ name: 'entity_id', nullable: true })
  entityId: string | null;

  @Column({ name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
