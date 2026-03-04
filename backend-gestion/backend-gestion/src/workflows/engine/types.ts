export interface WorkflowContext {
  workflowId: string;
  [key: string]: any; //Datos compartidos entre nodos durante ejecucion
}

export interface NodeHandler {
  execute(node: any, context: WorkflowContext, step: any): Promise<any>;
}
