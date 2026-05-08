import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectEntity } from '../../../../../projects/infrastructure/persistence/relational/entities/project.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { WorkflowNodeEntity } from './workflow-node.entity';

@Entity({ name: 'workflow' })
export class WorkflowEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', nullable: false })
  triggerType: 'webhook' | 'http' | 'event';

  @Column({ type: 'varchar', nullable: true })
  eventName?: string | null;

  @Column({ nullable: true, type: 'uuid' })
  projectId?: string | null;

  @ManyToOne(
    () => ProjectEntity,
    (project: ProjectEntity) => project.workflows,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'projectId' })
  project?: ProjectEntity | null;

  @ManyToOne(() => UserEntity, { eager: true })
  user?: UserEntity | null;

  @OneToMany(
    () => WorkflowNodeEntity,
    (node: WorkflowNodeEntity) => node.workflow,
    {
      cascade: true,
    },
  )
  nodes?: WorkflowNodeEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
