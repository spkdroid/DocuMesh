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

export interface WorkflowState {
  name: string;
  description?: string;
  isFinal?: boolean;
}

export interface WorkflowTransition {
  from: string;
  to: string;
  requiredRole?: string;
  requiresApproval?: boolean;
}

@Entity('workflow_definitions')
export class WorkflowDefinition {
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

  @Column({ type: 'jsonb', default: [] })
  states: WorkflowState[];

  @Column({ type: 'jsonb', default: [] })
  transitions: WorkflowTransition[];

  @Column({ name: 'initial_state', length: 100, default: 'draft' })
  initialState: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
