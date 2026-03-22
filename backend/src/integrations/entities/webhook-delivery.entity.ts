import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('webhook_deliveries')
@Index(['webhookId', 'createdAt'])
export class WebhookDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  webhookId: string;

  @Column()
  event: string;

  @Column('jsonb')
  payload: Record<string, unknown>;

  @Column({ default: 0 })
  statusCode: number;

  @Column({ default: '' })
  responseBody: string;

  @Column({ default: false })
  success: boolean;

  @Column({ default: 0 })
  durationMs: number;

  @CreateDateColumn()
  createdAt: Date;
}
