import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsArray,
  IsEnum,
  IsBoolean,
  IsDateString,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ReviewTaskStatus } from '../entities/review-task.entity';

export class WorkflowStateDto {
  @ApiProperty({ example: 'draft' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFinal?: boolean;
}

export class WorkflowTransitionDto {
  @ApiProperty({ example: 'draft' })
  @IsString()
  from: string;

  @ApiProperty({ example: 'review' })
  @IsString()
  to: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requiredRole?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}

export class CreateWorkflowDefinitionDto {
  @ApiProperty({ example: 'Standard Review' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [WorkflowStateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStateDto)
  states: WorkflowStateDto[];

  @ApiProperty({ type: [WorkflowTransitionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowTransitionDto)
  transitions: WorkflowTransitionDto[];

  @ApiPropertyOptional({ example: 'draft' })
  @IsOptional()
  @IsString()
  initialState?: string;
}

export class StartWorkflowDto {
  @ApiProperty()
  @IsUUID()
  workflowDefinitionId: string;

  @ApiProperty()
  @IsUUID()
  contentItemId: string;
}

export class TransitionWorkflowDto {
  @ApiProperty({ example: 'review' })
  @IsString()
  @IsNotEmpty()
  toState: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class CreateReviewTaskDto {
  @ApiProperty()
  @IsUUID()
  contentItemId: string;

  @ApiProperty()
  @IsUUID()
  assigneeId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  workflowInstanceId?: string;
}

export class UpdateReviewTaskDto {
  @ApiPropertyOptional({ enum: ReviewTaskStatus })
  @IsOptional()
  @IsEnum(ReviewTaskStatus)
  status?: ReviewTaskStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}

export class CreateReviewCommentDto {
  @ApiProperty()
  @IsUUID()
  contentItemId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  reviewTaskId?: string;

  @ApiPropertyOptional({ description: '{ from, to } for inline annotation' })
  @IsOptional()
  textRange?: { from: number; to: number };

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}

export class ResolveCommentDto {
  @ApiProperty()
  @IsBoolean()
  resolved: boolean;
}
