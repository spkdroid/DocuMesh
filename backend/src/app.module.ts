import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ContentModule } from './content/content.module';
import { PublicationsModule } from './publications/publications.module';
import { DeliveryModule } from './delivery/delivery.module';
import { ReuseModule } from './reuse/reuse.module';
import { MapsModule } from './maps/maps.module';
import { VersioningModule } from './versioning/versioning.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { LocalizationModule } from './localization/localization.module';
import { AccessControlModule } from './access-control/access-control.module';
import { TaxonomyModule } from './taxonomy/taxonomy.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { SsoModule } from './sso/sso.module';
import { TemplatesModule } from './templates/templates.module';
import { QualityModule } from './quality/quality.module';
import { AiModule } from './ai/ai.module';
import { CollaborationModule } from './collaboration/collaboration.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        autoLoadEntities: true,
        synchronize: config.get<boolean>('database.synchronize'),
      }),
    }),

    AuthModule,
    UsersModule,
    OrganizationsModule,
    ContentModule,
    PublicationsModule,
    DeliveryModule,
    ReuseModule,
    MapsModule,
    VersioningModule,
    WorkflowsModule,
    LocalizationModule,
    AccessControlModule,
    TaxonomyModule,
    IntegrationsModule,
    SsoModule,
    TemplatesModule,
    QualityModule,
    AiModule,
    CollaborationModule,
  ],
})
export class AppModule {}
