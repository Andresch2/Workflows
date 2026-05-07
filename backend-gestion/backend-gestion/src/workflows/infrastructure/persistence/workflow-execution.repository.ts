import { WorkflowExecution } from '../../domain/workflow-execution';
import { IPaginationOptions } from '../../../utils/types/pagination-options';

export abstract class WorkflowExecutionRepository {
  abstract create(
    data: Omit<WorkflowExecution, 'id' | 'startedAt' | 'finishedAt' | 'workflow'>,
  ): Promise<WorkflowExecution>;

  abstract findAllWithPagination({
    workflowId,
    paginationOptions,
  }: {
    workflowId: string;
    paginationOptions: IPaginationOptions;
  }): Promise<WorkflowExecution[]>;

  abstract findById(id: WorkflowExecution['id']): Promise<WorkflowExecution | null>;

  abstract update(
    id: WorkflowExecution['id'],
    payload: Partial<Omit<WorkflowExecution, 'id' | 'workflow'>>,
  ): Promise<WorkflowExecution | null>;

  abstract deleteByWorkflowId(workflowId: string): Promise<void>;
}
