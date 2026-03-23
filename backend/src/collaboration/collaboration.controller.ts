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
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CollaborationService } from './collaboration.service';
import {
  CreateApprovalChainDto,
  ApproveStepDto,
  CreateDiscussionDto,
  CreateLockDto,
  UpdatePresenceDto,
} from './dto/collaboration.dto';

@ApiTags('collaboration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collaboration')
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  /* ─── Approval Chains ─────────────────────────────── */

  @Post('approvals')
  createApprovalChain(
    @CurrentUser() user: { sub: string; orgId: string },
    @Body() dto: CreateApprovalChainDto,
  ) {
    return this.collaborationService.createApprovalChain(user.orgId, user.sub, dto);
  }

  @Get('approvals')
  @ApiQuery({ name: 'contentItemId', required: false })
  listApprovalChains(
    @CurrentUser() user: { sub: string; orgId: string },
    @Query('contentItemId') contentItemId?: string,
  ) {
    return this.collaborationService.listApprovalChains(user.orgId, contentItemId);
  }

  @Get('approvals/:id')
  getApprovalChain(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
  ) {
    return this.collaborationService.getApprovalChain(user.orgId, id);
  }

  @Put('approvals/:id/advance')
  advanceApproval(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
    @Body() dto: ApproveStepDto,
  ) {
    return this.collaborationService.advanceApproval(user.orgId, user.sub, id, dto);
  }

  @Put('approvals/:id/cancel')
  cancelApprovalChain(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
  ) {
    return this.collaborationService.cancelApprovalChain(user.orgId, id);
  }

  /* ─── Discussions ──────────────────────────────────── */

  @Post('discussions')
  createDiscussion(
    @CurrentUser() user: { sub: string; orgId: string },
    @Body() dto: CreateDiscussionDto,
  ) {
    return this.collaborationService.createDiscussion(user.orgId, user.sub, dto);
  }

  @Get('discussions')
  @ApiQuery({ name: 'contentItemId', required: true })
  listDiscussions(
    @CurrentUser() user: { sub: string; orgId: string },
    @Query('contentItemId') contentItemId: string,
  ) {
    return this.collaborationService.listDiscussions(user.orgId, contentItemId);
  }

  @Put('discussions/:id/resolve')
  resolveDiscussion(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
  ) {
    return this.collaborationService.resolveDiscussion(user.orgId, id);
  }

  @Delete('discussions/:id')
  deleteDiscussion(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('id') id: string,
  ) {
    return this.collaborationService.deleteDiscussion(user.orgId, id);
  }

  /* ─── Content Locks ────────────────────────────────── */

  @Post('locks')
  acquireLock(
    @CurrentUser() user: { sub: string; orgId: string },
    @Body() dto: CreateLockDto,
  ) {
    return this.collaborationService.acquireLock(user.orgId, user.sub, dto);
  }

  @Get('locks')
  listLocks(@CurrentUser() user: { sub: string; orgId: string }) {
    return this.collaborationService.listLocks(user.orgId);
  }

  @Get('locks/:contentItemId')
  getLock(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('contentItemId') contentItemId: string,
  ) {
    return this.collaborationService.getLock(user.orgId, contentItemId);
  }

  @Delete('locks/:contentItemId')
  releaseLock(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param('contentItemId') contentItemId: string,
  ) {
    return this.collaborationService.releaseLock(user.orgId, contentItemId);
  }

  /* ─── Presence ─────────────────────────────────────── */

  @Post('presence')
  heartbeat(
    @CurrentUser() user: { sub: string; email: string; orgId: string },
    @Body() dto: UpdatePresenceDto,
  ) {
    return this.collaborationService.heartbeat(user.orgId, user.sub, user.email, dto);
  }

  @Get('presence')
  @ApiQuery({ name: 'contentItemId', required: false })
  getPresence(
    @CurrentUser() user: { sub: string; orgId: string },
    @Query('contentItemId') contentItemId?: string,
  ) {
    return this.collaborationService.getPresence(user.orgId, contentItemId);
  }

  @Delete('presence')
  clearPresence(@CurrentUser() user: { sub: string; orgId: string }) {
    return this.collaborationService.clearPresence(user.orgId, user.sub);
  }
}
