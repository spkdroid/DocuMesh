import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxonomyService } from './taxonomy.service';
import { TaxonomyController } from './taxonomy.controller';
import { TaxonomyTerm } from './entities/taxonomy-term.entity';
import { ContentTag } from './entities/content-tag.entity';
import { ContentItem } from '../content/entities/content-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaxonomyTerm, ContentTag, ContentItem]),
  ],
  controllers: [TaxonomyController],
  providers: [TaxonomyService],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}
