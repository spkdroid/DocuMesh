import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service';
import {
  CreateWorkflowDefinitionDto,
  StartWorkflowDto,
  TransitionWorkflowDto,
  CreateReviewTaskDto,
  UpdateReviewTaskDto,
  CreateReviewCommentDto,
  ResolveCommentDto,
} from './dto/workflows.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Workflows & Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  // === Definitions ===
  @Post('definitions')
  @ApiOperation({ summary: 'Create a workflow definition' })
  createDefinition(@CurrentUser() user: JwtPayload, @Body() dto: CreateWorkflowDefinitionDto) {
    return this.workflowsService.createDefinition(user.orgId, dto);
  }

  @Post('definitions/seed')
  @ApiOperation({ summary: 'Seed built-in workflows' })
  seedBuiltIn(@CurrentUser() user: JwtPayload) {
    return this.workflowsService.seedBuiltInWorkflows(user.orgId);
  }

  @Get('definitions')
  @ApiOperation({ summary: 'List workflow definitions' })
  findAllDefinitions(@CurrentUser() user: JwtPayload) {
    return this.workflowsService.findAllDefinitions(user.orgId);
  }

  @Get('definitions/:id')
  @ApiOperation({ summary: 'Get a workflow definition' })
  findDefinition(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workflowsService.findDefinition(user.orgId, id);
  }

  // === Instances ===
  @Post('instances')
  @ApiOperation({ summary: 'Start a workflow for a content item' })
  startWorkflow(@CurrentUser() user: JwtPayload, @Body() dto: StartWorkflowDto) {
    return this.workflowsService.startWorkflow(user.orgId, user.sub, dto);
  }

  @Get('instances/:id')
  @ApiOperation({ summary: 'Get a workflow instance' })
  findInstance(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workflowsService.findWorkflowInstance(user.orgId, id);
  }

  @Post('instances/:id/transition')
  @ApiOperation({ summary: 'Transition a workflow to another state' })
  transitionWorkflow(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionWorkflowDto,
  ) {
    return this.workflowsService.transitionWorkflow(user.orgId, user.sub, id, dto);
  }

  @Get('content/:contentItemId')
  @ApiOperation({ summary: 'Get workflows for a content item' })
  findWorkflowsByContent(
    @CurrentUser() user: JwtPayload,
    @Param('contentItemId', ParseUUIDPipe) contentItemId: string,
  ) {
    return this.workflowsService.findWorkflowsByContent(user.orgId, contentItemId);
  }

  // === Review Tasks ===
  @Post('reviews')
  @ApiOperation({ summary: 'Assign a review task' })
  createReviewTask(@CurrentUser() user: JwtPayload, @Body() dto: CreateReviewTaskDto) {
    return this.workflowsService.createReviewTask(user.orgId, user.sub, dto);
  }

  @Patch('reviews/:id')
  @ApiOperation({ summary: 'Update a review task (status, notes)' })
  updateReviewTask(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewTaskDto,
  ) {
    return this.workflowsService.updateReviewTask(user.orgId, user.sub, id, dto);
  }

  @Get('reviews/my')
  @ApiOperation({ summary: 'Get review tasks assigned to me' })
  myReviewTasks(@CurrentUser() user: JwtPayload) {
    return this.workflowsService.findReviewTasksByAssignee(user.orgId, user.sub);
  }

  @Get('reviews/content/:contentItemId')
  @ApiOperation({ summary: 'Get review tasks for a content item' })
  reviewTasksByContent(
    @CurrentUser() user: JwtPayload,
    @Param('contentItemId', ParseUUIDPipe) contentItemId: string,
  ) {
    return this.workflowsService.findReviewTasksByContent(user.orgId, contentItemId);
  }

  @Get('reviews/all')
  @ApiOperation({ summary: 'List all review tasks in current organization' })
  allReviewTasks(@CurrentUser() user: JwtPayload) {
    return this.workflowsService.findAllReviewTasks(user.orgId);
  }

  @Get('reviews/dashboard')
  @ApiOperation({ summary: 'Review dashboard stats for current user' })
  reviewDashboard(@CurrentUser() user: JwtPayload) {
    return this.workflowsService.getReviewDashboard(user.orgId, user.sub);
  }

  // === Comments ===
  @Post('comments')
  @ApiOperation({ summary: 'Add a review comment (inline or general)' })
  createComment(@CurrentUser() user: JwtPayload, @Body() dto: CreateReviewCommentDto) {
    return this.workflowsService.createComment(user.orgId, user.sub, dto);
  }

  @Get('comments/:contentItemId')
  @ApiOperation({ summary: 'Get comments for a content item' })
  findComments(
    @CurrentUser() user: JwtPayload,
    @Param('contentItemId', ParseUUIDPipe) contentItemId: string,
  ) {
    return this.workflowsService.findCommentsByContent(user.orgId, contentItemId);
  }

  @Patch('comments/:id/resolve')
  @ApiOperation({ summary: 'Resolve or unresolve a comment' })
  resolveComment(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveCommentDto,
  ) {
    return this.workflowsService.resolveComment(user.orgId, id, dto.resolved);
  }

  // === Audit Trail ===
  @Get('audit')
  @ApiOperation({ summary: 'Get audit trail' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  getAuditTrail(
    @CurrentUser() user: JwtPayload,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.workflowsService.getAuditTrail(user.orgId, entityType, entityId);
  }

  @Get('audit/dashboard')
  @ApiOperation({ summary: 'Paginated, filterable audit log dashboard' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getAuditDashboard(
    @CurrentUser() user: JwtPayload,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.workflowsService.getAuditDashboard(user.orgId, {
      entityType,
      entityId,
      action,
      userId,
      fromDate,
      toDate,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('audit/stats')
  @ApiOperation({ summary: 'Audit trail statistics' })
  getAuditStats(@CurrentUser() user: JwtPayload) {
    return this.workflowsService.getAuditStats(user.orgId);
  }

  @Get('audit/export')
  @ApiOperation({ summary: 'Export audit trail as CSV or JSON' })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'] })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  exportAuditTrail(
    @CurrentUser() user: JwtPayload,
    @Query('format') format?: string,
    @Query('entityType') entityType?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.workflowsService.exportAuditTrail(
      user.orgId,
      (format === 'csv' ? 'csv' : 'json'),
      { entityType, fromDate, toDate },
    );
  }

  // === Notifications ===
  @Get('notifications')
  @ApiOperation({ summary: 'Get notifications for current user' })
  @ApiQuery({ name: 'unreadOnly', required: false })
  getNotifications(
    @CurrentUser() user: JwtPayload,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.workflowsService.getNotifications(
      user.orgId, user.sub, unreadOnly === 'true',
    );
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markNotificationRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workflowsService.markNotificationRead(user.orgId, user.sub, id);
  }

  @Post('notifications/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.workflowsService.markAllNotificationsRead(user.orgId, user.sub);
  }
}
