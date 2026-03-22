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

@Entity('ditaval_profiles')
export class DitavalProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 500, default: '' })
  description: string;

  @Column({ type: 'jsonb', default: [] })
  rules: DitavalRule[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export interface DitavalRule {
  attribute: string;
  value: string;
  action: 'include' | 'exclude' | 'flag';
  flagColor?: string;
}
