import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlService } from './access-control.service';
import { AccessControlController } from './access-control.controller';
import { UserGroup } from './entities/user-group.entity';
import { Permission } from './entities/permission.entity';
import { FolderPermission } from './entities/folder-permission.entity';
import { ApiKey } from './entities/api-key.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserGroup,
      Permission,
      FolderPermission,
      ApiKey,
      User,
    ]),
  ],
  controllers: [AccessControlController],
  providers: [AccessControlService],
  exports: [AccessControlService],
})
export class AccessControlModule {}
