import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('trash_items')
@Index(['organizationId', 'entityType', 'entityId'], { unique: true })
export class TrashItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column()
  entityTitle: string;

  @Column('jsonb')
  snapshot: Record<string, unknown>;

  @Column()
  deletedBy: string;

  @CreateDateColumn()
  deletedAt: Date;

  @Column()
  expiresAt: Date;
}
