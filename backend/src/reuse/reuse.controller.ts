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
import { ReuseService } from './reuse.service';
import {
  CreateKeyMapDto,
  CreateVariableDto,
  CreateFragmentDto,
  UpdateKeyMapDto,
  UpdateVariableDto,
  UpdateFragmentDto,
} from './dto/reuse.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Content Reuse')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reuse')
export class ReuseController {
  constructor(private readonly reuseService: ReuseService) {}

  // === Key Maps ===
  @Post('keys')
  @ApiOperation({ summary: 'Create a key mapping' })
  createKeyMap(@CurrentUser() user: JwtPayload, @Body() dto: CreateKeyMapDto) {
    return this.reuseService.createKeyMap(user.orgId, dto);
  }

  @Get('keys')
  @ApiOperation({ summary: 'List all key mappings' })
  @ApiQuery({ name: 'scope', required: false })
  findAllKeyMaps(
    @CurrentUser() user: JwtPayload,
    @Query('scope') scope?: string,
  ) {
    return this.reuseService.findAllKeyMaps(user.orgId, scope);
  }

  @Get('keys/:id')
  @ApiOperation({ summary: 'Get a key mapping' })
  findKeyMap(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reuseService.findKeyMap(user.orgId, id);
  }

  @Patch('keys/:id')
  @ApiOperation({ summary: 'Update a key mapping' })
  updateKeyMap(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKeyMapDto,
  ) {
    return this.reuseService.updateKeyMap(user.orgId, id, dto);
  }

  @Delete('keys/:id')
  @ApiOperation({ summary: 'Delete a key mapping' })
  removeKeyMap(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reuseService.removeKeyMap(user.orgId, id);
  }

  @Get('keys/resolve/:keyName')
  @ApiOperation({ summary: 'Resolve a key to its target content or value' })
  @ApiQuery({ name: 'scope', required: false })
  resolveKey(
    @CurrentUser() user: JwtPayload,
    @Param('keyName') keyName: string,
    @Query('scope') scope?: string,
  ) {
    return this.reuseService.resolveKey(user.orgId, keyName, scope);
  }

  // === Variables ===
  @Post('variables')
  @ApiOperation({ summary: 'Create a reusable variable' })
  createVariable(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateVariableDto,
  ) {
    return this.reuseService.createVariable(user.orgId, dto);
  }

  @Get('variables')
  @ApiOperation({ summary: 'List all variables' })
  @ApiQuery({ name: 'scope', required: false })
  findAllVariables(
    @CurrentUser() user: JwtPayload,
    @Query('scope') scope?: string,
  ) {
    return this.reuseService.findAllVariables(user.orgId, scope);
  }

  @Get('variables/:id')
  @ApiOperation({ summary: 'Get a variable' })
  findVariable(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reuseService.findVariable(user.orgId, id);
  }

  @Patch('variables/:id')
  @ApiOperation({ summary: 'Update a variable' })
  updateVariable(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVariableDto,
  ) {
    return this.reuseService.updateVariable(user.orgId, id, dto);
  }

  @Delete('variables/:id')
  @ApiOperation({ summary: 'Delete a variable' })
  removeVariable(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reuseService.removeVariable(user.orgId, id);
  }

  @Post('variables/resolve')
  @ApiOperation({ summary: 'Resolve variables in a text string' })
  @ApiQuery({ name: 'scope', required: false })
  resolveVariables(
    @CurrentUser() user: JwtPayload,
    @Body() body: { text: string },
    @Query('scope') scope?: string,
  ) {
    return this.reuseService.resolveVariables(user.orgId, body.text, scope);
  }

  // === Content Fragments ===
  @Post('fragments')
  @ApiOperation({ summary: 'Create a reusable content fragment' })
  createFragment(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateFragmentDto,
  ) {
    return this.reuseService.createFragment(user.orgId, dto);
  }

  @Get('fragments')
  @ApiOperation({ summary: 'List all content fragments' })
  findAllFragments(@CurrentUser() user: JwtPayload) {
    return this.reuseService.findAllFragments(user.orgId);
  }

  @Get('fragments/:id')
  @ApiOperation({ summary: 'Get a content fragment' })
  findFragment(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reuseService.findFragment(user.orgId, id);
  }

  @Patch('fragments/:id')
  @ApiOperation({ summary: 'Update a content fragment' })
  updateFragment(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFragmentDto,
  ) {
    return this.reuseService.updateFragment(user.orgId, id, dto);
  }

  @Delete('fragments/:id')
  @ApiOperation({ summary: 'Delete a content fragment' })
  removeFragment(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reuseService.removeFragment(user.orgId, id);
  }

  // === Where-Used & Dependencies ===
  @Get('where-used/:contentId')
  @ApiOperation({ summary: 'Find all places a content item is referenced' })
  getWhereUsed(
    @CurrentUser() user: JwtPayload,
    @Param('contentId', ParseUUIDPipe) contentId: string,
  ) {
    return this.reuseService.getWhereUsed(user.orgId, contentId);
  }

  @Get('dependencies/:contentId')
  @ApiOperation({ summary: 'Get dependency graph for a content item' })
  getDependencyGraph(
    @CurrentUser() user: JwtPayload,
    @Param('contentId', ParseUUIDPipe) contentId: string,
  ) {
    return this.reuseService.getDependencyGraph(user.orgId, contentId);
  }

  @Get('health/broken-references')
  @ApiOperation({ summary: 'Detect all broken references in the organization' })
  detectBrokenReferences(@CurrentUser() user: JwtPayload) {
    return this.reuseService.detectBrokenReferences(user.orgId);
  }
}
