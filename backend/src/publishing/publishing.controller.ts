import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PublishingService } from './publishing.service';
import {
  CreateOutputTemplateDto,
  UpdateOutputTemplateDto,
  CreateScheduledPublishDto,
  UpsertCdnConfigDto,
  CreateSiteBuildDto,
} from './publishing.dto';

@ApiTags('publishing')
@Controller('publishing')
export class PublishingController {
  constructor(private readonly publishingService: PublishingService) {}

  /* ─── Output Templates ──────────────────── */

  @Post('templates')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createTemplate(
    @CurrentUser() user: { sub: string; orgId: string },
    @Body() dto: CreateOutputTemplateDto,
  ) {
    return this.publishingService.createTemplate(user.orgId, user.sub, dto);
  }

  @Get('templates')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  listTemplates(@CurrentUser() user: { sub: string; orgId: string }) {
    return this.publishingService.listTemplates(user.orgId);
  }

  @Get('templates/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getTemplate(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
  ) {
    return this.publishingService.getTemplate(user.orgId, id);
  }

  @Put('templates/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateTemplate(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
    @Body() dto: UpdateOutputTemplateDto,
  ) {
    return this.publishingService.updateTemplate(user.orgId, id, dto);
  }

  @Delete('templates/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  deleteTemplate(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
  ) {
    return this.publishingService.deleteTemplate(user.orgId, id);
  }

  @Get('templates/:id/preview')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  previewTemplate(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
  ) {
    return this.publishingService.previewTemplate(user.orgId, id);
  }

  /* ─── Scheduled Publishing ──────────────── */

  @Post('schedules')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createSchedule(
    @CurrentUser() user: { sub: string; orgId: string },
    @Body() dto: CreateScheduledPublishDto,
  ) {
    return this.publishingService.createSchedule(user.orgId, user.sub, dto);
  }

  @Get('schedules')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  listSchedules(@CurrentUser() user: { sub: string; orgId: string }) {
    return this.publishingService.listSchedules(user.orgId);
  }

  @Put('schedules/:id/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  cancelSchedule(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
  ) {
    return this.publishingService.cancelSchedule(user.orgId, id);
  }

  @Post('schedules/process')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Process all due scheduled publishes (cron trigger)' })
  processDueSchedules() {
    return this.publishingService.processDueSchedules();
  }

  /* ─── CDN Configuration ─────────────────── */

  @Get('cdn')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getCdnConfig(@CurrentUser() user: { sub: string; orgId: string }) {
    return this.publishingService.getCdnConfig(user.orgId);
  }

  @Put('cdn')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  upsertCdnConfig(
    @CurrentUser() user: { sub: string; orgId: string },
    @Body() dto: UpsertCdnConfigDto,
  ) {
    return this.publishingService.upsertCdnConfig(user.orgId, dto);
  }

  @Post('cdn/purge')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  purgeCache(@CurrentUser() user: { sub: string; orgId: string }) {
    return this.publishingService.purgeCache(user.orgId);
  }

  /* ─── Static Site Builds ────────────────── */

  @Post('builds')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  triggerBuild(
    @CurrentUser() user: { sub: string; orgId: string },
    @Body() dto: CreateSiteBuildDto,
  ) {
    return this.publishingService.triggerBuild(user.orgId, user.sub, dto);
  }

  @Get('builds')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'publicationId', required: false })
  listBuilds(
    @CurrentUser() user: { sub: string; orgId: string },
    @Query('publicationId') publicationId?: string,
  ) {
    return this.publishingService.listBuilds(user.orgId, publicationId);
  }

  @Get('builds/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getBuild(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
  ) {
    return this.publishingService.getBuild(user.orgId, id);
  }

  /* ─── Embed Widget (public) ─────────────── */

  @Get('embed/widget.js')
  @ApiOperation({ summary: 'Serve the embeddable widget JavaScript' })
  @Header('Content-Type', 'application/javascript')
  getEmbedScript() {
    return this.publishingService.getEmbedScript();
  }

  @Get('embed/content')
  @ApiOperation({ summary: 'Fetch content for the embed widget (public)' })
  @ApiQuery({ name: 'slug', required: true })
  @ApiQuery({ name: 'locale', required: false })
  getEmbedContent(
    @Query('slug') slug: string,
    @Query('locale') locale?: string,
  ) {
    return this.publishingService.getEmbedContent(slug, locale);
  }

  /* ─── Mobile SDK (public) ───────────────── */

  @Get('mobile/sync')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Sync published content for mobile apps' })
  @ApiQuery({ name: 'locale', required: false })
  @ApiQuery({ name: 'since', required: false })
  getMobileContent(
    @CurrentUser() user: { sub: string; orgId: string },
    @Query('locale') locale?: string,
    @Query('since') since?: string,
  ) {
    return this.publishingService.getMobileContent(user.orgId, locale, since);
  }
}
