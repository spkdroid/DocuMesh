import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsArray,
  IsEnum,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ReleaseStatus } from '../entities/release.entity';

export class CreateVersionLabelDto {
  @ApiProperty()
  @IsUUID()
  contentItemId: string;

  @ApiProperty()
  @IsUUID()
  contentVersionId: string;

  @ApiProperty({ example: 'v2.1 Release' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateBranchDto {
  @ApiProperty({ example: 'release/3.0' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Branch to fork from' })
  @IsOptional()
  @IsUUID()
  sourceBranchId?: string;

  @ApiProperty({ description: 'Content item IDs to include in the branch' })
  @IsArray()
  @IsUUID('4', { each: true })
  contentItemIds: string[];
}

export class MergeBranchDto {
  @ApiProperty({ description: 'Source branch to merge from' })
  @IsUUID()
  sourceBranchId: string;

  @ApiProperty({ description: 'Target branch to merge into' })
  @IsUUID()
  targetBranchId: string;

  @ApiPropertyOptional({ example: 'Merge release/3.0 into main' })
  @IsOptional()
  @IsString()
  changeSummary?: string;
}

export class BaselineItemDto {
  @ApiProperty()
  @IsUUID()
  contentItemId: string;

  @ApiProperty()
  @IsUUID()
  versionId: string;
}

export class CreateBaselineDto {
  @ApiProperty({ example: 'Q1 2026 Snapshot' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [BaselineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BaselineItemDto)
  items: BaselineItemDto[];
}

export class RollbackDto {
  @ApiProperty()
  @IsUUID()
  contentItemId: string;

  @ApiProperty()
  @IsUUID()
  targetVersionId: string;
}

export class CreateReleaseDto {
  @ApiProperty({ example: 'DocMesh v3.0' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '3.0.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  baselineId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetDate?: string;
}

export class UpdateReleaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ReleaseStatus })
  @IsOptional()
  @IsEnum(ReleaseStatus)
  status?: ReleaseStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  baselineId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetDate?: string;
}
