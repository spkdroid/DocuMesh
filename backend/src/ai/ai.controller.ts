import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AiService } from './ai.service';
import {
  AiCompletionDto,
  SemanticSearchDto,
  CreateTranslationMemoryDto,
  TranslationLookupDto,
} from './dto/ai.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('AI & Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // === AI Completions ===

  @Post('complete')
  @ApiOperation({ summary: 'AI-powered text completion, rewrite, or metadata generation' })
  complete(@CurrentUser() user: JwtPayload, @Body() dto: AiCompletionDto) {
    return this.aiService.complete(user.orgId, dto);
  }

  // === Embeddings & Search ===

  @Post('embed/:contentItemId')
  @ApiOperation({ summary: 'Generate embedding for a content item' })
  embedContent(
    @CurrentUser() user: JwtPayload,
    @Param('contentItemId', ParseUUIDPipe) contentItemId: string,
  ) {
    return this.aiService.embedContent(user.orgId, contentItemId);
  }

  @Post('embed-all')
  @ApiOperation({ summary: 'Generate embeddings for all content items' })
  embedAllContent(@CurrentUser() user: JwtPayload) {
    return this.aiService.embedAllContent(user.orgId);
  }

  @Post('search')
  @ApiOperation({ summary: 'Semantic search across content' })
  semanticSearch(@CurrentUser() user: JwtPayload, @Body() dto: SemanticSearchDto) {
    return this.aiService.semanticSearch(user.orgId, dto.query, dto.limit);
  }

  @Get('similar/:contentItemId')
  @ApiOperation({ summary: 'Find similar content items' })
  @ApiQuery({ name: 'limit', required: false })
  findSimilar(
    @CurrentUser() user: JwtPayload,
    @Param('contentItemId', ParseUUIDPipe) contentItemId: string,
    @Query('limit') limit?: string,
  ) {
    return this.aiService.findSimilar(user.orgId, contentItemId, limit ? parseInt(limit, 10) : 5);
  }

  // === Auto-Tagging ===

  @Post('auto-tag/:contentItemId')
  @ApiOperation({ summary: 'Auto-suggest taxonomy tags for a content item' })
  autoTag(
    @CurrentUser() user: JwtPayload,
    @Param('contentItemId', ParseUUIDPipe) contentItemId: string,
  ) {
    return this.aiService.autoTag(user.orgId, contentItemId);
  }

  // === Translation Memory ===

  @Post('translation-memory')
  @ApiOperation({ summary: 'Add a translation memory entry' })
  addTranslationMemory(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTranslationMemoryDto,
  ) {
    return this.aiService.addTranslationMemory(user.orgId, user.sub, dto);
  }

  @Post('translation-memory/lookup')
  @ApiOperation({ summary: 'Look up matching translations' })
  lookupTranslation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: TranslationLookupDto,
  ) {
    return this.aiService.lookupTranslation(user.orgId, dto);
  }

  @Get('translation-memory')
  @ApiOperation({ summary: 'List translation memory entries' })
  @ApiQuery({ name: 'sourceLocale', required: false })
  @ApiQuery({ name: 'targetLocale', required: false })
  getTranslationMemories(
    @CurrentUser() user: JwtPayload,
    @Query('sourceLocale') sourceLocale?: string,
    @Query('targetLocale') targetLocale?: string,
  ) {
    return this.aiService.getTranslationMemories(user.orgId, sourceLocale, targetLocale);
  }

  @Delete('translation-memory/:id')
  @ApiOperation({ summary: 'Delete a translation memory entry' })
  deleteTranslationMemory(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.aiService.deleteTranslationMemory(user.orgId, id);
  }
}
