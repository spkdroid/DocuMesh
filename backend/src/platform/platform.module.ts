import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Plugin,
  GitSyncConfig,
  WebhookConfig,
  AnalyticsEvent,
} from './entities/platform.entity';
import { ContentItem } from '../content/entities/content-item.entity';
import { PlatformService } from './platform.service';
import { PlatformController } from './platform.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plugin,
      GitSyncConfig,
      WebhookConfig,
      AnalyticsEvent,
      ContentItem,
    ]),
  ],
  controllers: [PlatformController],
  providers: [PlatformService],
  exports: [PlatformService],
})
export class PlatformModule {}
