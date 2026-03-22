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
import { MapsService } from './maps.service';
import {
  CreateDitaMapDto,
  UpdateDitaMapDto,
  CreateMapEntryDto,
  CreateDitavalProfileDto,
  CreatePublishingProfileDto,
  StartPublishJobDto,
} from './dto/maps.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('DITA Maps & Publishing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  // === Maps ===
  @Post()
  @ApiOperation({ summary: 'Create a DITA map' })
  createMap(@CurrentUser() user: JwtPayload, @Body() dto: CreateDitaMapDto) {
    return this.mapsService.createMap(user.orgId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all maps' })
  findAllMaps(@CurrentUser() user: JwtPayload) {
    return this.mapsService.findAllMaps(user.orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a map with entries' })
  findMap(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mapsService.findMap(user.orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a map' })
  updateMap(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDitaMapDto,
  ) {
    return this.mapsService.updateMap(user.orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a map' })
  removeMap(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mapsService.removeMap(user.orgId, id);
  }

  @Post(':id/publish-status')
  @ApiOperation({ summary: 'Set map status to published' })
  publishMap(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mapsService.publishMap(user.orgId, id);
  }

  @Get(':id/resolve')
  @ApiOperation({ summary: 'Resolve full map tree with nested maps' })
  resolveMapTree(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mapsService.resolveMapTree(user.orgId, id);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview map output' })
  @ApiQuery({ name: 'profileId', required: false })
  previewMap(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('profileId') profileId?: string,
  ) {
    return this.mapsService.previewMap(user.orgId, id, profileId);
  }

  // === Map Entries ===
  @Post(':mapId/entries')
  @ApiOperation({ summary: 'Add an entry to a map' })
  addEntry(
    @CurrentUser() user: JwtPayload,
    @Param('mapId', ParseUUIDPipe) mapId: string,
    @Body() dto: CreateMapEntryDto,
  ) {
    return this.mapsService.addEntry(user.orgId, mapId, dto);
  }

  @Get(':mapId/entries')
  @ApiOperation({ summary: 'List entries of a map' })
  findEntries(
    @CurrentUser() user: JwtPayload,
    @Param('mapId', ParseUUIDPipe) mapId: string,
  ) {
    return this.mapsService.findEntries(user.orgId, mapId);
  }

  @Delete(':mapId/entries/:entryId')
  @ApiOperation({ summary: 'Remove an entry from a map' })
  removeEntry(
    @CurrentUser() user: JwtPayload,
    @Param('mapId', ParseUUIDPipe) mapId: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
  ) {
    return this.mapsService.removeEntry(user.orgId, mapId, entryId);
  }

  @Patch(':mapId/entries/reorder')
  @ApiOperation({ summary: 'Reorder map entries' })
  reorderEntries(
    @CurrentUser() user: JwtPayload,
    @Param('mapId', ParseUUIDPipe) mapId: string,
    @Body() order: { entryId: string; sortOrder: number }[],
  ) {
    return this.mapsService.reorderEntries(user.orgId, mapId, order);
  }

  // === DITAVAL Profiles ===
  @Post('ditaval')
  @ApiOperation({ summary: 'Create a DITAVAL profile' })
  createDitavalProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDitavalProfileDto,
  ) {
    return this.mapsService.createDitavalProfile(user.orgId, dto);
  }

  @Get('ditaval')
  @ApiOperation({ summary: 'List DITAVAL profiles' })
  findAllDitavalProfiles(@CurrentUser() user: JwtPayload) {
    return this.mapsService.findAllDitavalProfiles(user.orgId);
  }

  @Get('ditaval/:id')
  @ApiOperation({ summary: 'Get a DITAVAL profile' })
  findDitavalProfile(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mapsService.findDitavalProfile(user.orgId, id);
  }

  @Delete('ditaval/:id')
  @ApiOperation({ summary: 'Delete a DITAVAL profile' })
  removeDitavalProfile(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mapsService.removeDitavalProfile(user.orgId, id);
  }

  // === Publishing Profiles ===
  @Post('publishing-profiles')
  @ApiOperation({ summary: 'Create a publishing profile' })
  createPublishingProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePublishingProfileDto,
  ) {
    return this.mapsService.createPublishingProfile(user.orgId, dto);
  }

  @Get('publishing-profiles')
  @ApiOperation({ summary: 'List publishing profiles' })
  findAllPublishingProfiles(@CurrentUser() user: JwtPayload) {
    return this.mapsService.findAllPublishingProfiles(user.orgId);
  }

  @Get('publishing-profiles/:id')
  @ApiOperation({ summary: 'Get a publishing profile' })
  findPublishingProfile(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mapsService.findPublishingProfile(user.orgId, id);
  }

  @Delete('publishing-profiles/:id')
  @ApiOperation({ summary: 'Delete a publishing profile' })
  removePublishingProfile(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mapsService.removePublishingProfile(user.orgId, id);
  }

  // === Publish Jobs ===
  @Post('publish')
  @ApiOperation({ summary: 'Start a publish job' })
  startPublishJob(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartPublishJobDto,
  ) {
    return this.mapsService.startPublishJob(user.orgId, user.sub, dto);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List publish jobs' })
  @ApiQuery({ name: 'mapId', required: false })
  listPublishJobs(
    @CurrentUser() user: JwtPayload,
    @Query('mapId') mapId?: string,
  ) {
    return this.mapsService.listPublishJobs(user.orgId, mapId);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get publish job status' })
  getPublishJob(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mapsService.getPublishJob(user.orgId, id);
  }
}
