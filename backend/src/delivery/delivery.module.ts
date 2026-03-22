import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentItem } from '../content/entities/content-item.entity';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ContentItem])],
  controllers: [DeliveryController],
  providers: [DeliveryService],
})
export class DeliveryModule {}
