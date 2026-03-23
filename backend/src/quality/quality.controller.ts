import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QualityService } from './quality.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Quality Scoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quality')
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Post('score/:contentItemId')
  @ApiOperation({ summary: 'Score a content item for quality' })
  scoreContent(
    @CurrentUser() user: JwtPayload,
    @Param('contentItemId', ParseUUIDPipe) contentItemId: string,
  ) {
    return this.qualityService.scoreContent(user.orgId, contentItemId);
  }

  @Get('score/:contentItemId')
  @ApiOperation({ summary: 'Get the latest quality score for a content item' })
  getScore(
    @CurrentUser() user: JwtPayload,
    @Param('contentItemId', ParseUUIDPipe) contentItemId: string,
  ) {
    return this.qualityService.getScore(user.orgId, contentItemId);
  }

  @Get('scores')
  @ApiOperation({ summary: 'List all quality scores for the organization' })
  getOrgScores(@CurrentUser() user: JwtPayload) {
    return this.qualityService.getOrgScores(user.orgId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Quality statistics for the organization' })
  getOrgQualityStats(@CurrentUser() user: JwtPayload) {
    return this.qualityService.getOrgQualityStats(user.orgId);
  }

  @Post('score-all')
  @ApiOperation({ summary: 'Score all content items in the organization' })
  scoreAllContent(@CurrentUser() user: JwtPayload) {
    return this.qualityService.scoreAllContent(user.orgId);
  }
}
