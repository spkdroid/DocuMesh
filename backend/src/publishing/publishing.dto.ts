import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OutputFormat, CdnProvider } from './entities/publishing.entity';

/* ── Output Template DTOs ─── */

export class CreateOutputTemplateDto {
  @ApiProperty({ example: 'Clean Docs Theme' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: OutputFormat })
  @IsOptional()
  @IsEnum(OutputFormat)
  format?: OutputFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  htmlTemplate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cssStyles?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverPageHtml?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  headerHtml?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  footerHtml?: string;
}

export class UpdateOutputTemplateDto extends CreateOutputTemplateDto {}

/* ── Scheduled Publish DTOs ── */

export class CreateScheduledPublishDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contentItemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  publicationId?: string;

  @ApiProperty()
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

/* ── CDN Config DTOs ── */

export class UpsertCdnConfigDto {
  @ApiProperty({ enum: CdnProvider })
  @IsEnum(CdnProvider)
  provider: CdnProvider;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zoneId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  defaultTtl?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  ttlOverrides?: Record<string, number>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

/* ── Static Site Build DTOs ── */

export class CreateSiteBuildDto {
  @ApiProperty()
  @IsUUID()
  publicationId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ example: 'default' })
  @IsOptional()
  @IsString()
  theme?: string;
}

/* ── Embed Widget ── */

export class EmbedWidgetQueryDto {
  @ApiProperty()
  @IsString()
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  platform?: string;
}
