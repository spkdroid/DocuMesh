import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { SsoProvider, SsoProviderType } from './entities/sso-provider.entity';
import { CreateSsoProviderDto, UpdateSsoProviderDto } from './dto/sso-provider.dto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class SsoService {
  constructor(
    @InjectRepository(SsoProvider)
    private readonly providerRepo: Repository<SsoProvider>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async createProvider(orgId: string, dto: CreateSsoProviderDto) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const provider = this.providerRepo.create({
      organizationId: orgId,
      name: dto.name,
      slug,
      type: dto.type,
      clientId: dto.clientId,
      clientSecret: dto.clientSecret,
      issuerUrl: dto.issuerUrl,
      authorizationUrl: dto.authorizationUrl,
      tokenUrl: dto.tokenUrl,
      userinfoUrl: dto.userinfoUrl,
      samlEntryPoint: dto.samlEntryPoint,
      samlCertificate: dto.samlCertificate,
      defaultRole: dto.defaultRole || 'viewer',
      autoProvisionUsers: dto.autoProvisionUsers ?? true,
      attributeMapping: dto.attributeMapping || {},
    });

    return this.providerRepo.save(provider);
  }

  async findAllProviders(orgId: string) {
    return this.providerRepo.find({
      where: { organizationId: orgId },
      order: { name: 'ASC' },
    });
  }

  async findProvider(orgId: string, id: string) {
    const provider = await this.providerRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!provider) throw new NotFoundException('SSO provider not found');
    return provider;
  }

  async updateProvider(orgId: string, id: string, dto: UpdateSsoProviderDto) {
    const provider = await this.findProvider(orgId, id);
    Object.assign(provider, dto);
    return this.providerRepo.save(provider);
  }

  async deleteProvider(orgId: string, id: string) {
    const provider = await this.findProvider(orgId, id);
    await this.providerRepo.remove(provider);
    return { deleted: true };
  }

  getOidcAuthUrl(provider: SsoProvider, callbackUrl: string) {
    if (provider.type !== SsoProviderType.OIDC) {
      throw new BadRequestException('Provider is not OIDC');
    }
    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state: provider.id,
    });
    return `${provider.authorizationUrl}?${params.toString()}`;
  }

  getSamlLoginUrl(provider: SsoProvider) {
    if (provider.type !== SsoProviderType.SAML) {
      throw new BadRequestException('Provider is not SAML');
    }
    return provider.samlEntryPoint;
  }

  async handleOidcCallback(
    providerId: string,
    code: string,
    callbackUrl: string,
  ) {
    const provider = await this.providerRepo.findOne({
      where: { id: providerId, enabled: true },
    });
    if (!provider) throw new NotFoundException('SSO provider not found');

    // Exchange code for tokens
    const tokenResponse = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        code,
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenResponse.ok) {
      throw new UnauthorizedException('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();

    // Get user info
    const userInfoResponse = await fetch(provider.userinfoUrl, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      throw new UnauthorizedException('Failed to fetch user info');
    }

    const userInfo = await userInfoResponse.json();
    const emailField = provider.attributeMapping.email || 'email';
    const nameField = provider.attributeMapping.name || 'name';

    const email = userInfo[emailField];
    const displayName = userInfo[nameField] || email;

    if (!email) {
      throw new UnauthorizedException('No email found in SSO response');
    }

    return this.findOrProvisionUser(provider, email, displayName);
  }

  async handleSamlCallback(providerId: string, samlResponse: Record<string, unknown>) {
    const provider = await this.providerRepo.findOne({
      where: { id: providerId, enabled: true },
    });
    if (!provider) throw new NotFoundException('SSO provider not found');

    const emailField = provider.attributeMapping.email || 'email';
    const nameField = provider.attributeMapping.name || 'displayName';

    const email = samlResponse[emailField] as string;
    const displayName = (samlResponse[nameField] as string) || email;

    if (!email) {
      throw new UnauthorizedException('No email found in SAML response');
    }

    return this.findOrProvisionUser(provider, email, displayName);
  }

  private async findOrProvisionUser(
    provider: SsoProvider,
    email: string,
    displayName: string,
  ) {
    let user = await this.usersService.findByEmail(email);

    if (!user && provider.autoProvisionUsers) {
      const randomPassword = require('crypto').randomBytes(32).toString('hex');
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      user = await this.usersService.create({
        email,
        passwordHash,
        displayName,
        role: provider.defaultRole as UserRole,
        organizationId: provider.organizationId,
      });
    }

    if (!user) {
      throw new UnauthorizedException('User not found and auto-provisioning is disabled');
    }

    if (user.organizationId !== provider.organizationId) {
      throw new UnauthorizedException('User belongs to a different organization');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      orgId: user.organizationId,
      role: user.role,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }
}
