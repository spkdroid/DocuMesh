import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('content_embeddings')
@Index(['organizationId', 'contentItemId'], { unique: true })
export class ContentEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'content_item_id' })
  contentItemId: string;

  @Column({ length: 500, default: '' })
  title: string;

  @Column({ type: 'text', default: '' })
  textContent: string;

  @Column({ type: 'jsonb', name: 'embedding', default: [] })
  embedding: number[];

  @Column({ length: 50, name: 'model_name', default: 'text-embedding-3-small' })
  modelName: string;

  @CreateDateColumn({ name: 'embedded_at' })
  embeddedAt: Date;
}
