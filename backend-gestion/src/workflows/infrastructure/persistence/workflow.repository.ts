import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Workflow } from '../../domain/workflow';

export abstract class WorkflowRepository {
  abstract create(
    data: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Workflow>;

  abstract findAllWithPagination(options: {
    paginationOptions: IPaginationOptions;
    userId?: string;
  }): Promise<{ data: Workflow[]; total: number }>;

  abstract findById(id: Workflow['id']): Promise<Workflow | null>;

  abstract findByTriggerType(triggerType: string): Promise<Workflow[]>;

  abstract update(
    id: Workflow['id'],
    data: Partial<Workflow>,
  ): Promise<Workflow | null>;

  abstract remove(id: Workflow['id']): Promise<void>;
}
