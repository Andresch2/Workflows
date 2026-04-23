export enum WorkflowNodeType {
    TRIGGER = 'TRIGGER',
    HTTP = 'HTTP',
    WEBHOOK = 'WEBHOOK',
    DATABASE = 'DATABASE',
    DELAY = 'DELAY',
    NOTIFICATION = 'NOTIFICATION',
    FORM = 'FORM',
    IF = 'IF',
    CODE = 'CODE',
}

export type WorkflowTriggerType = 'webhook' | 'http' | 'event';

export type JsonLike =
    | string
    | number
    | boolean
    | null
    | JsonLike[]
    | { [key: string]: JsonLike };

export interface Workflow {
    id: string;
    title: string;
    description?: string | null;
    triggerType: WorkflowTriggerType;
    eventName?: string | null;
    user?: any;
    project?: any;
    createdAt: string;
    updatedAt: string;
}

export interface WorkflowNode {
    id: string;
    type: WorkflowNodeType;
    name?: string | null;
    config?: Record<string, any> | null;
    dataSchema?: Record<string, any> | JsonLike[] | null;
    x: number;
    y: number;
    workflowId: string;
    parentId?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface WorkflowConnection {
    id: string;
    workflowId: string;
    sourceNodeId: string;
    targetNodeId: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateWorkflowDto {
    title: string;
    description?: string | null;
    triggerType: WorkflowTriggerType;
    eventName?: string | null;
    projectId?: string | null;
}

export interface UpdateWorkflowDto {
    title?: string;
    description?: string | null;
    triggerType?: WorkflowTriggerType;
    eventName?: string | null;
    projectId?: string | null;
}

export interface CreateWorkflowNodeDto {
    type: WorkflowNodeType;
    name?: string | null;
    config?: Record<string, any> | null;
    dataSchema?: Record<string, any> | JsonLike[] | null;
    x: number;
    y: number;
    workflowId: string;
    parentId?: string | null;
}

export interface UpdateWorkflowNodeDto {
    type?: WorkflowNodeType;
    name?: string | null;
    config?: Record<string, any> | null;
    dataSchema?: Record<string, any> | JsonLike[] | null;
    x?: number;
    y?: number;
    parentId?: string | null;
}

export interface CreateWorkflowConnectionDto {
    workflowId: string;
    sourceNodeId: string;
    targetNodeId: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
}

export type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'error';

export interface EditorNode extends WorkflowNode {
    selected?: boolean;
    active?: boolean;
    executionStatus?: NodeExecutionStatus;
    errorMessage?: string;
}

export interface EditorConnection extends WorkflowConnection {
    selected?: boolean;
}
