import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export enum SsoProviderType {
  OIDC = 'oidc',
  SAML = 'saml',
}

@Entity('sso_providers')
@Index(['organizationId', 'slug'], { unique: true })
export class SsoProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 200 })
  slug: string;

  @Column({ type: 'enum', enum: SsoProviderType })
  type: SsoProviderType;

  @Column({ name: 'client_id', length: 500, nullable: true })
  clientId: string;

  @Column({ name: 'client_secret', length: 1000, nullable: true })
  clientSecret: string;

  @Column({ name: 'issuer_url', length: 1000, nullable: true })
  issuerUrl: string;

  @Column({ name: 'authorization_url', length: 1000, nullable: true })
  authorizationUrl: string;

  @Column({ name: 'token_url', length: 1000, nullable: true })
  tokenUrl: string;

  @Column({ name: 'userinfo_url', length: 1000, nullable: true })
  userinfoUrl: string;

  @Column({ name: 'saml_entry_point', length: 1000, nullable: true })
  samlEntryPoint: string;

  @Column({ name: 'saml_certificate', type: 'text', nullable: true })
  samlCertificate: string;

  @Column({ name: 'default_role', length: 50, default: 'viewer' })
  defaultRole: string;

  @Column({ name: 'auto_provision_users', default: true })
  autoProvisionUsers: boolean;

  @Column({ name: 'enabled', default: true })
  enabled: boolean;

  @Column({ type: 'jsonb', name: 'attribute_mapping', default: {} })
  attributeMapping: Record<string, string>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
