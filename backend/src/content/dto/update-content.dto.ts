import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ContentStatus } from '../entities/content-item.entity';
import {
  CreateTaskStepDto,
  CreateRelatedLinkDto,
  CreatePrologDto,
} from './create-content.dto';

export class UpdateContentDto {
  @ApiPropertyOptional({ example: 'Updated Title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated short description.' })
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

  @ApiPropertyOptional({ type: CreatePrologDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePrologDto)
  prolog?: CreatePrologDto;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  changeSummary?: string;

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
