import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  PUBLISH = 'publish',
  REVIEW = 'review',
  MANAGE = 'manage',
}

export enum PermissionResource {
  CONTENT = 'content',
  MAP = 'map',
  PUBLICATION = 'publication',
  WORKFLOW = 'workflow',
  TAXONOMY = 'taxonomy',
  LOCALIZATION = 'localization',
  USER = 'user',
  ORGANIZATION = 'organization',
}

@Entity('permissions')
@Index(['organizationId', 'role', 'resource', 'action'], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  role: string;

  @Column({ type: 'enum', enum: PermissionResource })
  resource: PermissionResource;

  @Column({ type: 'enum', enum: PermissionAction })
  action: PermissionAction;

  @Column({ default: true })
  allowed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
