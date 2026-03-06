import { WorkflowNode } from '../../../../domain/workflow-node';
import { WorkflowNodeEntity } from '../entities/workflow-node.entity';

export class WorkflowNodeMapper {
  static toDomain(entity: WorkflowNodeEntity): WorkflowNode {
    const domain = new WorkflowNode();
    domain.id = entity.id;
    domain.type = entity.type;
    domain.config = entity.config;
    domain.dataSchema = entity.dataSchema;
    domain.x = entity.x;
    domain.y = entity.y;
    domain.workflowId = entity.workflowId;
    domain.parentId = entity.parentId;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    return domain;
  }

  static toPersistence(
    domain: Partial<WorkflowNode>,
  ): Partial<WorkflowNodeEntity> {
    const entity: Partial<WorkflowNodeEntity> = {};
    if (domain.type !== undefined) entity.type = domain.type;
    if (domain.config !== undefined) entity.config = domain.config;
    if (domain.dataSchema !== undefined) entity.dataSchema = domain.dataSchema;
    if (domain.x !== undefined) entity.x = domain.x;
    if (domain.y !== undefined) entity.y = domain.y;
    if (domain.workflowId !== undefined) entity.workflowId = domain.workflowId;
    if (domain.parentId !== undefined) entity.parentId = domain.parentId;
    return entity;
  }
}
