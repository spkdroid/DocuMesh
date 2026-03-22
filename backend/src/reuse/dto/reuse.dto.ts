import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsObject,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKeyMapDto {
  @ApiProperty({ example: 'product-name' })
  @IsString()
  @IsNotEmpty()
  keyName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  targetContentId?: string;

  @ApiPropertyOptional({ example: 'DocMesh' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'global' })
  @IsOptional()
  @IsString()
  scope?: string;
}

export class CreateVariableDto {
  @ApiProperty({ example: 'productName' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'DocMesh' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'global' })
  @IsOptional()
  @IsString()
  scope?: string;
}

export class CreateFragmentDto {
  @ApiProperty({ example: 'Copyright Notice' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'copyright-notice' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  body?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'block' })
  @IsOptional()
  @IsString()
  fragmentType?: string;

  @ApiPropertyOptional({ example: ['legal', 'footer'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateVariableDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scope?: string;
}

export class UpdateKeyMapDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  targetContentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scope?: string;
}

export class UpdateFragmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  body?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fragmentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
