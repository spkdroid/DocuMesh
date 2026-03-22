import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_groups')
@Index(['organizationId', 'name'], { unique: true })
export class UserGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  name: string;

  @Column({ default: '' })
  description: string;

  @ManyToMany(() => User, { eager: false })
  @JoinTable({
    name: 'user_group_members',
    joinColumn: { name: 'groupId' },
    inverseJoinColumn: { name: 'userId' },
  })
  members: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
