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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlatformService } from './platform.service';
import {
  InstallPluginDto,
  UpdatePluginDto,
  CreateGitSyncDto,
  UpdateGitSyncDto,
  CreateWebhookDto,
  UpdateWebhookDto,
  AnalyticsQueryDto,
} from './platform.dto';

@ApiTags('platform')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  /* ─── Plugins ───────────────────────────── */

  @Post('plugins')
  installPlugin(
    @CurrentUser() user: { sub: string; orgId: string },
    @Body() dto: InstallPluginDto,
  ) {
    return this.platformService.installPlugin(user.orgId, user.sub, dto);
  }

  @Get('plugins')
  listPlugins(@CurrentUser() user: { sub: string; orgId: string }) {
    return this.platformService.listPlugins(user.orgId);
  }

  @Get('plugins/:id')
  getPlugin(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
  ) {
    return this.platformService.getPlugin(user.orgId, id);
  }

  @Put('plugins/:id')
  updatePlugin(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
    @Body() dto: UpdatePluginDto,
  ) {
    return this.platformService.updatePlugin(user.orgId, id, dto);
  }

  @Delete('plugins/:id')
  uninstallPlugin(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
  ) {
    return this.platformService.uninstallPlugin(user.orgId, id);
  }

  @Post('plugins/hooks/:hookName')
  @ApiOperation({ summary: 'Execute a plugin hook' })
  executeHook(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('hookName') hookName: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.platformService.executeHook(user.orgId, hookName, payload);
  }

  /* ─── Git Sync ──────────────────────────── */

  @Post('git-sync')
  createGitSync(
    @CurrentUser() user: { sub: string; orgId: string },
    @Body() dto: CreateGitSyncDto,
  ) {
    return this.platformService.createGitSync(user.orgId, dto);
  }

  @Get('git-sync')
  listGitSyncs(@CurrentUser() user: { sub: string; orgId: string }) {
    return this.platformService.listGitSyncs(user.orgId);
  }

  @Get('git-sync/:id')
  getGitSync(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
  ) {
    return this.platformService.getGitSync(user.orgId, id);
  }

  @Put('git-sync/:id')
  updateGitSync(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
    @Body() dto: UpdateGitSyncDto,
  ) {
    return this.platformService.updateGitSync(user.orgId, id, dto);
  }

  @Delete('git-sync/:id')
  deleteGitSync(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
  ) {
    return this.platformService.deleteGitSync(user.orgId, id);
  }

  @Post('git-sync/:id/trigger')
  @ApiOperation({ summary: 'Trigger an immediate sync' })
  triggerSync(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
  ) {
    return this.platformService.triggerSync(user.orgId, id);
  }

  /* ─── Webhooks / Bots ──────────────────── */

  @Post('webhooks')
  createWebhook(
    @CurrentUser() user: { sub: string; orgId: string },
    @Body() dto: CreateWebhookDto,
  ) {
    return this.platformService.createWebhook(user.orgId, dto);
  }

  @Get('webhooks')
  listWebhooks(@CurrentUser() user: { sub: string; orgId: string }) {
    return this.platformService.listWebhooks(user.orgId);
  }

  @Get('webhooks/:id')
  getWebhook(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
  ) {
    return this.platformService.getWebhook(user.orgId, id);
  }

  @Put('webhooks/:id')
  updateWebhook(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.platformService.updateWebhook(user.orgId, id, dto);
  }

  @Delete('webhooks/:id')
  deleteWebhook(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
  ) {
    return this.platformService.deleteWebhook(user.orgId, id);
  }

  @Post('webhooks/test/:id')
  @ApiOperation({ summary: 'Send a test event to a webhook' })
  async testWebhook(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
  ) {
    const wh = await this.platformService.getWebhook(user.orgId, id);
    return this.platformService.sendWebhookEvent(user.orgId, 'test.ping', {
      webhook: wh.name,
      timestamp: new Date().toISOString(),
    });
  }

  /* ─── Analytics ─────────────────────────── */

  @Post('analytics/track')
  @ApiOperation({ summary: 'Track an analytics event' })
  trackEvent(
    @CurrentUser() user: { sub: string; orgId: string },
    @Body() body: { eventType: string; payload?: Record<string, unknown>; entityType?: string; entityId?: string },
  ) {
    return this.platformService.trackEvent(
      user.orgId,
      body.eventType,
      body.payload || {},
      user.sub,
      body.entityType,
      body.entityId,
    );
  }

  @Get('analytics/events')
  @ApiQuery({ name: 'eventType', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  queryAnalytics(
    @CurrentUser() user: { sub: string; orgId: string },
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.platformService.queryAnalytics(user.orgId, query);
  }

  @Get('analytics/dashboard')
  @ApiOperation({ summary: 'Get the analytics dashboard summary' })
  getAnalyticsDashboard(@CurrentUser() user: { sub: string; orgId: string }) {
    return this.platformService.getAnalyticsDashboard(user.orgId);
  }

  /* ─── CLI Endpoints ─────────────────────── */

  @Post('cli/import')
  @ApiOperation({ summary: 'Bulk import content items (for CLI tool)' })
  cliImport(
    @CurrentUser() user: { sub: string; orgId: string },
    @Body() body: { items: { title: string; body: string; type?: string }[] },
  ) {
    return this.platformService.cliImport(user.orgId, user.sub, body.items);
  }

  @Get('cli/export')
  @ApiQuery({ name: 'format', required: false })
  @ApiOperation({ summary: 'Export published content (for CLI tool)' })
  cliExport(
    @CurrentUser() user: { sub: string; orgId: string },
    @Query('format') format?: string,
  ) {
    return this.platformService.cliExport(user.orgId, format);
  }

  @Get('cli/search')
  @ApiQuery({ name: 'q', required: true })
  @ApiOperation({ summary: 'Search content (for CLI tool)' })
  cliSearch(
    @CurrentUser() user: { sub: string; orgId: string },
    @Query('q') q: string,
  ) {
    return this.platformService.cliSearch(user.orgId, q);
  }
}
