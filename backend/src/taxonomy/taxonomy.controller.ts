import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TaxonomyService } from './taxonomy.service';
import {
  CreateTaxonomyTermDto,
  UpdateTaxonomyTermDto,
  TagContentDto,
  SearchDto,
} from './dto/taxonomy.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Taxonomy & Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('taxonomy')
export class TaxonomyController {
  constructor(private readonly svc: TaxonomyService) {}

  // === Taxonomy Terms ===
  @Post('terms')
  @ApiOperation({ summary: 'Create taxonomy term' })
  createTerm(@CurrentUser() user: JwtPayload, @Body() dto: CreateTaxonomyTermDto) {
    return this.svc.createTerm(user.orgId, dto);
  }

  @Get('terms')
  @ApiOperation({ summary: 'List taxonomy terms' })
  @ApiQuery({ name: 'taxonomyName', required: false })
  findTerms(@CurrentUser() user: JwtPayload, @Query('taxonomyName') taxonomyName?: string) {
    return this.svc.findTerms(user.orgId, taxonomyName);
  }

  @Get('terms/tree/:taxonomyName')
  @ApiOperation({ summary: 'Get hierarchical taxonomy tree' })
  findTermTree(@CurrentUser() user: JwtPayload, @Param('taxonomyName') taxonomyName: string) {
    return this.svc.findTermTree(user.orgId, taxonomyName);
  }

  @Get('terms/:id')
  @ApiOperation({ summary: 'Get taxonomy term' })
  findTerm(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.findTerm(user.orgId, id);
  }

  @Put('terms/:id')
  @ApiOperation({ summary: 'Update taxonomy term' })
  updateTerm(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateTaxonomyTermDto) {
    return this.svc.updateTerm(user.orgId, id, dto);
  }

  @Delete('terms/:id')
  @ApiOperation({ summary: 'Delete taxonomy term' })
  removeTerm(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.removeTerm(user.orgId, id);
  }

  // === Tagging ===
  @Post('tags')
  @ApiOperation({ summary: 'Tag content with taxonomy term or freeform' })
  tagContent(@CurrentUser() user: JwtPayload, @Body() dto: TagContentDto) {
    return this.svc.tagContent(user.orgId, user.sub, dto);
  }

  @Get('tags/:contentItemId')
  @ApiOperation({ summary: 'Get tags for content item' })
  getContentTags(@CurrentUser() user: JwtPayload, @Param('contentItemId') contentItemId: string) {
    return this.svc.getContentTags(user.orgId, contentItemId);
  }

  @Delete('tags/:id')
  @ApiOperation({ summary: 'Remove tag' })
  removeTag(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.removeTag(user.orgId, id);
  }

  @Get('content-by-term/:termId')
  @ApiOperation({ summary: 'Find content by taxonomy term' })
  findContentByTerm(@CurrentUser() user: JwtPayload, @Param('termId') termId: string) {
    return this.svc.findContentByTerm(user.orgId, termId);
  }

  // === Search ===
  @Post('search')
  @ApiOperation({ summary: 'Full-text + faceted search' })
  search(@CurrentUser() user: JwtPayload, @Body() dto: SearchDto) {
    return this.svc.search(user.orgId, dto);
  }

  @Get('search/semantic')
  @ApiOperation({ summary: 'Semantic / AI search (placeholder)' })
  @ApiQuery({ name: 'query', required: true })
  semanticSearch(@CurrentUser() user: JwtPayload, @Query('query') query: string) {
    return this.svc.semanticSearch(user.orgId, query);
  }
}
