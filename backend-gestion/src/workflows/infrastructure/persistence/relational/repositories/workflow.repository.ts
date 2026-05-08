import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { Workflow } from '../../../../domain/workflow';
import { WorkflowRepository } from '../../workflow.repository';
import { WorkflowEntity } from '../entities/workflow.entity';
import { WorkflowMapper } from '../mappers/workflow.mapper';

@Injectable()
export class RelationalWorkflowRepository extends WorkflowRepository {
  constructor(
    @InjectRepository(WorkflowEntity)
    private readonly repo: Repository<WorkflowEntity>,
  ) {
    super();
  }

  async create(
    data: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Workflow> {
    const entity = this.repo.create(WorkflowMapper.toPersistence(data));
    const saved = await this.repo.save(entity);
    return WorkflowMapper.toDomain(saved);
  }

  async findAllWithPagination(options: {
    paginationOptions: IPaginationOptions;
    userId?: string;
  }): Promise<{ data: Workflow[]; total: number }> {
    const where: any = {};
    if (options.userId) {
      where.user = { id: options.userId };
    }

    const [entities, total] = await this.repo.findAndCount({
      where,
      skip:
        (options.paginationOptions.page - 1) * options.paginationOptions.limit,
      take: options.paginationOptions.limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: entities.map(WorkflowMapper.toDomain),
      total,
    };
  }

  async findById(id: string): Promise<Workflow | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? WorkflowMapper.toDomain(entity) : null;
  }

  async findByTriggerType(triggerType: string): Promise<Workflow[]> {
    const entities = await this.repo.find({
      where: { triggerType: triggerType as any },
    });
    return entities.map(WorkflowMapper.toDomain);
  }

  async update(id: string, data: Partial<Workflow>): Promise<Workflow | null> {
    await this.repo.update(id, WorkflowMapper.toPersistence(data));
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
