import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowConnection } from '../../../../domain/workflow-connection';
import { WorkflowConnectionRepository } from '../../workflow-connection.repository';
import { WorkflowConnectionEntity } from '../entities/workflow-connection.entity';
import { WorkflowConnectionMapper } from '../mappers/workflow-connection.mapper';

@Injectable()
export class RelationalWorkflowConnectionRepository extends WorkflowConnectionRepository {
    constructor(
        @InjectRepository(WorkflowConnectionEntity)
        private readonly repo: Repository<WorkflowConnectionEntity>,
    ) {
        super();
    }

    async create(
        data: Omit<WorkflowConnection, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<WorkflowConnection> {
        const entity = this.repo.create(
            WorkflowConnectionMapper.toPersistence(data),
        );
        const saved = await this.repo.save(entity);
        return WorkflowConnectionMapper.toDomain(saved);
    }

    async findByWorkflowId(workflowId: string): Promise<WorkflowConnection[]> {
        const entities = await this.repo.find({
            where: { workflowId },
            order: { createdAt: 'ASC' },
        });
        return entities.map(WorkflowConnectionMapper.toDomain);
    }

    async remove(id: string): Promise<void> {
        await this.repo.delete(id);
    }

    async removeByWorkflowId(workflowId: string): Promise<void> {
        await this.repo.delete({ workflowId });
    }
}
