import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { Webhook } from './entities/webhook.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { EventLog } from './entities/event-log.entity';
import { Asset } from './entities/asset.entity';
import { TrashItem } from './entities/trash-item.entity';
import { ContentItem } from '../content/entities/content-item.entity';
import { ContentVersion } from '../content/entities/content-version.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Webhook,
      WebhookDelivery,
      EventLog,
      Asset,
      TrashItem,
      ContentItem,
      ContentVersion,
    ]),
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
