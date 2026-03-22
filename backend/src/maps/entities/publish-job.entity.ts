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

export enum PublishJobStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('publish_jobs')
export class PublishJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'dita_map_id' })
  ditaMapId: string;

  @Column({ name: 'publishing_profile_id' })
  publishingProfileId: string;

  @Column({
    type: 'enum',
    enum: PublishJobStatus,
    default: PublishJobStatus.QUEUED,
  })
  status: PublishJobStatus;

  @Column({ type: 'text', name: 'output_url', default: '' })
  outputUrl: string;

  @Column({ type: 'jsonb', default: [] })
  logs: { timestamp: string; level: string; message: string }[];

  @Column({ name: 'started_at', nullable: true, type: 'timestamp' })
  startedAt: Date | null;

  @Column({ name: 'completed_at', nullable: true, type: 'timestamp' })
  completedAt: Date | null;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
