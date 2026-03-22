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

@Entity('locale_configs')
@Index(['organizationId', 'locale'], { unique: true })
export class LocaleConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ length: 10 })
  locale: string;

  @Column({ length: 100 })
  name: string;

  /** Ordered fallback chain, e.g. ['fr', 'en'] */
  @Column({ type: 'jsonb', name: 'fallback_chain', default: [] })
  fallbackChain: string[];

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'is_rtl', default: false })
  isRtl: boolean;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
