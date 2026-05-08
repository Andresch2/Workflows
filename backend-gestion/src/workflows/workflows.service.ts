import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Workflow } from './domain/workflow';
import { WorkflowConnection } from './domain/workflow-connection';
import { WorkflowNode } from './domain/workflow-node';
import { CreateWorkflowConnectionDto } from './dto/create-workflow-connection.dto';
import { CreateWorkflowNodeDto } from './dto/create-workflow-node.dto';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowNodeDto } from './dto/update-workflow-node.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowDatabaseConfig } from './infrastructure/persistence/relational/entities/workflow-database-config.entity';
import { WorkflowConnectionRepository } from './infrastructure/persistence/workflow-connection.repository';
import { WorkflowNodeRepository } from './infrastructure/persistence/workflow-node.repository';
import { WorkflowRepository } from './infrastructure/persistence/workflow.repository';
import { WorkflowExecutionRepository } from './infrastructure/persistence/workflow-execution.repository';

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly workflowNodeRepository: WorkflowNodeRepository,
    private readonly workflowConnectionRepository: WorkflowConnectionRepository,
    @InjectRepository(WorkflowDatabaseConfig)
    private readonly databaseConfigRepo: Repository<WorkflowDatabaseConfig>,
    private readonly executionRepository: WorkflowExecutionRepository,
  ) { }

  // Configuración

  async getDatabaseConfigs() {
    return this.databaseConfigRepo.find({
      where: { isActive: true },
      order: { label: 'ASC' },
    });
  }

  // CRUD de Workflow

  async create(dto: CreateWorkflowDto, user: Workflow['user']) {
    const triggerType = dto.triggerType;
    const eventName = this.resolveEventName(triggerType, dto.eventName);

    return this.workflowRepository.create({
      title: dto.title,
      description: dto.description,
      triggerType,
      eventName,
      user,
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
    const existing = await this.workflowRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Workflow no encontrado');
    }

    const triggerType = dto.triggerType ?? existing.triggerType;
    const incomingEventName =
      dto.eventName !== undefined ? dto.eventName : existing.eventName;
    const eventName = this.resolveEventName(triggerType, incomingEventName);

    return this.workflowRepository.update(id, {
      title: dto.title,
      description: dto.description,
      triggerType,
      eventName,
    });
  }

  remove(id: Workflow['id']) {
    return this.workflowRepository.remove(id);
  }

  findByTriggerType(triggerType: string) {
    return this.workflowRepository.findByTriggerType(triggerType);
  }

  async findByEventName(eventName: string) {
    const workflows = await this.workflowRepository.findByTriggerType('event');
    return workflows.filter((w) => w.eventName === eventName);
  }

  // CRUD de Nodos de Workflow

  async createNode(dto: CreateWorkflowNodeDto) {
    const workflow = await this.workflowRepository.findById(dto.workflowId);
    if (!workflow) {
      throw new NotFoundException('Workflow no encontrado');
    }

    if (dto.name) {
      await this.validateNodeNameUniqueness(dto.workflowId, dto.name);
    }

    if (dto.parentId) {
      await this.validateParentNode(dto.workflowId, dto.parentId);
    }

    return this.workflowNodeRepository.create({
      type: dto.type,
      name: dto.name,
      config: dto.config,
      dataSchema: dto.dataSchema,
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
    const existingNode = await this.workflowNodeRepository.findById(id);
    if (!existingNode) {
      throw new NotFoundException('Nodo no encontrado');
    }

    const nextName =
      dto.name !== undefined ? dto.name : existingNode.name || undefined;

    if (nextName) {
      await this.validateNodeNameUniqueness(
        existingNode.workflowId,
        nextName,
        id,
      );
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException(
          'Un nodo no puede ser padre de sí mismo',
        );
      }
      await this.validateParentNode(existingNode.workflowId, dto.parentId);
    }

    return this.workflowNodeRepository.update(id, {
      type: dto.type,
      name: dto.name,
      config: dto.config,
      dataSchema: dto.dataSchema,
      x: dto.x,
      y: dto.y,
      parentId: dto.parentId,
    });
  }

  removeNode(id: WorkflowNode['id']) {
    return this.workflowNodeRepository.remove(id);
  }

  // CRUD de Conexiones de Workflow

  async createConnection(
    dto: CreateWorkflowConnectionDto,
  ): Promise<WorkflowConnection> {
    const workflow = await this.workflowRepository.findById(dto.workflowId);
    if (!workflow) {
      throw new NotFoundException('Workflow no encontrado');
    }

    const sourceNode = await this.workflowNodeRepository.findById(
      dto.sourceNodeId,
    );
    const targetNode = await this.workflowNodeRepository.findById(
      dto.targetNodeId,
    );

    if (!sourceNode) {
      throw new NotFoundException('Nodo origen no encontrado');
    }

    if (!targetNode) {
      throw new NotFoundException('Nodo destino no encontrado');
    }

    if (sourceNode.workflowId !== dto.workflowId) {
      throw new BadRequestException(
        'El nodo origen no pertenece al workflow indicado',
      );
    }

    if (targetNode.workflowId !== dto.workflowId) {
      throw new BadRequestException(
        'El nodo destino no pertenece al workflow indicado',
      );
    }

    const existing =
      await this.workflowConnectionRepository.findByWorkflowId(dto.workflowId);

    this.checkConnectionValidity(existing, dto.sourceNodeId, dto.targetNodeId);

    return this.workflowConnectionRepository.create({
      workflowId: dto.workflowId,
      sourceNodeId: dto.sourceNodeId,
      targetNodeId: dto.targetNodeId,
      sourceHandle: dto.sourceHandle,
      targetHandle: dto.targetHandle,
    });
  }

  findConnectionsByWorkflowId(
    workflowId: string,
  ): Promise<WorkflowConnection[]> {
    return this.workflowConnectionRepository.findByWorkflowId(workflowId);
  }

  removeConnection(id: string): Promise<void> {
    return this.workflowConnectionRepository.remove(id);
  }

  removeConnectionsByWorkflowId(workflowId: string): Promise<void> {
    return this.workflowConnectionRepository.removeByWorkflowId(workflowId);
  }

  // Historial de Ejecuciones

  async getExecutions(workflowId: string, paginationOptions: IPaginationOptions) {
    return this.executionRepository.findAllWithPagination({
      workflowId,
      paginationOptions,
    });
  }

  async clearExecutions(workflowId: string): Promise<void> {
    await this.executionRepository.deleteByWorkflowId(workflowId);
  }

  async getExecutionById(id: string) {
    const execution = await this.executionRepository.findById(id);
    if (!execution) {
      throw new NotFoundException('Ejecución no encontrada');
    }
    return execution;
  }

  // Funciones Auxiliares

  private resolveEventName(
    triggerType: string | undefined,
    rawEventName?: string | null,
  ): string | null {
    if (triggerType !== 'event') {
      return null;
    }

    const normalized = String(rawEventName || '').trim();
    if (!normalized) {
      throw new BadRequestException(
        'eventName es obligatorio cuando triggerType = event',
      );
    }

    return normalized;
  }

  private normalizeNodeName(rawName: string): string {
    return String(rawName || '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');
  }

  private async validateNodeNameUniqueness(
    workflowId: string,
    name: string,
    excludeNodeId?: string,
  ): Promise<void> {
    const normalizedTarget = this.normalizeNodeName(name);

    if (!normalizedTarget) {
      throw new BadRequestException(
        'El nombre del nodo no puede quedar vacío después de normalizarse',
      );
    }

    const existingNodes =
      await this.workflowNodeRepository.findByWorkflowId(workflowId);

    const duplicate = existingNodes.find((node) => {
      if (excludeNodeId && node.id === excludeNodeId) {
        return false;
      }

      const normalizedExisting = this.normalizeNodeName(
        node.name || node.type,
      );

      return normalizedExisting === normalizedTarget;
    });

    if (duplicate) {
      throw new BadRequestException(
        `Ya existe un nodo con el identificador "${normalizedTarget}" en este workflow`,
      );
    }
  }

  private async validateParentNode(
    workflowId: string,
    parentId: string,
  ): Promise<void> {
    const parentNode = await this.workflowNodeRepository.findById(parentId);

    if (!parentNode) {
      throw new NotFoundException('El nodo padre no existe');
    }

    if (parentNode.workflowId !== workflowId) {
      throw new BadRequestException(
        'El nodo padre no pertenece al workflow indicado',
      );
    }
  }

  // Validaciones de Conexiones

  private checkConnectionValidity(
    connections: WorkflowConnection[],
    sourceId: string,
    targetId: string,
  ) {
    if (sourceId === targetId) {
      throw new BadRequestException(
        'Un nodo no puede conectarse a sí mismo',
      );
    }

    const duplicated = connections.find(
      (c) => c.sourceNodeId === sourceId && c.targetNodeId === targetId,
    );

    if (duplicated) {
      throw new BadRequestException('La conexión ya existe');
    }

    // Si target ya puede llegar a source, agregar source -> target crea ciclo
    if (this.hasPath(connections, targetId, sourceId)) {
      throw new BadRequestException('La conexión crea un ciclo inválido');
    }
  }

  private hasPath(
    connections: WorkflowConnection[],
    fromNodeId: string,
    toNodeId: string,
  ): boolean {
    const adjacency = new Map<string, string[]>();

    for (const connection of connections) {
      const list = adjacency.get(connection.sourceNodeId) || [];
      list.push(connection.targetNodeId);
      adjacency.set(connection.sourceNodeId, list);
    }

    const visited = new Set<string>();
    const stack: string[] = [fromNodeId];

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (current === toNodeId) {
        return true;
      }

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      for (const next of adjacency.get(current) || []) {
        if (!visited.has(next)) {
          stack.push(next);
        }
      }
    }

    return false;
  }
}