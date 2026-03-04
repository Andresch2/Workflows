import { WorkflowEngineService } from '../workflows/engine/workflow-engine.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { inngest } from './client';

interface InngestDeps {
  workflowsService: WorkflowsService;
  workflowEngineService: WorkflowEngineService;
}

/**
 * Funciones:
 *   1. workflow/execute — Ejecuta un workflow por ID
 *   2. webhook.received — Disparado cuando se recibe un webhook
 *   3. http.triggered   — Disparado para workflows de tipo HTTP
 */
export function getInngestFunctions(deps: InngestDeps) {
  const { workflowsService, workflowEngineService } = deps;

  // 1. Ejecución genérica de workflow
  const executeWorkflow = inngest.createFunction(
    { id: 'execute-workflow' },
    { event: 'workflow/execute' },
    async ({ event, step }) => {
      const { workflowId, ...payload } = event.data;

      const workflow = await step.run('load-workflow', async () => {
        return workflowsService.findById(workflowId);
      });

      if (!workflow) {
        return {
          status: 'error',
          message: `Workflow ${workflowId} no encontrado`,
        };
      }

      return workflowEngineService.executeWorkflow(workflowId, step, payload);
    },
  );

  // 2. Webhook recibido → ejecuta workflow
  const onWebhookReceived = inngest.createFunction(
    { id: 'on-webhook-received' },
    { event: 'webhook.received' },
    async ({ event, step }) => {
      const { workflowId, payload } = event.data;

      return workflowEngineService.executeWorkflow(workflowId, step, {
        webhookPayload: payload,
      });
    },
  );

  // 3. HTTP trigger → busca workflows de tipo HTTP y los ejecuta
  const onHttpTriggered = inngest.createFunction(
    { id: 'on-http-triggered' },
    { event: 'http.triggered' },
    async ({ event, step }) => {
      const { workflowId, ...payload } = event.data;

      if (workflowId) {
        return workflowEngineService.executeWorkflow(workflowId, step, payload);
      }

      // Buscar workflows con triggerType 'http'
      const workflows = await step.run('find-http-workflows', async () => {
        return workflowsService.findByTriggerType('http');
      });

      const results: any[] = [];
      for (const wf of workflows) {
        const result = await workflowEngineService.executeWorkflow(
          wf.id,
          step,
          payload,
        );
        results.push({ workflowId: wf.id, result });
      }

      return {
        status: 'completed',
        workflowsExecuted: results.length,
        results,
      };
    },
  );

  // 4. Task creado automáticamente (Demostración de auto-trigger)
  const onTaskCreated = inngest.createFunction(
    { id: 'on-task-created' },
    { event: 'task.created' },
    async ({ event, step }) => {
      const { taskId, title } = event.data;

      await step.run('log-task-info', async () => {
        console.log(
          `¡Inngest detectó una nueva tarea automáticamente!: ${title} (ID: ${taskId})`,
        );
        return { message: 'Auto-trigger detectado correctamente' };
      });

      return { processed: true, taskId };
    },
  );

  return [executeWorkflow, onWebhookReceived, onHttpTriggered, onTaskCreated];
}
