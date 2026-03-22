import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsUUID,
  IsBoolean,
  IsInt,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MapType } from '../entities/dita-map.entity';
import { EntryType } from '../entities/map-entry.entity';
import { OutputFormat } from '../entities/publishing-profile.entity';

export class CreateDitaMapDto {
  @ApiProperty({ example: 'User Guide' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'user-guide' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ enum: MapType })
  @IsOptional()
  @IsEnum(MapType)
  mapType?: MapType;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateDitaMapDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: MapType })
  @IsOptional()
  @IsEnum(MapType)
  mapType?: MapType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateMapEntryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contentItemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  refMapId?: string;

  @ApiPropertyOptional({ enum: EntryType })
  @IsOptional()
  @IsEnum(EntryType)
  entryType?: EntryType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  navTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  tocVisible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  print?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentEntryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown>;
}

export class DitavalRuleDto {
  @ApiProperty({ example: 'audience' })
  @IsString()
  attribute: string;

  @ApiProperty({ example: 'admin' })
  @IsString()
  value: string;

  @ApiProperty({ enum: ['include', 'exclude', 'flag'] })
  @IsString()
  action: string;

  @ApiPropertyOptional({ example: '#ffcc00' })
  @IsOptional()
  @IsString()
  flagColor?: string;
}

export class CreateDitavalProfileDto {
  @ApiProperty({ example: 'Admin Only' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [DitavalRuleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DitavalRuleDto)
  rules?: DitavalRuleDto[];
}

export class CreatePublishingProfileDto {
  @ApiProperty({ example: 'HTML5 Admin Guide' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: OutputFormat })
  @IsEnum(OutputFormat)
  outputFormat: OutputFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ditavalProfileId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  branding?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

export class StartPublishJobDto {
  @ApiProperty()
  @IsUUID()
  ditaMapId: string;

  @ApiProperty()
  @IsUUID()
  publishingProfileId: string;
}
