import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ApprovalStepDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  stepNumber: number;

  @ApiProperty({ example: 'SME Review' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: ['user-id-1', 'user-id-2'] })
  @IsArray()
  @IsString({ each: true })
  assigneeIds: string[];

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  requiredApprovals?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  parallel?: boolean;
}

export class CreateApprovalChainDto {
  @ApiProperty()
  @IsUUID()
  contentItemId: string;

  @ApiProperty({ example: 'Publication Approval' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ type: [ApprovalStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovalStepDto)
  steps: ApprovalStepDto[];
}

export class ApproveStepDto {
  @ApiProperty({ example: 'approved' })
  @IsString()
  decision: string;

  @ApiPropertyOptional({ example: 'Looks good.' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class CreateDiscussionDto {
  @ApiProperty()
  @IsUUID()
  contentItemId: string;

  @ApiProperty({ example: 'I think this section needs more detail.' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  sectionRef?: { sectionId: string; from: number; to: number };

  @ApiPropertyOptional({ example: ['user-id-1'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];
}

export class CreateLockDto {
  @ApiProperty()
  @IsUUID()
  contentItemId: string;

  @ApiPropertyOptional({ example: 'Release freeze' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'freeze' })
  @IsOptional()
  @IsString()
  lockType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdatePresenceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contentItemId?: string;

  @ApiPropertyOptional({ example: 'editing' })
  @IsOptional()
  @IsString()
  status?: string;
}
