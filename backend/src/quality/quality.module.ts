import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityScore } from './entities/quality-score.entity';
import { ContentItem } from '../content/entities/content-item.entity';
import { QualityService } from './quality.service';
import { QualityController } from './quality.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QualityScore, ContentItem])],
  controllers: [QualityController],
  providers: [QualityService],
  exports: [QualityService],
})
export class QualityModule {}
