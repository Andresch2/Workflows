import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskEntity } from '../../../../../tasks/infrastructure/persistence/relational/entities/task.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { WorkflowEntity } from '../../../../../workflows/infrastructure/persistence/relational/entities/workflow.entity';

@Entity({
  name: 'project',
})
export class ProjectEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    nullable: false,
    type: String,
  })
  name: string;

  @Column({
    nullable: true,
    type: String,
  })
  description?: string | null;

  @Column({
    type: 'date',
    nullable: true,
  })
  startDate?: string | null;

  @Column({
    type: 'date',
    nullable: true,
  })
  endDate?: string | null;

  // Relación con Tasks (One-to-Many)
  @OneToMany(() => TaskEntity, (task: TaskEntity) => task.project, {
    cascade: true,
  })
  tasks?: TaskEntity[];

  // Relación con Workflows (One-to-Many)
  @OneToMany(
    () => WorkflowEntity,
    (workflow: WorkflowEntity) => workflow.project,
  )
  workflows?: WorkflowEntity[];

  @ManyToOne(() => UserEntity, {
    eager: true,
  })
  user?: UserEntity | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
