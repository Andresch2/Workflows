import { WorkflowNode } from '../../domain/workflow-node';

export abstract class WorkflowNodeRepository {
  abstract create(
    data: Omit<WorkflowNode, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<WorkflowNode>;

  abstract findByWorkflowId(workflowId: string): Promise<WorkflowNode[]>;

  abstract findById(id: WorkflowNode['id']): Promise<WorkflowNode | null>;

  abstract update(
    id: WorkflowNode['id'],
    data: Partial<WorkflowNode>,
  ): Promise<WorkflowNode | null>;

  abstract remove(id: WorkflowNode['id']): Promise<void>;
}
