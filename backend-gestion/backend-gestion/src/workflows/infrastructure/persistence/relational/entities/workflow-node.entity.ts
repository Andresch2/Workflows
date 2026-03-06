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
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { WorkflowNodeType } from '../../../../domain/workflow-node-type.enum';
import { WorkflowEntity } from './workflow.entity';

@Entity({ name: 'workflow_node' })
export class WorkflowNodeEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: WorkflowNodeType,
    default: WorkflowNodeType.TRIGGER,
  })
  type: WorkflowNodeType;

  @Column({ type: 'jsonb', nullable: true })
  config?: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  dataSchema?: Record<string, any> | null;

  @Column({ type: 'float', default: 0 })
  x: number;

  @Column({ type: 'float', default: 0 })
  y: number;

  @Column({ type: 'uuid' })
  workflowId: string;

  @Column({ type: 'uuid', nullable: true })
  parentId?: string | null;

  // FK → Workflow
  @ManyToOne(() => WorkflowEntity, (wf) => wf.nodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow: WorkflowEntity;

  // Self-reference: padre
  @ManyToOne(() => WorkflowNodeEntity, (node) => node.childNodes, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentId' })
  parentNode?: WorkflowNodeEntity | null;

  // Self-reference: hijos
  @OneToMany(() => WorkflowNodeEntity, (node) => node.parentNode)
  childNodes?: WorkflowNodeEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
