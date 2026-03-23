import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  OutputTemplate,
  ScheduledPublish,
  CdnConfig,
  SiteBuild,
} from './entities/publishing.entity';
import { ContentItem } from '../content/entities/content-item.entity';
import { Publication } from '../publications/entities/publication.entity';
import { PublicationEntry } from '../publications/entities/publication-entry.entity';
import { PublishingService } from './publishing.service';
import { PublishingController } from './publishing.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OutputTemplate,
      ScheduledPublish,
      CdnConfig,
      SiteBuild,
      ContentItem,
      Publication,
      PublicationEntry,
    ]),
  ],
  controllers: [PublishingController],
  providers: [PublishingService],
  exports: [PublishingService],
})
export class PublishingModule {}
