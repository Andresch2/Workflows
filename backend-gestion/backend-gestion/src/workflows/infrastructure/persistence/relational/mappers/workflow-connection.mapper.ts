import { WorkflowConnection } from '../../../../domain/workflow-connection';
import { WorkflowConnectionEntity } from '../entities/workflow-connection.entity';

export class WorkflowConnectionMapper {
    static toDomain(entity: WorkflowConnectionEntity): WorkflowConnection {
        const domain = new WorkflowConnection();
        domain.id = entity.id;
        domain.workflowId = entity.workflowId;
        domain.sourceNodeId = entity.sourceNodeId;
        domain.targetNodeId = entity.targetNodeId;
        domain.sourceHandle = entity.sourceHandle;
        domain.targetHandle = entity.targetHandle;
        domain.createdAt = entity.createdAt;
        domain.updatedAt = entity.updatedAt;
        return domain;
    }

    static toPersistence(
        domain: Partial<WorkflowConnection>,
    ): Partial<WorkflowConnectionEntity> {
        const entity: Partial<WorkflowConnectionEntity> = {};
        if (domain.workflowId !== undefined) entity.workflowId = domain.workflowId;
        if (domain.sourceNodeId !== undefined)
            entity.sourceNodeId = domain.sourceNodeId;
        if (domain.targetNodeId !== undefined)
            entity.targetNodeId = domain.targetNodeId;
        if (domain.sourceHandle !== undefined)
            entity.sourceHandle = domain.sourceHandle;
        if (domain.targetHandle !== undefined)
            entity.targetHandle = domain.targetHandle;
        return entity;
    }
}
