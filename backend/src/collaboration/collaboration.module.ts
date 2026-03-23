import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ApprovalChain,
  Discussion,
  ContentLock,
  PresenceRecord,
} from './entities/collaboration.entity';
import { CollaborationService } from './collaboration.service';
import { CollaborationController } from './collaboration.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApprovalChain, Discussion, ContentLock, PresenceRecord]),
  ],
  controllers: [CollaborationController],
  providers: [CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}
