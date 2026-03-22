import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentItem } from './entities/content-item.entity';
import { ContentVersion } from './entities/content-version.entity';
import { ContentReference } from './entities/content-reference.entity';
import { RelatedLink } from './entities/related-link.entity';
import { TaskStep } from './entities/task-step.entity';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContentItem,
      ContentVersion,
      ContentReference,
      RelatedLink,
      TaskStep,
    ]),
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
