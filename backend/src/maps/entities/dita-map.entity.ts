import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { MapEntry } from './map-entry.entity';

export enum MapType {
  MAP = 'map',
  BOOKMAP = 'bookmap',
}

export enum MapStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('dita_maps')
@Index(['organizationId', 'slug'], { unique: true })
export class DitaMap {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ length: 500 })
  title: string;

  @Column({ length: 500 })
  slug: string;

  @Column({ type: 'enum', enum: MapType, default: MapType.MAP })
  mapType: MapType;

  @Column({ type: 'enum', enum: MapStatus, default: MapStatus.DRAFT })
  status: MapStatus;

  @Column({ length: 10, default: 'en' })
  locale: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @OneToMany(() => MapEntry, (entry) => entry.ditaMap, { cascade: true })
  entries: MapEntry[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
