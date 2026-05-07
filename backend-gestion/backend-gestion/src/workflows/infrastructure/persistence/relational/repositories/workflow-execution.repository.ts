import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowExecution } from '../../../../domain/workflow-execution';
import { WorkflowExecutionEntity } from '../entities/workflow-execution.entity';
import { WorkflowExecutionMapper } from '../mappers/workflow-execution.mapper';
import { WorkflowExecutionRepository } from '../../workflow-execution.repository';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class WorkflowExecutionRelationalRepository
  implements WorkflowExecutionRepository
{
  constructor(
    @InjectRepository(WorkflowExecutionEntity)
    private readonly repository: Repository<WorkflowExecutionEntity>,
  ) {}

  async create(data: WorkflowExecution): Promise<WorkflowExecution> {
    const persistenceModel = WorkflowExecutionMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    return WorkflowExecutionMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    workflowId,
    paginationOptions,
  }: {
    workflowId: string;
    paginationOptions: IPaginationOptions;
  }): Promise<WorkflowExecution[]> {
    const entities = await this.repository.find({
      where: { workflowId },
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      order: { startedAt: 'DESC' },
    });

    return entities.map((entity) => WorkflowExecutionMapper.toDomain(entity));
  }

  async findById(id: WorkflowExecution['id']): Promise<WorkflowExecution | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    return entity ? WorkflowExecutionMapper.toDomain(entity) : null;
  }

  async update(
    id: WorkflowExecution['id'],
    payload: Partial<WorkflowExecution>,
  ): Promise<WorkflowExecution | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    const updatedEntity = await this.repository.save(
      this.repository.create(
        WorkflowExecutionMapper.toPersistence({
          ...WorkflowExecutionMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return WorkflowExecutionMapper.toDomain(updatedEntity);
  }

  async deleteByWorkflowId(workflowId: string): Promise<void> {
    await this.repository.delete({ workflowId });
  }
}
