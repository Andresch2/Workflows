/**
 * Resultado estándar de ejecución de un nodo.
 * Todos los handlers deben devolver esta estructura.
 */
export interface NodeResult {
  status: 'success' | 'failed' | 'skipped' | 'warning' | 'passed';
  nodeId: string;
  nodeName: string;
  type: string;
  data: any;
  meta?: Record<string, any>;
  error?: string;
}

/**
 * Contexto de ejecución del workflow.
 * Disponible para todos los handlers y el template engine.
 */
export interface WorkflowContext {
  workflowId: string;
  /** Datos de entrada global al workflow */
  input?: any;
  /** Shortcut: datos del nodo padre inmediato */
  $json?: any;
  /** Resultado del nodo padre inmediato */
  $prev?: any;
  /** Mapa de resultados por nombre de nodo: $node.<name>.data */
  $node?: Record<string, NodeResult>;
  /** Variables globales del workflow */
  $globals?: Record<string, any>;
  /** Variables de entorno (process.env filtradas) */
  $env?: Record<string, string>;
  /** Mapa interno de resultados por ID de nodo */
  nodes?: Record<string, NodeResult>;
  /** Datos adicionales (webhook payload, etc.) */
  [key: string]: any;
}

/**
 * Interfaz que deben implementar todos los handlers de nodo.
 */
export interface NodeHandler {
  execute(node: any, context: WorkflowContext, step: any): Promise<NodeResult>;
}
