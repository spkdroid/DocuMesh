import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { SsoService } from './sso.service';
import { CreateSsoProviderDto, UpdateSsoProviderDto, SsoCallbackDto } from './dto/sso-provider.dto';

@ApiTags('SSO')
@Controller('sso')
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  @Post('providers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an SSO provider for the organization' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSsoProviderDto) {
    return this.ssoService.createProvider(user.orgId, dto);
  }

  @Get('providers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List SSO providers for the organization' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.ssoService.findAllProviders(user.orgId);
  }

  @Get('providers/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an SSO provider' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ssoService.findProvider(user.orgId, id);
  }

  @Patch('providers/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an SSO provider' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSsoProviderDto,
  ) {
    return this.ssoService.updateProvider(user.orgId, id, dto);
  }

  @Delete('providers/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an SSO provider' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ssoService.deleteProvider(user.orgId, id);
  }

  @Get('providers/:id/login')
  @ApiOperation({ summary: 'Get SSO login URL (redirect user here)' })
  async getLoginUrl(@Param('id') id: string, @Query('callback') callback: string) {
    const provider = await this.ssoService.findProvider(null, id);
    if (provider.type === 'oidc') {
      return { url: this.ssoService.getOidcAuthUrl(provider, callback) };
    }
    return { url: this.ssoService.getSamlLoginUrl(provider) };
  }

  @Post('callback/oidc')
  @ApiOperation({ summary: 'OIDC callback — exchange code for JWT' })
  handleOidcCallback(@Body() dto: SsoCallbackDto, @Query('callback') callback: string) {
    return this.ssoService.handleOidcCallback(dto.state, dto.code, callback);
  }

  @Post('callback/saml')
  @ApiOperation({ summary: 'SAML callback — process SAML assertion' })
  handleSamlCallback(@Body() body: Record<string, unknown>) {
    const providerId = body.RelayState as string;
    return this.ssoService.handleSamlCallback(providerId, body);
  }
}
