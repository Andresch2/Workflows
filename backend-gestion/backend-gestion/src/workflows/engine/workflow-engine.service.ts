import { Injectable, Logger } from '@nestjs/common';
import { WorkflowNode } from '../domain/workflow-node';
import { WorkflowNodeType } from '../domain/workflow-node-type.enum';
import { WorkflowNodeRepository } from '../infrastructure/persistence/workflow-node.repository';
import { DatabaseHandler } from './handlers/database.handler';
import { DelayHandler } from './handlers/delay.handler';
import { FormHandler } from './handlers/form.handler';
import { HttpHandler } from './handlers/http.handler';
import { NotificationHandler } from './handlers/notification.handler';
import { SetHandler } from './handlers/set.handler';
import { WebhookHandler } from './handlers/webhook.handler';
import { NodeHandler, WorkflowContext } from './types';

/**
 * WorkflowEngineService
 *
 * Motor de ejecución de workflows. Carga los nodos de un workflow,
 * construye un mapa de adyacencia (childMap), encuentra el nodo raíz
 * (parentId = null), y recorre el árbol en DFS ejecutando cada nodo
 * con su handler correspondiente.
 *
 * Incluye detección de ciclos y soporte para Inngest step.run().
 */
@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);
  private readonly handlers = new Map<WorkflowNodeType, NodeHandler>();

  constructor(
    private readonly workflowNodeRepository: WorkflowNodeRepository,
    private readonly httpHandler: HttpHandler,
    private readonly webhookHandler: WebhookHandler,
    private readonly databaseHandler: DatabaseHandler,
    private readonly setHandler: SetHandler,
    private readonly delayHandler: DelayHandler,
    private readonly notificationHandler: NotificationHandler,
    private readonly formHandler: FormHandler,
  ) {
    // Registrar handlers por tipo
    this.handlers.set(WorkflowNodeType.HTTP, this.httpHandler);
    this.handlers.set(WorkflowNodeType.WEBHOOK, this.webhookHandler);
    this.handlers.set(WorkflowNodeType.DATABASE, this.databaseHandler);
    this.handlers.set(WorkflowNodeType.SET, this.setHandler);
    this.handlers.set(WorkflowNodeType.DELAY, this.delayHandler);
    this.handlers.set(WorkflowNodeType.NOTIFICATION, this.notificationHandler);
    this.handlers.set(WorkflowNodeType.FORM, this.formHandler);
    // TRIGGER no necesita handler: es el nodo de entrada
  }

  /**
   * Ejecuta un workflow completo dado su ID.
   * Opcionalmente recibe un `step` de Inngest para ejecución durable.
   */
  async executeWorkflow(
    workflowId: string,
    step?: any,
    initialContext?: Record<string, any>,
  ): Promise<{ status: string; results: Record<string, any> }> {
    this.logger.log(`Iniciando ejecución del workflow ${workflowId}`);

    // 1. Cargar todos los nodos del workflow
    const nodes =
      await this.workflowNodeRepository.findByWorkflowId(workflowId);
    if (!nodes.length) {
      this.logger.warn(`Workflow ${workflowId} no tiene nodos`);
      return { status: 'empty', results: {} };
    }

    // 2. Encontrar nodo raíz (parentId = null)
    const rootNode = this.findRootNode(nodes);
    if (!rootNode) {
      this.logger.error(
        `Workflow ${workflowId}: no se encontró nodo raíz (parentId = null)`,
      );
      return { status: 'error', results: { error: 'No root node found' } };
    }

    // 3. Construir mapa de hijos (adjacency list)
    const childMap = this.buildChildMap(nodes);

    // 4. Contexto de ejecución
    const context: WorkflowContext = {
      workflowId,
      nodes: {}, // Memoria global: resultados de cada nodo
      ...initialContext,
    };

    // 5. Recorrer el árbol y ejecutar nodos
    const results: Record<string, any> = {};
    const visited = new Set<string>();

    await this.processNode(
      rootNode,
      childMap,
      nodes,
      context,
      step,
      results,
      visited,
    );

    this.logger.log(
      `Workflow ${workflowId} completado con ${Object.keys(results).length} nodos procesados`,
    );
    return { status: 'completed', results };
  }

  /**
   * Encuentra el nodo raíz: el único nodo sin padre.
   */
  private findRootNode(nodes: WorkflowNode[]): WorkflowNode | null {
    const roots = nodes.filter((n) => !n.parentId);
    if (roots.length > 1) {
      this.logger.warn(
        `Se encontraron ${roots.length} nodos raíz, usando el primero`,
      );
    }
    return roots[0] || null;
  }

  /**
   * Construye un mapa de adyacencia: parentId → WorkflowNode[]
   */
  private buildChildMap(nodes: WorkflowNode[]): Map<string, WorkflowNode[]> {
    const map = new Map<string, WorkflowNode[]>();
    for (const node of nodes) {
      if (node.parentId) {
        const children = map.get(node.parentId) || [];
        children.push(node);
        map.set(node.parentId, children);
      }
    }
    return map;
  }

  /**
   * Procesa un nodo y sus hijos recursivamente (DFS).
   * Incluye detección de ciclos con Set de visitados.
   */
  private async processNode(
    node: WorkflowNode,
    childMap: Map<string, WorkflowNode[]>,
    allNodes: WorkflowNode[],
    context: WorkflowContext,
    step: any,
    results: Record<string, any>,
    visited: Set<string>,
  ): Promise<void> {
    // Detección de ciclos
    if (visited.has(node.id)) {
      this.logger.warn(`Ciclo detectado en nodo ${node.id}, omitiendo`);
      return;
    }
    visited.add(node.id);

    // Ejecutar handler del nodo
    const handler = this.handlers.get(node.type);
    if (handler) {
      this.logger.log(`Ejecutando nodo ${node.id} (${node.type})`);

      if (step?.run) {
        // Ejecución durable con Inngest step.run()
        results[node.id] = await step.run(`node-${node.id}`, async () => {
          return handler.execute(node, context, step);
        });
      } else {
        // Ejecución directa
        results[node.id] = await handler.execute(node, context, step);
      }
    } else {
      // Nodo TRIGGER u otro sin handler: registrar y continuar
      this.logger.log(
        `Nodo ${node.id} (${node.type}): sin handler, continuando`,
      );
      results[node.id] = { status: 'passed', type: node.type };
    }

    // Guardar el resultado en la memoria global del contexto
    context.nodes = context.nodes || {};
    context.nodes[node.id] = results[node.id];

    // Procesar hijos recursivamente
    const children = childMap.get(node.id) || [];
    for (const child of children) {
      await this.processNode(
        child,
        childMap,
        allNodes,
        context,
        step,
        results,
        visited,
      );
    }
  }
}
