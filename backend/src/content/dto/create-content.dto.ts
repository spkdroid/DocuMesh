import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  IsArray,
  IsBoolean,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ContentType } from '../entities/content-item.entity';

export class CreateTaskStepDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  stepNumber: number;

  @ApiProperty({ example: 'Click the Settings button' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  body?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'The settings panel opens.' })
  @IsOptional()
  @IsString()
  stepResult?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  info?: string;

  @ApiPropertyOptional({ type: () => [CreateTaskStepDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskStepDto)
  subSteps?: CreateTaskStepDto[];
}

export class CreateRelatedLinkDto {
  @ApiProperty()
  @IsUUID()
  targetItemId: string;

  @ApiProperty({
    enum: ['parent', 'child', 'sibling', 'see_also', 'prerequisite', 'next', 'previous'],
    example: 'see_also',
  })
  @IsString()
  relationType: string;

  @ApiPropertyOptional({ example: 'Related topic' })
  @IsOptional()
  @IsString()
  navTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreatePrologDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ example: 'Internal documentation' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: 'administrators' })
  @IsOptional()
  @IsString()
  audience?: string;

  @ApiPropertyOptional({ example: 'Configuration' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: ['setup', 'config'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({ example: 'internal' })
  @IsOptional()
  @IsString()
  permissions?: string;
}

export class CreateContentDto {
  @ApiProperty({ enum: ContentType, example: ContentType.TOPIC })
  @IsEnum(ContentType)
  type: ContentType;

  @ApiProperty({ example: 'Getting Started' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'A brief introduction to getting started.' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ example: 'getting-started' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  body?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ type: CreatePrologDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePrologDto)
  prolog?: CreatePrologDto;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: '2025-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  reviewByDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  autoArchiveOnExpiry?: boolean;

  @ApiPropertyOptional({ type: [CreateTaskStepDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskStepDto)
  steps?: CreateTaskStepDto[];

  @ApiPropertyOptional({ type: [CreateRelatedLinkDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRelatedLinkDto)
  relatedLinks?: CreateRelatedLinkDto[];
}
