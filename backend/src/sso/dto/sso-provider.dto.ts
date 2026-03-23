import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { SsoProviderType } from '../entities/sso-provider.entity';

export class CreateSsoProviderDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ enum: SsoProviderType }) @IsEnum(SsoProviderType) type: SsoProviderType;
  @ApiPropertyOptional() @IsOptional() @IsString() clientId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clientSecret?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() issuerUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() authorizationUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tokenUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() userinfoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() samlEntryPoint?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() samlCertificate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() defaultRole?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() autoProvisionUsers?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsObject() attributeMapping?: Record<string, string>;
}

export class UpdateSsoProviderDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clientId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clientSecret?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() issuerUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() authorizationUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tokenUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() userinfoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() samlEntryPoint?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() samlCertificate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() defaultRole?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() autoProvisionUsers?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() enabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsObject() attributeMapping?: Record<string, string>;
}

export class SsoCallbackDto {
  @ApiProperty() @IsString() code: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
}
