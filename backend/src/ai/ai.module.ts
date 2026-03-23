import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentEmbedding } from './entities/content-embedding.entity';
import { TranslationMemory } from './entities/translation-memory.entity';
import { ContentItem } from '../content/entities/content-item.entity';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentEmbedding, TranslationMemory, ContentItem]),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
