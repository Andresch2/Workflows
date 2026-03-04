export enum WorkflowNodeType {
    TRIGGER = 'TRIGGER',
    HTTP = 'HTTP',
    WEBHOOK = 'WEBHOOK',
    DATABASE = 'DATABASE',
    SET = 'SET',
    DELAY = 'DELAY',
    NOTIFICATION = 'NOTIFICATION',
    FORM = 'FORM',
}

export interface Workflow {
    id: string;
    title: string;
    description?: string | null;
    triggerType: 'webhook' | 'http';
    user?: any;
    createdAt: string;
    updatedAt: string;
}

export interface WorkflowNode {
    id: string;
    type: WorkflowNodeType;
    config?: Record<string, any> | null;
    x: number;
    y: number;
    workflowId: string;
    parentId?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateWorkflowDto {
    title: string;
    description?: string | null;
    triggerType: 'webhook' | 'http';
    projectId?: string;
}

export interface UpdateWorkflowDto {
    title?: string;
    description?: string | null;
    triggerType?: 'webhook' | 'http';
}

export interface CreateWorkflowNodeDto {
    type: WorkflowNodeType;
    config?: Record<string, any> | null;
    x: number;
    y: number;
    workflowId: string;
    parentId?: string | null;
}

export interface UpdateWorkflowNodeDto {
    type?: WorkflowNodeType;
    config?: Record<string, any> | null;
    x?: number;
    y?: number;
    parentId?: string | null;
}

/** Nodo extendido con datos del editor */
export interface EditorNode extends WorkflowNode {
    selected?: boolean;
    active?: boolean;
}
