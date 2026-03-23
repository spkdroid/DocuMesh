import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AiAction {
  COMPLETE = 'complete',
  REWRITE = 'rewrite',
  SUMMARIZE = 'summarize',
  GENERATE_SHORTDESC = 'generate_shortdesc',
  GENERATE_PROLOG = 'generate_prolog',
}

export class AiCompletionDto {
  @ApiProperty({ example: 'complete' })
  @IsEnum(AiAction)
  action: AiAction;

  @ApiProperty({ example: 'Explain how to configure SSL certificates for the proxy server.' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({ example: 'developers' })
  @IsOptional()
  @IsString()
  audience?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  locale?: string;
}

export class SemanticSearchDto {
  @ApiProperty({ example: 'how to configure authentication' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class AutoTagDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contentItemId: string;
}

export class CreateTranslationMemoryDto {
  @ApiProperty({ example: 'en' })
  @IsString()
  @IsNotEmpty()
  sourceLocale: string;

  @ApiProperty({ example: 'fr' })
  @IsString()
  @IsNotEmpty()
  targetLocale: string;

  @ApiProperty({ example: 'Click the Save button.' })
  @IsString()
  @IsNotEmpty()
  sourceText: string;

  @ApiProperty({ example: 'Cliquez sur le bouton Enregistrer.' })
  @IsString()
  @IsNotEmpty()
  targetText: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentItemId?: string;
}

export class TranslationLookupDto {
  @ApiProperty({ example: 'en' })
  @IsString()
  @IsNotEmpty()
  sourceLocale: string;

  @ApiProperty({ example: 'fr' })
  @IsString()
  @IsNotEmpty()
  targetLocale: string;

  @ApiProperty({ example: 'Click the Save button.' })
  @IsString()
  @IsNotEmpty()
  sourceText: string;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @IsNumber()
  minScore?: number;
}
