import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalizationService } from './localization.service';
import { LocalizationController } from './localization.controller';
import { LocaleContent } from './entities/locale-content.entity';
import { LocaleConfig } from './entities/locale-config.entity';
import { TranslationJob } from './entities/translation-job.entity';
import { ContentItem } from '../content/entities/content-item.entity';
import { ContentVersion } from '../content/entities/content-version.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LocaleContent,
      LocaleConfig,
      TranslationJob,
      ContentItem,
      ContentVersion,
    ]),
  ],
  controllers: [LocalizationController],
  providers: [LocalizationService],
  exports: [LocalizationService],
})
export class LocalizationModule {}
