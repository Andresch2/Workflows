import { WorkflowEngineService } from '../workflows/engine/workflow-engine.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { inngest } from './client';

interface InngestDeps {
  workflowsService: WorkflowsService;
  workflowEngineService: WorkflowEngineService;
}

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

  // 2. Webhook recibido y ejecuta workflow
  const onWebhookReceived = inngest.createFunction(
    { id: 'on-webhook-received' },
    { event: 'webhook.received' },
    async ({ event, step }) => {
      const { workflowId, payload, headers, query } = event.data;
      const webhookData = {
        body: payload || {},
        headers: headers || {},
        query: query || {},
      };

      return workflowEngineService.executeWorkflow(workflowId, step, {
        webhookPayload: webhookData.body,
        webhook: webhookData,
        $json: webhookData.body,
      });
    },
  );

  // 3. HTTP trigger busca workflows de tipo HTTP y los ejecuta
  const onHttpTriggered = inngest.createFunction(
    { id: 'on-http-triggered' },
    { event: 'http.triggered' },
    async ({ event, step }) => {
      const { workflowId, ...payload } = event.data;

      if (workflowId) {
        return workflowEngineService.executeWorkflow(workflowId, step, payload);
      }

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

  // Ejecutar todos los workflows de un evento de dominio
  async function executeEventWorkflows(
    eventName: string,
    eventData: Record<string, any>,
    step: any,
  ) {
    const workflows = await step.run(`find-${eventName}-workflows`, async () => {
      return workflowsService.findByEventName(eventName);
    });

    if (!workflows.length) {
      return { status: 'no_workflows', eventName, message: 'No workflows configured for this event' };
    }

    const results: any[] = [];
    for (const wf of workflows) {
      const result = await workflowEngineService.executeWorkflow(
        wf.id,
        step,
        { ...eventData, $json: eventData },
      );
      results.push({ workflowId: wf.id, result });
    }

    return {
      status: 'completed',
      eventName,
      workflowsExecuted: results.length,
      results,
    };
  }

  // 4. Task creado ejecuta workflows con eventName='task.created'
  const onTaskCreated = inngest.createFunction(
    { id: 'on-task-created' },
    { event: 'task.created' },
    async ({ event, step }) => {
      return executeEventWorkflows('task.created', event.data, step);
    },
  );

  // 5. Task completado ejecuta workflows con eventName='task.completed'
  const onTaskCompleted = inngest.createFunction(
    { id: 'on-task-completed' },
    { event: 'task.completed' },
    async ({ event, step }) => {
      return executeEventWorkflows('task.completed', event.data, step);
    },
  );

  // 6. Proyecto creado ejecuta workflows con eventName='project.created'
  const onProjectCreated = inngest.createFunction(
    { id: 'on-project-created' },
    { event: 'project.created' },
    async ({ event, step }) => {
      return executeEventWorkflows('project.created', event.data, step);
    },
  );

  // 7. Proyecto actualizado ejecuta workflows con eventName='project.updated'
  const onProjectUpdated = inngest.createFunction(
    { id: 'on-project-updated' },
    { event: 'project.updated' },
    async ({ event, step }) => {
      return executeEventWorkflows('project.updated', event.data, step);
    },
  );

  return [
    executeWorkflow,
    onWebhookReceived,
    onHttpTriggered,
    onTaskCreated,
    onTaskCompleted,
    onProjectCreated,
    onProjectUpdated,
  ];
}
