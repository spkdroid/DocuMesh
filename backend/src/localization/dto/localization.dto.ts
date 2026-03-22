import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsArray,
  IsObject,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TranslationStatus } from '../entities/locale-content.entity';

export class CreateLocaleConfigDto {
  @ApiProperty({ example: 'fr-CA' })
  @IsString()
  @IsNotEmpty()
  locale: string;

  @ApiProperty({ example: 'French (Canada)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: ['fr', 'en'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fallbackChain?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRtl?: boolean;
}

export class CreateLocaleContentDto {
  @ApiProperty()
  @IsUUID()
  sourceContentId: string;

  @ApiProperty({ example: 'fr' })
  @IsString()
  @IsNotEmpty()
  locale: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  body?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: TranslationStatus })
  @IsOptional()
  @IsEnum(TranslationStatus)
  translationStatus?: TranslationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sourceVersion?: number;
}

export class UpdateLocaleContentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  body?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: TranslationStatus })
  @IsOptional()
  @IsEnum(TranslationStatus)
  translationStatus?: TranslationStatus;
}

export class StartTranslationJobDto {
  @ApiProperty()
  @IsUUID()
  sourceContentId: string;

  @ApiProperty({ example: 'en' })
  @IsString()
  sourceLocale: string;

  @ApiProperty({ example: 'fr' })
  @IsString()
  targetLocale: string;

  @ApiPropertyOptional({ example: 'memoQ' })
  @IsOptional()
  @IsString()
  provider?: string;
}

export class ImportXliffDto {
  @ApiProperty({ description: 'XLIFF 2.0 content as string' })
  @IsString()
  @IsNotEmpty()
  xliffContent: string;
}
