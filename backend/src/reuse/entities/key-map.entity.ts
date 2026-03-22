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

@Entity('key_maps')
@Index(['organizationId', 'keyName'], { unique: true })
export class KeyMap {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'key_name', length: 255 })
  keyName: string;

  @Column({ name: 'target_content_id', nullable: true })
  targetContentId: string | null;

  @Column({ type: 'text', default: '' })
  value: string;

  @Column({ length: 500, default: '' })
  description: string;

  @Column({ length: 100, default: 'global' })
  scope: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
