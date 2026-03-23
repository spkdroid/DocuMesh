import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';

@ApiTags('Content')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new content item' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateContentDto) {
    return this.contentService.create(user.orgId, user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List content items with filtering and pagination' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: QueryContentDto) {
    return this.contentService.findAll(user.orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single content item by ID' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contentService.findOne(user.orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a content item' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContentDto,
  ) {
    return this.contentService.update(user.orgId, user.sub, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a content item' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contentService.remove(user.orgId, id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'List version history for a content item' })
  getVersions(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contentService.getVersions(user.orgId, id);
  }

  // === Content Expiry & Staleness ===

  @Get('expiry/expiring')
  @ApiOperation({ summary: 'Get content approaching or past review-by date' })
  @ApiQuery({ name: 'days', required: false, description: 'Days ahead to check (default 30)' })
  getExpiringContent(
    @CurrentUser() user: JwtPayload,
    @Query('days') days?: string,
  ) {
    return this.contentService.getExpiringContent(user.orgId, days ? parseInt(days, 10) : 30);
  }

  @Get('expiry/stale')
  @ApiOperation({ summary: 'Get content not updated in N days' })
  @ApiQuery({ name: 'days', required: false, description: 'Stale threshold in days (default 90)' })
  getStaleContent(
    @CurrentUser() user: JwtPayload,
    @Query('days') days?: string,
  ) {
    return this.contentService.getStaleContent(user.orgId, days ? parseInt(days, 10) : 90);
  }

  @Get('expiry/stats')
  @ApiOperation({ summary: 'Get staleness dashboard stats' })
  getStalenessStats(@CurrentUser() user: JwtPayload) {
    return this.contentService.getStalenessStats(user.orgId);
  }

  @Post('expiry/auto-archive')
  @ApiOperation({ summary: 'Auto-archive content past review-by date' })
  autoArchiveExpired(@CurrentUser() user: JwtPayload) {
    return this.contentService.autoArchiveExpired(user.orgId);
  }
}
