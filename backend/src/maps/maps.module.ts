import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DitaMap } from './entities/dita-map.entity';
import { MapEntry } from './entities/map-entry.entity';
import { DitavalProfile } from './entities/ditaval-profile.entity';
import { PublishingProfile } from './entities/publishing-profile.entity';
import { PublishJob } from './entities/publish-job.entity';
import { ContentItem } from '../content/entities/content-item.entity';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DitaMap,
      MapEntry,
      DitavalProfile,
      PublishingProfile,
      PublishJob,
      ContentItem,
    ]),
  ],
  controllers: [MapsController],
  providers: [MapsService],
  exports: [MapsService],
})
export class MapsModule {}
