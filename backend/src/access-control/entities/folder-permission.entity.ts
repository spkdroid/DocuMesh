import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('folder_permissions')
@Index(['organizationId', 'folderId', 'principalId'], { unique: true })
export class FolderPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  folderId: string;

  @Column()
  principalType: string; // 'user' | 'group'

  @Column()
  principalId: string;

  @Column('simple-array')
  actions: string[]; // ['read','update','delete','publish']

  @Column({ default: false })
  inherited: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
