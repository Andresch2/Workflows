export interface WorkflowContext {
  workflowId: string;
  env?: Record<string, any>;
  globals?: Record<string, any>;
  input?: any;
  $json?: any; // Alias n8n-like del input actual
  $prev?: any; // Resultado del nodo padre inmediato
  $globals?: Record<string, any>; // Alias n8n-like de globals
  $env?: Record<string, any>; // Alias n8n-like de env
  $node?: Record<string, any>; // Alias n8n-like del mapa de nodos ejecutados
  [key: string]: any; //Datos compartidos entre nodos durante ejecucion
}

export interface NodeHandler {
  execute(node: any, context: WorkflowContext, step: any): Promise<any>;
}
