import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export enum OutputFormat {
  HTML5 = 'html5',
  PDF = 'pdf',
  JSON = 'json',
}

@Entity('publishing_profiles')
export class PublishingProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'enum', enum: OutputFormat, default: OutputFormat.HTML5 })
  outputFormat: OutputFormat;

  @Column({ name: 'ditaval_profile_id', type: 'uuid', nullable: true })
  ditavalProfileId: string | null;

  @Column({ type: 'jsonb', default: {} })
  variables: Record<string, string>;

  @Column({ type: 'jsonb', default: {} })
  branding: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
