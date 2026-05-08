import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowNode } from '../../../../domain/workflow-node';
import { WorkflowNodeRepository } from '../../workflow-node.repository';
import { WorkflowNodeEntity } from '../entities/workflow-node.entity';
import { WorkflowNodeMapper } from '../mappers/workflow-node.mapper';

@Injectable()
export class RelationalWorkflowNodeRepository extends WorkflowNodeRepository {
  constructor(
    @InjectRepository(WorkflowNodeEntity)
    private readonly repo: Repository<WorkflowNodeEntity>,
  ) {
    super();
  }

  async create(
    data: Omit<WorkflowNode, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<WorkflowNode> {
    const entity = this.repo.create(WorkflowNodeMapper.toPersistence(data));
    const saved = await this.repo.save(entity);
    return WorkflowNodeMapper.toDomain(saved);
  }

  async findByWorkflowId(workflowId: string): Promise<WorkflowNode[]> {
    const entities = await this.repo.find({
      where: { workflowId },
      order: { createdAt: 'ASC' },
    });
    return entities.map(WorkflowNodeMapper.toDomain);
  }

  async findById(id: string): Promise<WorkflowNode | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? WorkflowNodeMapper.toDomain(entity) : null;
  }

  async update(
    id: string,
    data: Partial<WorkflowNode>,
  ): Promise<WorkflowNode | null> {
    await this.repo.update(id, WorkflowNodeMapper.toPersistence(data));
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
