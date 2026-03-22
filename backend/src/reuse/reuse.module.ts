import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeyMap } from './entities/key-map.entity';
import { Variable } from './entities/variable.entity';
import { ContentFragment } from './entities/content-fragment.entity';
import { ContentReference } from '../content/entities/content-reference.entity';
import { ContentItem } from '../content/entities/content-item.entity';
import { RelatedLink } from '../content/entities/related-link.entity';
import { ReuseService } from './reuse.service';
import { ReuseController } from './reuse.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KeyMap,
      Variable,
      ContentFragment,
      ContentReference,
      ContentItem,
      RelatedLink,
    ]),
  ],
  controllers: [ReuseController],
  providers: [ReuseService],
  exports: [ReuseService],
})
export class ReuseModule {}
