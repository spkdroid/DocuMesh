import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('event_log')
@Index(['organizationId', 'createdAt'])
@Index(['organizationId', 'entityType', 'entityId'])
export class EventLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  eventType: string;

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ default: '' })
  summary: string;

  @Column('jsonb', { default: {} })
  details: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
