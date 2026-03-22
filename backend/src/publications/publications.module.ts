import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Publication } from './entities/publication.entity';
import { PublicationEntry } from './entities/publication-entry.entity';
import { PublicationsService } from './publications.service';
import { PublicationsController } from './publications.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Publication, PublicationEntry])],
  controllers: [PublicationsController],
  providers: [PublicationsService],
  exports: [PublicationsService],
})
export class PublicationsModule {}
