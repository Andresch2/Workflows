import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { WorkflowNodeEntity } from './workflow-node.entity';
import { WorkflowEntity } from './workflow.entity';

@Entity({ name: 'workflow_connection' })
export class WorkflowConnectionEntity extends EntityRelationalHelper {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    workflowId: string;

    @Column({ type: 'uuid' })
    sourceNodeId: string;

    @Column({ type: 'uuid' })
    targetNodeId: string;

    @Column({ type: 'varchar', nullable: true })
    sourceHandle?: string | null;

    @Column({ type: 'varchar', nullable: true })
    targetHandle?: string | null;

    @ManyToOne(() => WorkflowEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'workflowId' })
    workflow: WorkflowEntity;

    @ManyToOne(() => WorkflowNodeEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sourceNodeId' })
    sourceNode: WorkflowNodeEntity;

    @ManyToOne(() => WorkflowNodeEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'targetNodeId' })
    targetNode: WorkflowNodeEntity;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
