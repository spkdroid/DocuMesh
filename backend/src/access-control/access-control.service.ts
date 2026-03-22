import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as crypto from 'crypto';
import { UserGroup } from './entities/user-group.entity';
import { Permission, PermissionAction, PermissionResource } from './entities/permission.entity';
import { FolderPermission } from './entities/folder-permission.entity';
import { ApiKey } from './entities/api-key.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateUserGroupDto,
  CreatePermissionDto,
  CreateFolderPermissionDto,
  CreateApiKeyDto,
} from './dto/access-control.dto';

@Injectable()
export class AccessControlService {
  constructor(
    @InjectRepository(UserGroup)
    private readonly groupRepo: Repository<UserGroup>,
    @InjectRepository(Permission)
    private readonly permRepo: Repository<Permission>,
    @InjectRepository(FolderPermission)
    private readonly folderPermRepo: Repository<FolderPermission>,
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // === RBAC Permissions ===
  async seedDefaultPermissions(orgId: string) {
    const defaults: { role: string; resource: PermissionResource; action: PermissionAction }[] = [
      // Admin: everything
      ...Object.values(PermissionResource).flatMap((res) =>
        Object.values(PermissionAction).map((act) => ({ role: 'admin', resource: res, action: act })),
      ),
      // Author: content CRUD, map CRUD, localization read/update
      { role: 'author', resource: PermissionResource.CONTENT, action: PermissionAction.CREATE },
      { role: 'author', resource: PermissionResource.CONTENT, action: PermissionAction.READ },
      { role: 'author', resource: PermissionResource.CONTENT, action: PermissionAction.UPDATE },
      { role: 'author', resource: PermissionResource.CONTENT, action: PermissionAction.DELETE },
      { role: 'author', resource: PermissionResource.MAP, action: PermissionAction.CREATE },
      { role: 'author', resource: PermissionResource.MAP, action: PermissionAction.READ },
      { role: 'author', resource: PermissionResource.MAP, action: PermissionAction.UPDATE },
      { role: 'author', resource: PermissionResource.MAP, action: PermissionAction.DELETE },
      { role: 'author', resource: PermissionResource.LOCALIZATION, action: PermissionAction.READ },
      { role: 'author', resource: PermissionResource.LOCALIZATION, action: PermissionAction.UPDATE },
      { role: 'author', resource: PermissionResource.TAXONOMY, action: PermissionAction.READ },
      // Reviewer: read + review
      { role: 'reviewer', resource: PermissionResource.CONTENT, action: PermissionAction.READ },
      { role: 'reviewer', resource: PermissionResource.CONTENT, action: PermissionAction.REVIEW },
      { role: 'reviewer', resource: PermissionResource.MAP, action: PermissionAction.READ },
      { role: 'reviewer', resource: PermissionResource.WORKFLOW, action: PermissionAction.READ },
      { role: 'reviewer', resource: PermissionResource.WORKFLOW, action: PermissionAction.UPDATE },
      // Viewer: read only
      { role: 'viewer', resource: PermissionResource.CONTENT, action: PermissionAction.READ },
      { role: 'viewer', resource: PermissionResource.MAP, action: PermissionAction.READ },
      { role: 'viewer', resource: PermissionResource.PUBLICATION, action: PermissionAction.READ },
      { role: 'viewer', resource: PermissionResource.TAXONOMY, action: PermissionAction.READ },
    ];

    for (const d of defaults) {
      const exists = await this.permRepo.findOne({
        where: { organizationId: orgId, role: d.role, resource: d.resource, action: d.action },
      });
      if (!exists) {
        await this.permRepo.save(this.permRepo.create({ organizationId: orgId, ...d }));
      }
    }
    return { seeded: true };
  }

  async checkPermission(orgId: string, role: string, resource: PermissionResource, action: PermissionAction): Promise<boolean> {
    const perm = await this.permRepo.findOne({
      where: { organizationId: orgId, role, resource, action },
    });
    return perm?.allowed ?? false;
  }

  async requirePermission(orgId: string, role: string, resource: PermissionResource, action: PermissionAction) {
    const allowed = await this.checkPermission(orgId, role, resource, action);
    if (!allowed) {
      throw new ForbiddenException(`Role '${role}' lacks '${action}' permission on '${resource}'`);
    }
  }

  async findPermissions(orgId: string, role?: string) {
    const where: Record<string, unknown> = { organizationId: orgId };
    if (role) where.role = role;
    return this.permRepo.find({ where, order: { role: 'ASC', resource: 'ASC' } });
  }

  async upsertPermission(orgId: string, dto: CreatePermissionDto) {
    let perm = await this.permRepo.findOne({
      where: { organizationId: orgId, role: dto.role, resource: dto.resource, action: dto.action },
    });
    if (perm) {
      perm.allowed = dto.allowed ?? true;
    } else {
      perm = this.permRepo.create({ organizationId: orgId, ...dto, allowed: dto.allowed ?? true });
    }
    return this.permRepo.save(perm);
  }

  async removePermission(orgId: string, id: string) {
    const p = await this.permRepo.findOne({ where: { id, organizationId: orgId } });
    if (!p) throw new NotFoundException('Permission not found');
    await this.permRepo.remove(p);
    return { deleted: true };
  }

  // === User Groups ===
  async createGroup(orgId: string, dto: CreateUserGroupDto) {
    const group = this.groupRepo.create({
      organizationId: orgId,
      name: dto.name,
      description: dto.description || '',
    });
    return this.groupRepo.save(group);
  }

  async findGroups(orgId: string) {
    return this.groupRepo.find({
      where: { organizationId: orgId },
      relations: ['members'],
      order: { name: 'ASC' },
    });
  }

  async findGroup(orgId: string, id: string) {
    const g = await this.groupRepo.findOne({
      where: { id, organizationId: orgId },
      relations: ['members'],
    });
    if (!g) throw new NotFoundException('User group not found');
    return g;
  }

  async addGroupMembers(orgId: string, groupId: string, userIds: string[]) {
    const group = await this.findGroup(orgId, groupId);
    const users = await this.userRepo.find({ where: { id: In(userIds) } });
    const existingIds = new Set(group.members.map((m) => m.id));
    group.members.push(...users.filter((u) => !existingIds.has(u.id)));
    return this.groupRepo.save(group);
  }

  async removeGroupMember(orgId: string, groupId: string, userId: string) {
    const group = await this.findGroup(orgId, groupId);
    group.members = group.members.filter((m) => m.id !== userId);
    return this.groupRepo.save(group);
  }

  async removeGroup(orgId: string, id: string) {
    const g = await this.findGroup(orgId, id);
    await this.groupRepo.remove(g);
    return { deleted: true };
  }

  // === Folder Permissions ===
  async setFolderPermission(orgId: string, dto: CreateFolderPermissionDto) {
    let fp = await this.folderPermRepo.findOne({
      where: { organizationId: orgId, folderId: dto.folderId, principalId: dto.principalId },
    });
    if (fp) {
      fp.actions = dto.actions;
      fp.principalType = dto.principalType;
    } else {
      fp = this.folderPermRepo.create({ organizationId: orgId, ...dto });
    }
    return this.folderPermRepo.save(fp);
  }

  async getFolderPermissions(orgId: string, folderId: string) {
    return this.folderPermRepo.find({
      where: { organizationId: orgId, folderId },
    });
  }

  async removeFolderPermission(orgId: string, id: string) {
    const fp = await this.folderPermRepo.findOne({ where: { id, organizationId: orgId } });
    if (!fp) throw new NotFoundException('Folder permission not found');
    await this.folderPermRepo.remove(fp);
    return { deleted: true };
  }

  // === API Keys ===
  async createApiKey(orgId: string, userId: string, dto: CreateApiKeyDto) {
    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 8);

    const apiKey = this.apiKeyRepo.create({
      organizationId: orgId,
      name: dto.name,
      keyHash,
      keyPrefix,
      scopes: dto.scopes,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      createdBy: userId,
    });
    const saved = await this.apiKeyRepo.save(apiKey);
    // Return the raw key only once on creation
    return { ...saved, rawKey: `dm_${rawKey}` };
  }

  async findApiKeys(orgId: string) {
    return this.apiKeyRepo.find({
      where: { organizationId: orgId },
      order: { createdAt: 'DESC' },
    });
  }

  async validateApiKey(keyWithPrefix: string): Promise<ApiKey | null> {
    const raw = keyWithPrefix.replace(/^dm_/, '');
    const keyHash = crypto.createHash('sha256').update(raw).digest('hex');
    const key = await this.apiKeyRepo.findOne({ where: { keyHash } });
    if (!key || !key.isActive) return null;
    if (key.expiresAt && key.expiresAt < new Date()) return null;
    key.lastUsedAt = new Date();
    await this.apiKeyRepo.save(key);
    return key;
  }

  async revokeApiKey(orgId: string, id: string) {
    const key = await this.apiKeyRepo.findOne({ where: { id, organizationId: orgId } });
    if (!key) throw new NotFoundException('API key not found');
    key.isActive = false;
    return this.apiKeyRepo.save(key);
  }
}
