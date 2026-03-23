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

export enum ReleaseStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  RELEASED = 'released',
  RETIRED = 'retired',
}

@Entity('releases')
export class Release {
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

  @Column({ length: 50, default: '' })
  version: string;

  @Column({
    type: 'enum',
    enum: ReleaseStatus,
    default: ReleaseStatus.PLANNING,
  })
  status: ReleaseStatus;

  @Column({ name: 'baseline_id', type: 'uuid', nullable: true })
  baselineId: string | null;

  @Column({ name: 'target_date', type: 'date', nullable: true })
  targetDate: Date | null;

  @Column({ name: 'released_at', type: 'timestamp', nullable: true })
  releasedAt: Date | null;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
