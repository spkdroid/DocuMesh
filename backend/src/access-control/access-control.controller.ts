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
import { AccessControlService } from './access-control.service';
import {
  CreateUserGroupDto,
  AddGroupMembersDto,
  CreatePermissionDto,
  CreateFolderPermissionDto,
  CreateApiKeyDto,
} from './dto/access-control.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Access Control')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('access-control')
export class AccessControlController {
  constructor(private readonly svc: AccessControlService) {}

  // === Permissions ===
  @Post('permissions/seed')
  @ApiOperation({ summary: 'Seed default RBAC permissions' })
  seedPermissions(@CurrentUser() user: JwtPayload) {
    return this.svc.seedDefaultPermissions(user.orgId);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List permissions' })
  @ApiQuery({ name: 'role', required: false })
  findPermissions(@CurrentUser() user: JwtPayload, @Query('role') role?: string) {
    return this.svc.findPermissions(user.orgId, role);
  }

  @Post('permissions')
  @ApiOperation({ summary: 'Create or update permission' })
  upsertPermission(@CurrentUser() user: JwtPayload, @Body() dto: CreatePermissionDto) {
    return this.svc.upsertPermission(user.orgId, dto);
  }

  @Delete('permissions/:id')
  @ApiOperation({ summary: 'Delete permission' })
  removePermission(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.removePermission(user.orgId, id);
  }

  // === User Groups ===
  @Post('groups')
  @ApiOperation({ summary: 'Create a user group' })
  createGroup(@CurrentUser() user: JwtPayload, @Body() dto: CreateUserGroupDto) {
    return this.svc.createGroup(user.orgId, dto);
  }

  @Get('groups')
  @ApiOperation({ summary: 'List user groups' })
  findGroups(@CurrentUser() user: JwtPayload) {
    return this.svc.findGroups(user.orgId);
  }

  @Get('groups/:id')
  @ApiOperation({ summary: 'Get user group with members' })
  findGroup(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.findGroup(user.orgId, id);
  }

  @Post('groups/:id/members')
  @ApiOperation({ summary: 'Add members to group' })
  addMembers(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: AddGroupMembersDto) {
    return this.svc.addGroupMembers(user.orgId, id, dto.userIds);
  }

  @Delete('groups/:id/members/:userId')
  @ApiOperation({ summary: 'Remove member from group' })
  removeMember(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('userId') userId: string) {
    return this.svc.removeGroupMember(user.orgId, id, userId);
  }

  @Delete('groups/:id')
  @ApiOperation({ summary: 'Delete user group' })
  removeGroup(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.removeGroup(user.orgId, id);
  }

  // === Folder Permissions ===
  @Post('folder-permissions')
  @ApiOperation({ summary: 'Set folder permission' })
  setFolderPerm(@CurrentUser() user: JwtPayload, @Body() dto: CreateFolderPermissionDto) {
    return this.svc.setFolderPermission(user.orgId, dto);
  }

  @Get('folder-permissions/:folderId')
  @ApiOperation({ summary: 'Get folder permissions' })
  getFolderPerms(@CurrentUser() user: JwtPayload, @Param('folderId') folderId: string) {
    return this.svc.getFolderPermissions(user.orgId, folderId);
  }

  @Delete('folder-permissions/:id')
  @ApiOperation({ summary: 'Delete folder permission' })
  removeFolderPerm(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.removeFolderPermission(user.orgId, id);
  }

  // === API Keys ===
  @Post('api-keys')
  @ApiOperation({ summary: 'Create API key — raw key returned once' })
  createApiKey(@CurrentUser() user: JwtPayload, @Body() dto: CreateApiKeyDto) {
    return this.svc.createApiKey(user.orgId, user.sub, dto);
  }

  @Get('api-keys')
  @ApiOperation({ summary: 'List API keys' })
  findApiKeys(@CurrentUser() user: JwtPayload) {
    return this.svc.findApiKeys(user.orgId);
  }

  @Delete('api-keys/:id')
  @ApiOperation({ summary: 'Revoke API key' })
  revokeApiKey(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.revokeApiKey(user.orgId, id);
  }
}
