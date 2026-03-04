import { Injectable } from '@nestjs/common';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Workflow } from './domain/workflow';
import { WorkflowNode } from './domain/workflow-node';
import { CreateWorkflowNodeDto } from './dto/create-workflow-node.dto';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowNodeDto } from './dto/update-workflow-node.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { WorkflowNodeRepository } from './infrastructure/persistence/workflow-node.repository';
import { WorkflowRepository } from './infrastructure/persistence/workflow.repository';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly workflowNodeRepository: WorkflowNodeRepository,
  ) { }

  // ==================== Workflow CRUD ====================

  async create(dto: CreateWorkflowDto, user: Workflow['user']) {
    return this.workflowRepository.create({
      title: dto.title,
      description: dto.description,
      triggerType: dto.triggerType,
      user: user,
      project: dto.projectId ? ({ id: dto.projectId } as any) : null,
    });
  }

  async findAllWithPagination({
    paginationOptions,
    user,
  }: {
    paginationOptions: IPaginationOptions;
    user: Workflow['user'];
  }) {
    return this.workflowRepository.findAllWithPagination({
      paginationOptions,
      userId:
        user?.role?.id === 1 ? undefined : (user?.id as unknown as string),
    });
  }

  findById(id: Workflow['id']) {
    return this.workflowRepository.findById(id);
  }

  async update(id: Workflow['id'], dto: UpdateWorkflowDto) {
    return this.workflowRepository.update(id, {
      title: dto.title,
      description: dto.description,
      triggerType: dto.triggerType,
    });
  }

  remove(id: Workflow['id']) {
    return this.workflowRepository.remove(id);
  }

  findByTriggerType(triggerType: string) {
    return this.workflowRepository.findByTriggerType(triggerType);
  }

  // ==================== WorkflowNode CRUD ====================

  async createNode(dto: CreateWorkflowNodeDto) {
    return this.workflowNodeRepository.create({
      type: dto.type,
      config: dto.config,
      x: dto.x,
      y: dto.y,
      workflowId: dto.workflowId,
      parentId: dto.parentId,
    });
  }

  findNodesByWorkflowId(workflowId: string) {
    return this.workflowNodeRepository.findByWorkflowId(workflowId);
  }

  findNodeById(id: WorkflowNode['id']) {
    return this.workflowNodeRepository.findById(id);
  }

  async updateNode(id: WorkflowNode['id'], dto: UpdateWorkflowNodeDto) {
    return this.workflowNodeRepository.update(id, {
      type: dto.type,
      config: dto.config,
      x: dto.x,
      y: dto.y,
      parentId: dto.parentId,
    });
  }

  removeNode(id: WorkflowNode['id']) {
    return this.workflowNodeRepository.remove(id);
  }
}
