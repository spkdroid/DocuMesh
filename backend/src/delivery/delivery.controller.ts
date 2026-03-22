import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';

@ApiTags('Delivery')
@Controller('deliver')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Fetch published content by slug (public)' })
  @ApiQuery({ name: 'lang', required: false })
  @ApiQuery({ name: 'platform', required: false })
  getContent(
    @Param('slug') slug: string,
    @Query('lang') lang?: string,
    @Query('platform') platform?: string,
  ) {
    return this.deliveryService.getBySlug(slug, lang, platform);
  }
}
