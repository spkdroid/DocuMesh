import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LocalizationService } from './localization.service';
import { TranslationJobStatus } from './entities/translation-job.entity';
import {
  CreateLocaleConfigDto,
  CreateLocaleContentDto,
  UpdateLocaleContentDto,
  StartTranslationJobDto,
  ImportXliffDto,
} from './dto/localization.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Localization')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('localization')
export class LocalizationController {
  constructor(private readonly svc: LocalizationService) {}

  // === Locale Configs ===
  @Post('configs')
  @ApiOperation({ summary: 'Create locale config' })
  createConfig(@CurrentUser() user: JwtPayload, @Body() dto: CreateLocaleConfigDto) {
    return this.svc.createLocaleConfig(user.orgId, dto);
  }

  @Get('configs')
  @ApiOperation({ summary: 'List locale configs' })
  findConfigs(@CurrentUser() user: JwtPayload) {
    return this.svc.findAllLocaleConfigs(user.orgId);
  }

  @Get('configs/:id')
  @ApiOperation({ summary: 'Get locale config' })
  findConfig(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.findLocaleConfig(user.orgId, id);
  }

  @Delete('configs/:id')
  @ApiOperation({ summary: 'Delete locale config' })
  removeConfig(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.removeLocaleConfig(user.orgId, id);
  }

  // === Locale Content ===
  @Post('content')
  @ApiOperation({ summary: 'Create locale content' })
  createContent(@CurrentUser() user: JwtPayload, @Body() dto: CreateLocaleContentDto) {
    return this.svc.createLocaleContent(user.orgId, user.sub, dto);
  }

  @Get('content/by-source/:sourceContentId')
  @ApiOperation({ summary: 'List translations for a source content' })
  findBySource(@CurrentUser() user: JwtPayload, @Param('sourceContentId') sourceContentId: string) {
    return this.svc.findLocaleContents(user.orgId, sourceContentId);
  }

  @Get('content/:id')
  @ApiOperation({ summary: 'Get locale content' })
  findContent(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.findLocaleContent(user.orgId, id);
  }

  @Put('content/:id')
  @ApiOperation({ summary: 'Update locale content' })
  updateContent(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateLocaleContentDto) {
    return this.svc.updateLocaleContent(user.orgId, id, dto);
  }

  @Delete('content/:id')
  @ApiOperation({ summary: 'Delete locale content' })
  removeContent(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.svc.removeLocaleContent(user.orgId, id);
  }

  // === Fallback resolution ===
  @Get('resolve/:sourceContentId/:locale')
  @ApiOperation({ summary: 'Resolve content with fallback chain' })
  resolve(@CurrentUser() user: JwtPayload, @Param('sourceContentId') sourceContentId: string, @Param('locale') locale: string) {
    return this.svc.resolveWithFallback(user.orgId, sourceContentId, locale);
  }

  // === Source change detection ===
  @Get('out-of-date')
  @ApiOperation({ summary: 'Detect translations out of date vs source' })
  detectOutOfDate(@CurrentUser() user: JwtPayload) {
    return this.svc.detectOutOfDate(user.orgId);
  }

  // === Translation status summary ===
  @Get('status/:sourceContentId')
  @ApiOperation({ summary: 'Translation status across all locales' })
  translationStatus(@CurrentUser() user: JwtPayload, @Param('sourceContentId') sourceContentId: string) {
    return this.svc.getTranslationStatus(user.orgId, sourceContentId);
  }

  // === Translation Jobs ===
  @Post('jobs')
  @ApiOperation({ summary: 'Start translation job' })
  startJob(@CurrentUser() user: JwtPayload, @Body() dto: StartTranslationJobDto) {
    return this.svc.startTranslationJob(user.orgId, user.sub, dto);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List translation jobs' })
  @ApiQuery({ name: 'sourceContentId', required: false })
  findJobs(@CurrentUser() user: JwtPayload, @Query('sourceContentId') sourceContentId?: string) {
    return this.svc.findTranslationJobs(user.orgId, sourceContentId);
  }

  @Put('jobs/:id/status')
  @ApiOperation({ summary: 'Update translation job status' })
  updateJobStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body('status') status: TranslationJobStatus) {
    return this.svc.updateTranslationJobStatus(user.orgId, id, status);
  }

  // === XLIFF ===
  @Get('xliff/export/:sourceContentId/:targetLocale')
  @ApiOperation({ summary: 'Export XLIFF 2.0 for translation' })
  exportXliff(
    @CurrentUser() user: JwtPayload,
    @Param('sourceContentId') sourceContentId: string,
    @Param('targetLocale') targetLocale: string,
  ) {
    return this.svc.exportXliff(user.orgId, sourceContentId, targetLocale);
  }

  @Post('xliff/import')
  @ApiOperation({ summary: 'Import XLIFF with translations' })
  importXliff(@CurrentUser() user: JwtPayload, @Body() dto: ImportXliffDto) {
    return this.svc.importXliff(user.orgId, user.sub, dto.xliffContent);
  }

  // === Side-by-side ===
  @Get('side-by-side/:sourceContentId/:targetLocale')
  @ApiOperation({ summary: 'Side-by-side source vs translation' })
  sideBySide(
    @CurrentUser() user: JwtPayload,
    @Param('sourceContentId') sourceContentId: string,
    @Param('targetLocale') targetLocale: string,
  ) {
    return this.svc.getSideBySide(user.orgId, sourceContentId, targetLocale);
  }
}
