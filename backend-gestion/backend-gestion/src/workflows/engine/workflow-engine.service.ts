import { Injectable, Logger } from '@nestjs/common';
import { WorkflowConnection } from '../domain/workflow-connection';
import { WorkflowNode } from '../domain/workflow-node';
import { WorkflowNodeType } from '../domain/workflow-node-type.enum';
import { WorkflowConnectionRepository } from '../infrastructure/persistence/workflow-connection.repository';
import { WorkflowNodeRepository } from '../infrastructure/persistence/workflow-node.repository';
import { DatabaseHandler } from './handlers/database.handler';
import { DelayHandler } from './handlers/delay.handler';
import { FormHandler } from './handlers/form.handler';
import { HttpHandler } from './handlers/http.handler';
import { IfHandler } from './handlers/if.handler';
import { NotificationHandler } from './handlers/notification.handler';
import { NodeHandler, NodeResult, WorkflowContext } from './types';

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);
  private readonly handlers = new Map<WorkflowNodeType, NodeHandler>();

  constructor(
    private readonly workflowNodeRepository: WorkflowNodeRepository,
    private readonly workflowConnectionRepository: WorkflowConnectionRepository,
    private readonly httpHandler: HttpHandler,
    private readonly databaseHandler: DatabaseHandler,
    private readonly delayHandler: DelayHandler,
    private readonly notificationHandler: NotificationHandler,
    private readonly formHandler: FormHandler,
    private readonly ifHandler: IfHandler,
  ) {
    this.handlers.set(WorkflowNodeType.HTTP, this.httpHandler);
    this.handlers.set(WorkflowNodeType.DATABASE, this.databaseHandler);
    this.handlers.set(WorkflowNodeType.DELAY, this.delayHandler);
    this.handlers.set(WorkflowNodeType.NOTIFICATION, this.notificationHandler);
    this.handlers.set(WorkflowNodeType.FORM, this.formHandler);
    this.handlers.set(WorkflowNodeType.IF, this.ifHandler);
  }

  async executeWorkflow(
    workflowId: string,
    step?: any,
    initialContext?: Record<string, any>,
  ): Promise<{ status: string; results: Record<string, NodeResult> }> {
    this.logger.log(`Iniciando ejecución del workflow ${workflowId}`);

    const nodes = await this.workflowNodeRepository.findByWorkflowId(workflowId);
    if (!nodes.length) {
      this.logger.warn(`Workflow ${workflowId} no tiene nodos`);
      return { status: 'empty', results: {} };
    }

    const connections =
      await this.workflowConnectionRepository.findByWorkflowId(workflowId);

    const initialPayload = this.resolveInitialPayload(initialContext);

    const context: WorkflowContext = {
      workflowId,
      ...initialContext,
      nodes: initialContext?.nodes ?? {},
      $node: initialContext?.$node ?? {},
      $globals: {
        ...(initialContext?.['$globals'] || {}),
      },
      $env: this.getSafeEnv(),
      $json: initialPayload,
      input: initialContext?.input ?? initialPayload,
      webhookPayload: initialContext?.webhookPayload,
      webhook: initialContext?.webhook,
    };

    let executionOrder: WorkflowNode[];

    if (connections.length > 0) {
      executionOrder = this.topologicalSort(nodes, connections);
    } else {
      executionOrder = this.legacyDfsOrder(nodes);
    }

    if (executionOrder.length === 0) {
      this.logger.error(
        `Workflow ${workflowId}: ciclo detectado o no hay nodos alcanzables`,
      );

      return {
        status: 'error',
        results: {
          __error: {
            status: 'failed',
            nodeId: '',
            nodeName: '',
            type: 'ENGINE',
            data: null,
            error: 'Cycle detected or no reachable nodes',
          },
        },
      };
    }

    const results: Record<string, NodeResult> = {};
    const skippedNodes = new Set<string>();

    for (const node of executionOrder) {
      // Validar si el nodo debe ejecutarse o saltarse
      const incomingConns = connections.filter(c => c.targetNodeId === node.id);

      if (incomingConns.length > 0) {
        let hasActiveConnection = false;

        for (const conn of incomingConns) {
          if (skippedNodes.has(conn.sourceNodeId)) continue;

          const sourceResult = results[conn.sourceNodeId];
          if (sourceResult?.type === WorkflowNodeType.IF) {
            const activeBranch = sourceResult.data?.branch;
            // Si el conector no especifica handle, o si coincide con la rama activa
            if (!conn.sourceHandle || conn.sourceHandle === activeBranch) {
              hasActiveConnection = true;
              break;
            }
          } else {
            hasActiveConnection = true;
            break;
          }
        }

        if (!hasActiveConnection) {
          this.logger.log(`Saltando nodo [${node.id}] (rama inactiva)`);
          skippedNodes.add(node.id);
          continue;
        }
      }

      const nodeResult = await this.executeNode(
        node,
        connections,
        context,
        step,
      );

      results[node.id] = nodeResult;

      const nodesRegistry = context.nodes ?? (context.nodes = {});
      nodesRegistry[node.id] = nodeResult;

      const nodeRegistry = context.$node ?? (context.$node = {});
      const nodeName = this.getNodeName(node);

      if (nodeName) {
        nodeRegistry[nodeName] = nodeResult;
      }

      // Alias adicional por id, útil para depurar
      nodeRegistry[node.id] = nodeResult;
    }

    this.logger.log(
      `Workflow ${workflowId} completado con ${Object.keys(results).length} nodos procesados`,
    );

    return { status: 'completed', results };
  }

  private resolveInitialPayload(initialContext?: Record<string, any>): any {
    if (!initialContext || typeof initialContext !== 'object') return {};

    // 1. Prioridad: Claves explícitas de payload
    if (initialContext['$json'] !== undefined) return initialContext['$json'];
    if (initialContext['input'] !== undefined) return initialContext['input'];
    if (initialContext['webhookPayload'] !== undefined)
      return initialContext['webhookPayload'];
    if (initialContext['webhook']?.body !== undefined)
      return initialContext['webhook'].body;
    if (initialContext['data'] !== undefined) return initialContext['data'];

    // 2. Fallback: Si el objeto mismo tiene datos, es el payload
    // Filtramos workflowId para no ensuciar los datos del negocio
    const { workflowId, ...rest } = initialContext as any;
    if (Object.keys(rest).length > 0) return rest;

    return Object.keys(initialContext).length > 0 ? initialContext : {};
  }

  private topologicalSort(
    nodes: WorkflowNode[],
    connections: WorkflowConnection[],
  ): WorkflowNode[] {
    const nodeMap = new Map<string, WorkflowNode>();
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const node of nodes) {
      nodeMap.set(node.id, node);
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }

    for (const conn of connections) {
      if (!nodeMap.has(conn.sourceNodeId) || !nodeMap.has(conn.targetNodeId)) {
        this.logger.warn(
          `Conexión inválida ignorada: ${conn.sourceNodeId} -> ${conn.targetNodeId}`,
        );
        continue;
      }

      const targets = adjacency.get(conn.sourceNodeId) || [];
      targets.push(conn.targetNodeId);
      adjacency.set(conn.sourceNodeId, targets);

      inDegree.set(
        conn.targetNodeId,
        (inDegree.get(conn.targetNodeId) || 0) + 1,
      );
    }

    const queue: string[] = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) {
        queue.push(id);
      }
    }

    const sorted: WorkflowNode[] = [];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentNode = nodeMap.get(currentId);

      if (currentNode) {
        sorted.push(currentNode);
      }

      for (const targetId of adjacency.get(currentId) || []) {
        const newDegree = (inDegree.get(targetId) || 1) - 1;
        inDegree.set(targetId, newDegree);

        if (newDegree === 0) {
          queue.push(targetId);
        }
      }
    }

    if (sorted.length !== nodes.length) {
      this.logger.error(
        `Ciclo detectado: ${sorted.length}/${nodes.length} nodos procesados`,
      );
      return [];
    }

    return sorted;
  }

  private legacyDfsOrder(nodes: WorkflowNode[]): WorkflowNode[] {
    const roots = nodes.filter((n) => !n.parentId);
    if (roots.length === 0) return [];

    const childMap = new Map<string, WorkflowNode[]>();
    for (const node of nodes) {
      if (node.parentId) {
        const children = childMap.get(node.parentId) || [];
        children.push(node);
        childMap.set(node.parentId, children);
      }
    }

    const order: WorkflowNode[] = [];
    const visited = new Set<string>();

    const dfs = (node: WorkflowNode) => {
      if (visited.has(node.id)) return;
      visited.add(node.id);
      order.push(node);

      for (const child of childMap.get(node.id) || []) {
        dfs(child);
      }
    };

    for (const root of roots) {
      dfs(root);
    }

    return order;
  }

  private async executeNode(
    node: WorkflowNode,
    connections: WorkflowConnection[],
    context: WorkflowContext,
    step: any,
  ): Promise<NodeResult> {
    const nodeName = this.getNodeName(node);
    const inputData = this.resolveNodeInput(node, connections, context);

    this.logger.debug(`Node ${nodeName} inputData: ${JSON.stringify(inputData)}`);

    const nodeContext: WorkflowContext = {
      ...context,
      input: inputData,
      $json: inputData,
      $prev: this.getPreviousResult(node, connections, context),
    };

    const handler = this.handlers.get(node.type);

    if (handler) {
      this.logger.log(`Ejecutando nodo ${nodeName} [${node.id}] (${node.type})`);

      try {
        let result: NodeResult;
        if (node.type === WorkflowNodeType.DELAY) {
          result = await handler.execute(node, nodeContext, step);
        } else if (step?.run) {
          result = await step.run(`node-${node.id}`, async () => {
            return handler.execute(node, nodeContext, undefined);
          });
        } else {
          result = await handler.execute(node, nodeContext, undefined);
        }
        return this.normalizeResult(result, node, nodeName);
      } catch (error: any) {
        this.logger.error(`Error en nodo ${nodeName}: ${error.message}`);
        return {
          status: 'failed',
          nodeId: node.id,
          nodeName,
          type: node.type,
          data: null,
          error: error.message,
        };
      }
    }

    // NODOS SIN HANDLER (como TRIGGER o WEBHOOK raíz)
    const passData = this.resolveTriggerData(node, context, inputData);

    return {
      status: 'passed',
      nodeId: node.id,
      nodeName,
      type: node.type,
      data: passData,
    };
  }

  private resolveNodeInput(
    node: WorkflowNode,
    connections: WorkflowConnection[],
    context: WorkflowContext,
  ): any {
    const incomingConnections = connections.filter(
      (c) => c.targetNodeId === node.id,
    );

    if (incomingConnections.length > 0) {
      if (incomingConnections.length === 1) {
        const sourceResult =
          context.nodes?.[incomingConnections[0].sourceNodeId];
        return sourceResult?.data ?? {};
      }

      const aggregated: Record<string, any> = {};
      for (const conn of incomingConnections) {
        const sourceResult = context.nodes?.[conn.sourceNodeId];
        if (sourceResult) {
          if (
            sourceResult.type === WorkflowNodeType.IF &&
            conn.sourceHandle &&
            sourceResult.data?.branch !== conn.sourceHandle
          ) {
            continue;
          }
          aggregated[sourceResult.nodeName] = sourceResult.data;
        }
      }
      return aggregated;
    }

    // Fallback para Nodos Raíz (Trigger): Devolver los datos iniciales
    return context.$json || context.input || {};
  }

  private resolveTriggerData(
    node: WorkflowNode,
    context: WorkflowContext,
    inputData: any,
  ): any {
    if (node.type === WorkflowNodeType.WEBHOOK) {
      if (context.webhook && typeof context.webhook === 'object') {
        return {
          body: context.webhook.body || {},
          headers: context.webhook.headers || {},
          query: context.webhook.query || {},
        };
      }
      if (context.webhookPayload) return { body: context.webhookPayload };
    }

    // Para un TRIGGER, queremos que los datos finales sean el payload real.
    // Combinamos inputData y $json para máxima seguridad.
    const finalData = {
      ...(typeof context.$json === 'object' ? context.$json : {}),
      ...(typeof inputData === 'object' ? inputData : {}),
    };

    return Object.keys(finalData).length > 0 ? finalData : inputData;
  }

  private getPreviousResult(
    node: WorkflowNode,
    connections: WorkflowConnection[],
    context: WorkflowContext,
  ): any {
    const incomingConnections = connections.filter(
      (c) => c.targetNodeId === node.id,
    );

    if (incomingConnections.length > 0) {
      if (incomingConnections.length === 1) {
        return context.nodes?.[incomingConnections[0].sourceNodeId] ?? null;
      }

      const aggregated: Record<string, any> = {};
      for (const conn of incomingConnections) {
        const sourceResult = context.nodes?.[conn.sourceNodeId];
        if (sourceResult) {
          aggregated[sourceResult.nodeName] = sourceResult;
        }
      }
      return aggregated;
    }

    // Fallback legacy por parentId
    if (node.parentId && context.nodes?.[node.parentId]) {
      return context.nodes[node.parentId];
    }

    return null;
  }


  /**
   * Formato estándar de salida.
   */
  private normalizeResult(
    result: any,
    node: WorkflowNode,
    nodeName: string,
  ): NodeResult {
    if (result && typeof result === 'object') {
      return {
        status: result.status || 'success',
        nodeId: node.id,
        nodeName,
        type: node.type,
        data: result.data !== undefined ? result.data : result,
        meta: result.meta,
        error: result.error,
      };
    }

    return {
      status: 'success',
      nodeId: node.id,
      nodeName,
      type: node.type,
      data: result,
    };
  }

  /**
   * Nombre normalizado para usarlo en $node.<name>
   */
  private getNodeName(node: WorkflowNode): string {
    const rawName =
      node.name ||
      node.config?.['name'] ||
      node.config?.['nombre'] ||
      node.config?.['title'] ||
      node.type;

    const normalized = String(rawName)
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');

    return normalized || node.type;
  }

  private getSafeEnv(): Record<string, string> {
    const safeKeys = ['NODE_ENV', 'APP_URL', 'FRONTEND_URL'];
    const env: Record<string, string> = {};

    for (const key of safeKeys) {
      if (process.env[key]) {
        env[key] = process.env[key]!;
      }
    }

    return env;
  }
}