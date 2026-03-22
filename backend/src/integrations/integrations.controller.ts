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
import { IntegrationsService } from './integrations.service';
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  CreateAssetDto,
  UpdateAssetDto,
  BatchUpdateStatusDto,
  BatchUpdateLocaleDto,
  BatchMoveDto,
  BatchDeleteDto,
  RestoreTrashDto,
} from './dto/integrations.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Integrations & Advanced')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly svc: IntegrationsService) {}

  // === Webhooks ===
  @Post('webhooks')
  @ApiOperation({ summary: 'Create webhook subscription' })
  createWebhook(@CurrentUser() user: JwtPayload, @Body() dto: CreateWebhookDto) {
    return this.svc.createWebhook(user.orgId, user.sub, dto);
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'List webhooks' })
  findWebhooks(@CurrentUser() user: JwtPayload) {
    return this.svc.findWebhooks(user.orgId);
  }

  @Put('webhooks/:id')
  @ApiOperation({ summary: 'Update webhook' })
  updateWebhook(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateWebhookDto) {
    return this.svc.updateWebhook(user.orgId, id, dto);
  }

  @Delete('webhooks/:id')
  @ApiOperation({ summary: 'Delete webhook' })
  removeWebhook(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.removeWebhook(user.orgId, id);
  }

  @Get('webhooks/:id/deliveries')
  @ApiOperation({ summary: 'Webhook delivery history' })
  getDeliveries(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.getWebhookDeliveries(user.orgId, id);
  }

  // === Event Log / Activity Stream ===
  @Get('events')
  @ApiOperation({ summary: 'Activity stream' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  getActivityStream(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('entityType') entityType?: string,
  ) {
    return this.svc.getActivityStream(user.orgId, +(limit || 50), +(offset || 0), entityType);
  }

  @Get('events/:entityType/:entityId')
  @ApiOperation({ summary: 'Entity event history' })
  getEntityHistory(
    @CurrentUser() user: JwtPayload,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.svc.getEntityHistory(user.orgId, entityType, entityId);
  }

  // === Analytics ===
  @Get('analytics')
  @ApiOperation({ summary: 'Content analytics dashboard' })
  getAnalytics(@CurrentUser() user: JwtPayload) {
    return this.svc.getAnalytics(user.orgId);
  }

  // === Link Health ===
  @Get('link-health')
  @ApiOperation({ summary: 'Link / reference health report' })
  getLinkHealth(@CurrentUser() user: JwtPayload) {
    return this.svc.getLinkHealthReport(user.orgId);
  }

  // === AI Authoring ===
  @Get('ai/rewrite/:contentItemId')
  @ApiOperation({ summary: 'AI-assisted rewrite suggestions (placeholder)' })
  aiRewrite(@CurrentUser() user: JwtPayload, @Param('contentItemId') contentItemId: string) {
    return this.svc.aiSuggestRewrite(user.orgId, contentItemId);
  }

  @Get('ai/summary/:contentItemId')
  @ApiOperation({ summary: 'AI-generated summary (placeholder)' })
  aiSummary(@CurrentUser() user: JwtPayload, @Param('contentItemId') contentItemId: string) {
    return this.svc.aiGenerateSummary(user.orgId, contentItemId);
  }

  // === Content-as-Code ===
  @Get('content-as-code/export')
  @ApiOperation({ summary: 'Export content for Git sync' })
  contentAsCodeExport(@CurrentUser() user: JwtPayload) {
    return this.svc.contentAsCodeExport(user.orgId);
  }

  // === Plugin Registry ===
  @Get('plugins')
  @ApiOperation({ summary: 'Plugin / extension registry' })
  getPlugins() {
    return this.svc.getPluginRegistry();
  }

  // === Batch Operations ===
  @Post('batch/update-status')
  @ApiOperation({ summary: 'Batch update content status' })
  batchStatus(@CurrentUser() user: JwtPayload, @Body() dto: BatchUpdateStatusDto) {
    return this.svc.batchUpdateStatus(user.orgId, dto);
  }

  @Post('batch/update-locale')
  @ApiOperation({ summary: 'Batch update content locale' })
  batchLocale(@CurrentUser() user: JwtPayload, @Body() dto: BatchUpdateLocaleDto) {
    return this.svc.batchUpdateLocale(user.orgId, dto);
  }

  @Post('batch/move')
  @ApiOperation({ summary: 'Batch move content items' })
  batchMove(@CurrentUser() user: JwtPayload, @Body() dto: BatchMoveDto) {
    return this.svc.batchMove(user.orgId, dto);
  }

  @Post('batch/delete')
  @ApiOperation({ summary: 'Batch soft-delete content items' })
  batchDelete(@CurrentUser() user: JwtPayload, @Body() dto: BatchDeleteDto) {
    return this.svc.batchDelete(user.orgId, user.sub, dto.contentItemIds);
  }

  // === Mobile SDK ===
  @Get('mobile-sdk/config')
  @ApiOperation({ summary: 'Mobile SDK configuration' })
  mobileSdkConfig(@CurrentUser() user: JwtPayload) {
    return this.svc.getMobileSdkConfig(user.orgId);
  }

  // === Content Comparison ===
  @Get('compare/:idA/:idB')
  @ApiOperation({ summary: 'Compare two content items' })
  compare(@CurrentUser() user: JwtPayload, @Param('idA') idA: string, @Param('idB') idB: string) {
    return this.svc.compareContent(user.orgId, idA, idB);
  }

  // === Assets ===
  @Post('assets')
  @ApiOperation({ summary: 'Create asset record' })
  createAsset(@CurrentUser() user: JwtPayload, @Body() dto: CreateAssetDto) {
    return this.svc.createAsset(user.orgId, user.sub, dto);
  }

  @Get('assets')
  @ApiOperation({ summary: 'List assets' })
  findAssets(@CurrentUser() user: JwtPayload) {
    return this.svc.findAssets(user.orgId);
  }

  @Get('assets/:id')
  @ApiOperation({ summary: 'Get asset' })
  findAsset(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.findAsset(user.orgId, id);
  }

  @Put('assets/:id')
  @ApiOperation({ summary: 'Update asset metadata' })
  updateAsset(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.svc.updateAsset(user.orgId, id, dto);
  }

  @Delete('assets/:id')
  @ApiOperation({ summary: 'Delete asset' })
  removeAsset(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.removeAsset(user.orgId, id);
  }

  // === Trash ===
  @Get('trash')
  @ApiOperation({ summary: 'View trash bin' })
  getTrash(@CurrentUser() user: JwtPayload) {
    return this.svc.getTrash(user.orgId);
  }

  @Post('trash/restore')
  @ApiOperation({ summary: 'Restore item from trash' })
  restoreTrash(@CurrentUser() user: JwtPayload, @Body() dto: RestoreTrashDto) {
    return this.svc.restoreFromTrash(user.orgId, dto.trashItemId);
  }

  @Delete('trash')
  @ApiOperation({ summary: 'Empty trash' })
  emptyTrash(@CurrentUser() user: JwtPayload) {
    return this.svc.emptyTrash(user.orgId);
  }
}
