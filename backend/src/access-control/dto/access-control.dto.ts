import { IsString, IsOptional, IsArray, IsEnum, IsBoolean, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PermissionAction, PermissionResource } from '../entities/permission.entity';

export class CreateUserGroupDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class AddGroupMembersDto {
  @ApiProperty() @IsArray() @IsUUID('4', { each: true }) userIds: string[];
}

export class CreatePermissionDto {
  @ApiProperty() @IsString() role: string;
  @ApiProperty({ enum: PermissionResource }) @IsEnum(PermissionResource) resource: PermissionResource;
  @ApiProperty({ enum: PermissionAction }) @IsEnum(PermissionAction) action: PermissionAction;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowed?: boolean;
}

export class CreateFolderPermissionDto {
  @ApiProperty() @IsUUID() folderId: string;
  @ApiProperty() @IsString() principalType: string;
  @ApiProperty() @IsUUID() principalId: string;
  @ApiProperty() @IsArray() @IsString({ each: true }) actions: string[];
}

export class CreateApiKeyDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsArray() @IsString({ each: true }) scopes: string[];
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string;
}
