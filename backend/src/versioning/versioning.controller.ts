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
import { VersioningService } from './versioning.service';
import {
  CreateVersionLabelDto,
  CreateBranchDto,
  MergeBranchDto,
  CreateBaselineDto,
  RollbackDto,
  CreateReleaseDto,
  UpdateReleaseDto,
} from './dto/versioning.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { ContentStatus } from '../content/entities/content-item.entity';

@ApiTags('Versioning & Branching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('versioning')
export class VersioningController {
  constructor(private readonly versioningService: VersioningService) {}

  // === Diff ===
  @Get('diff/:contentItemId')
  @ApiOperation({ summary: 'Diff two versions of a content item' })
  @ApiQuery({ name: 'versionA', required: true })
  @ApiQuery({ name: 'versionB', required: true })
  diffVersions(
    @CurrentUser() user: JwtPayload,
    @Param('contentItemId', ParseUUIDPipe) contentItemId: string,
    @Query('versionA') versionA: string,
    @Query('versionB') versionB: string,
  ) {
    return this.versioningService.diffVersions(user.orgId, contentItemId, versionA, versionB);
  }

  // === Version Labels ===
  @Post('labels')
  @ApiOperation({ summary: 'Add a label to a version' })
  createLabel(@CurrentUser() user: JwtPayload, @Body() dto: CreateVersionLabelDto) {
    return this.versioningService.createLabel(user.orgId, user.sub, dto);
  }

  @Get('labels/:contentItemId')
  @ApiOperation({ summary: 'List labels for a content item' })
  findLabels(
    @CurrentUser() user: JwtPayload,
    @Param('contentItemId', ParseUUIDPipe) contentItemId: string,
  ) {
    return this.versioningService.findLabels(user.orgId, contentItemId);
  }

  @Delete('labels/:id')
  @ApiOperation({ summary: 'Remove a version label' })
  removeLabel(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.versioningService.removeLabel(user.orgId, id);
  }

  // === Branches ===
  @Post('branches')
  @ApiOperation({ summary: 'Create a content branch' })
  createBranch(@CurrentUser() user: JwtPayload, @Body() dto: CreateBranchDto) {
    return this.versioningService.createBranch(user.orgId, user.sub, dto);
  }

  @Get('branches')
  @ApiOperation({ summary: 'List all branches' })
  findAllBranches(@CurrentUser() user: JwtPayload) {
    return this.versioningService.findAllBranches(user.orgId);
  }

  @Get('branches/:id')
  @ApiOperation({ summary: 'Get a branch' })
  findBranch(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.versioningService.findBranch(user.orgId, id);
  }

  @Get('branches/:id/contents')
  @ApiOperation({ summary: 'Get snapshot contents of a branch' })
  getBranchContents(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.versioningService.getBranchContents(user.orgId, id);
  }

  @Post('branches/:id/close')
  @ApiOperation({ summary: 'Close a branch' })
  closeBranch(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.versioningService.closeBranch(user.orgId, id);
  }

  @Post('branches/merge')
  @ApiOperation({ summary: 'Merge a branch into another' })
  mergeBranch(@CurrentUser() user: JwtPayload, @Body() dto: MergeBranchDto) {
    return this.versioningService.mergeBranch(user.orgId, user.sub, dto);
  }

  // === Baselines ===
  @Post('baselines')
  @ApiOperation({ summary: 'Create a baseline snapshot' })
  createBaseline(@CurrentUser() user: JwtPayload, @Body() dto: CreateBaselineDto) {
    return this.versioningService.createBaseline(user.orgId, user.sub, dto);
  }

  @Get('baselines')
  @ApiOperation({ summary: 'List all baselines' })
  findAllBaselines(@CurrentUser() user: JwtPayload) {
    return this.versioningService.findAllBaselines(user.orgId);
  }

  @Get('baselines/:id')
  @ApiOperation({ summary: 'Get a baseline' })
  findBaseline(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.versioningService.findBaseline(user.orgId, id);
  }

  @Delete('baselines/:id')
  @ApiOperation({ summary: 'Delete a baseline' })
  removeBaseline(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.versioningService.removeBaseline(user.orgId, id);
  }

  // === Rollback ===
  @Post('rollback')
  @ApiOperation({ summary: 'Rollback a content item to a previous version' })
  rollback(@CurrentUser() user: JwtPayload, @Body() dto: RollbackDto) {
    return this.versioningService.rollback(user.orgId, user.sub, dto);
  }

  // === Lifecycle ===
  @Post('lifecycle/:contentItemId')
  @ApiOperation({ summary: 'Set lifecycle status of a content item' })
  @ApiQuery({ name: 'status', enum: ContentStatus })
  setLifecycleStatus(
    @CurrentUser() user: JwtPayload,
    @Param('contentItemId', ParseUUIDPipe) contentItemId: string,
    @Query('status') status: ContentStatus,
  ) {
    return this.versioningService.setLifecycleStatus(user.orgId, contentItemId, status);
  }

  // === Releases ===
  @Post('releases')
  @ApiOperation({ summary: 'Create a release' })
  createRelease(@CurrentUser() user: JwtPayload, @Body() dto: CreateReleaseDto) {
    return this.versioningService.createRelease(user.orgId, user.sub, dto);
  }

  @Get('releases')
  @ApiOperation({ summary: 'List all releases' })
  findAllReleases(@CurrentUser() user: JwtPayload) {
    return this.versioningService.findAllReleases(user.orgId);
  }

  @Get('releases/:id')
  @ApiOperation({ summary: 'Get a release' })
  findRelease(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.versioningService.findRelease(user.orgId, id);
  }

  @Patch('releases/:id')
  @ApiOperation({ summary: 'Update a release' })
  updateRelease(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReleaseDto,
  ) {
    return this.versioningService.updateRelease(user.orgId, id, dto);
  }

  @Delete('releases/:id')
  @ApiOperation({ summary: 'Delete a release' })
  removeRelease(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.versioningService.removeRelease(user.orgId, id);
  }
}
