import { IsString, IsOptional, IsArray, IsUrl, IsBoolean, IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// === Webhooks ===
export class CreateWebhookDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsUrl() url: string;
  @ApiPropertyOptional() @IsOptional() @IsString() secret?: string;
  @ApiProperty() @IsArray() @IsString({ each: true }) events: string[];
}

export class UpdateWebhookDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() url?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() secret?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) events?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

// === Assets ===
export class CreateAssetDto {
  @ApiProperty() @IsString() fileName: string;
  @ApiProperty() @IsString() mimeType: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) fileSize?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() altText?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

export class UpdateAssetDto {
  @ApiPropertyOptional() @IsOptional() @IsString() altText?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

// === Batch Operations ===
export class BatchUpdateStatusDto {
  @ApiProperty() @IsArray() @IsUUID('4', { each: true }) contentItemIds: string[];
  @ApiProperty() @IsString() status: string;
}

export class BatchUpdateLocaleDto {
  @ApiProperty() @IsArray() @IsUUID('4', { each: true }) contentItemIds: string[];
  @ApiProperty() @IsString() locale: string;
}

export class BatchMoveDto {
  @ApiProperty() @IsArray() @IsUUID('4', { each: true }) contentItemIds: string[];
  @ApiProperty() @IsUUID() targetParentId: string;
}

export class BatchDeleteDto {
  @ApiProperty() @IsArray() @IsUUID('4', { each: true }) contentItemIds: string[];
}

// === Trash ===
export class RestoreTrashDto {
  @ApiProperty() @IsUUID() trashItemId: string;
}
