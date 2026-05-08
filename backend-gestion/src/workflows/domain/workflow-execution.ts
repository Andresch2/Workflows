import { Workflow } from './workflow';

export class WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  triggerType: string;
  payload: Record<string, any>;
  results: Record<string, any>;
  error?: string | null;
  startedAt: Date;
  finishedAt?: Date | null;
  workflow?: Workflow;
}
