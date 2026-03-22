import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('assets')
@Index(['organizationId', 'fileName'])
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  fileName: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bigint', default: 0 })
  fileSize: number;

  @Column({ default: '' })
  storagePath: string;

  @Column({ default: '' })
  altText: string;

  @Column({ default: '' })
  description: string;

  @Column('simple-array', { default: '' })
  tags: string[];

  @Column('jsonb', { default: {} })
  metadata: Record<string, unknown>;

  @Column()
  uploadedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
