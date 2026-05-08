import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'workflow_database_config' })
export class WorkflowDatabaseConfig extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  label: string;

  @Column({ unique: true })
  tableName: string;

  @Column()
  endpoint: string;

  @Column({ type: 'jsonb', default: [] })
  editableFields: any[];

  @Column({ type: 'jsonb', default: {} })
  jsonConfig: any;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
