import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsObject,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PluginStatus,
  GitProvider,
  SyncDirection,
  WebhookPlatform,
} from './entities/platform.entity';

/* ── Plugin DTOs ──────────────────────────── */

export class InstallPluginDto {
  @ApiProperty({ example: 'docmesh-spellcheck' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '1.0.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ example: 'https://github.com/org/plugin.git' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: ['pre-save', 'post-publish'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hooks?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class UpdatePluginDto {
  @ApiPropertyOptional({ enum: PluginStatus })
  @IsOptional()
  @IsEnum(PluginStatus)
  status?: PluginStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

/* ── Git Sync DTOs ────────────────────────── */

export class CreateGitSyncDto {
  @ApiProperty({ enum: GitProvider })
  @IsEnum(GitProvider)
  provider: GitProvider;

  @ApiProperty({ example: 'https://github.com/org/docs.git' })
  @IsString()
  @IsNotEmpty()
  repoUrl: string;

  @ApiPropertyOptional({ example: 'main' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional({ enum: SyncDirection })
  @IsOptional()
  @IsEnum(SyncDirection)
  direction?: SyncDirection;

  @ApiPropertyOptional({ example: 'markdown' })
  @IsOptional()
  @IsString()
  contentFormat?: string;

  @ApiPropertyOptional({ example: 'docs/' })
  @IsOptional()
  @IsString()
  syncPath?: string;
}

export class UpdateGitSyncDto extends CreateGitSyncDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

/* ── Webhook DTOs ─────────────────────────── */

export class CreateWebhookDto {
  @ApiProperty({ enum: WebhookPlatform })
  @IsEnum(WebhookPlatform)
  platform: WebhookPlatform;

  @ApiProperty({ example: 'Content Notifications' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'https://hooks.slack.com/services/...' })
  @IsString()
  @IsNotEmpty()
  webhookUrl: string;

  @ApiPropertyOptional({ example: ['content.published', 'review.approved'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: string[];
}

export class UpdateWebhookDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

/* ── Analytics Query ──────────────────────── */

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ example: 'content.view' })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  toDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityType?: string;
}
