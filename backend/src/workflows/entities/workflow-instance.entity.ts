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

@Entity('workflow_instances')
@Index(['contentItemId'])
export class WorkflowInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'workflow_definition_id' })
  workflowDefinitionId: string;

  @Column({ name: 'content_item_id' })
  contentItemId: string;

  @Column({ name: 'current_state', length: 100 })
  currentState: string;

  @Column({ name: 'is_complete', default: false })
  isComplete: boolean;

  @Column({ name: 'started_by', nullable: true })
  startedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
