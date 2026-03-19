import { WorkflowConnection } from '../../domain/workflow-connection';

export abstract class WorkflowConnectionRepository {
    abstract create(
        data: Omit<WorkflowConnection, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<WorkflowConnection>;

    abstract findByWorkflowId(
        workflowId: string,
    ): Promise<WorkflowConnection[]>;

    abstract remove(id: WorkflowConnection['id']): Promise<void>;

    abstract removeByWorkflowId(workflowId: string): Promise<void>;
}
