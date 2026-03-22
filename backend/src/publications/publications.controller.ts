import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicationsService } from './publications.service';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';

@ApiTags('Publications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('publications')
export class PublicationsController {
  constructor(private readonly pubService: PublicationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new publication' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePublicationDto,
  ) {
    return this.pubService.create(user.orgId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all publications' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.pubService.findAll(user.orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a publication with its content tree' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.pubService.findOne(user.orgId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a publication' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.pubService.remove(user.orgId, id);
  }

  @Post(':id/entries')
  @ApiOperation({ summary: 'Add a content item to a publication' })
  addEntry(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      contentItemId: string;
      parentEntryId?: string;
      sortOrder?: number;
    },
  ) {
    return this.pubService.addEntry(
      user.orgId,
      id,
      body.contentItemId,
      body.parentEntryId,
      body.sortOrder,
    );
  }

  @Delete(':id/entries/:entryId')
  @ApiOperation({ summary: 'Remove an entry from a publication' })
  removeEntry(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
  ) {
    return this.pubService.removeEntry(user.orgId, id, entryId);
  }
}
