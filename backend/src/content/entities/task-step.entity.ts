import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContentItem } from './content-item.entity';

@Entity('task_steps')
export class TaskStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ContentItem, (item) => item.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_item_id' })
  contentItem: ContentItem;

  @Column({ name: 'content_item_id' })
  contentItemId: string;

  @Column({ name: 'step_number' })
  stepNumber: number;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'jsonb', default: {} })
  body: Record<string, unknown>;

  @Column({ type: 'text', name: 'step_result', default: '' })
  stepResult: string;

  @Column({ type: 'text', default: '' })
  info: string;

  @ManyToOne(() => TaskStep, (step) => step.subSteps, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_step_id' })
  parentStep: TaskStep | null;

  @Column({ name: 'parent_step_id', nullable: true })
  parentStepId: string | null;

  @OneToMany(() => TaskStep, (step) => step.parentStep)
  subSteps: TaskStep[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
