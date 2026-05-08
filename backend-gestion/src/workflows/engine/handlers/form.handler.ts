import { Injectable, Logger } from '@nestjs/common';
import { PendingFormStore } from '../pending-form.store';
import { NodeHandler, NodeResult, WorkflowContext } from '../types';
import { TemplateUtil } from '../utils/template.util';

/**
 * FormHandler: Registra campos de formulario y los pasa al contexto.
 */
@Injectable()
export class FormHandler implements NodeHandler {
  private readonly logger = new Logger(FormHandler.name);

  constructor(
    private readonly templateUtil: TemplateUtil,
    private readonly pendingFormStore: PendingFormStore,
  ) { }

  async execute(
    node: any,
    context: WorkflowContext,
    _step: any,
  ): Promise<NodeResult> {
    const config = this.templateUtil.process(node.config || {}, context);
    const title = config.title || 'Formulario';
    const description = config.description || '';
    const successMsg = config.successMsg || '¡Gracias por enviar el formulario!';
    const fields: Array<{ name: string; type: string; required: boolean }> =
      config.fields || [];

    this.logger.log(
      `FormHandler: "${title}" con ${fields.length} campo(s) en nodo ${node.id}`,
    );

    if (!fields.length) {
      return {
        status: 'warning',
        nodeId: node.id,
        nodeName: node.name || node.type,
        type: node.type,
        data: { title, description, successMsg, fields: [], message: 'No hay campos definidos' },
      };
    }

    const formSchema = fields.map((field) => ({
      name: field.name || 'campo_sin_nombre',
      type: field.type || 'text',
      required: field.required ?? false,
    }));

    // Detección de Trigger: solo si el workflowId inicial apunta a este nodo.
    const isTrigger = context.initialNodeId === node.id;

    if (isTrigger && (context.$json || context.input)) {
      const triggerData = {
        ...(context.$json || context.input || {}),
        executionId: context.executionId,
      };
      this.logger.log(
        `FormHandler: Trigger inicial (nodo ${node.id}). Datos propagados: ${JSON.stringify(Object.keys(triggerData))}`,
      );
      return {
        status: 'success',
        nodeId: node.id,
        nodeName: node.name || node.type,
        type: node.type,
        data: triggerData,
      };
    }

    if (_step) {
      // Evento de reanudacion.
      const eventName = 'workflow.form_step_completed';

      this.logger.log(
        `FormHandler: Pausando ejecución en nodo ${node.id} esperando "${eventName}" con nodeId="${node.id}" workflowId="${context.workflowId}" (execId: ${context.executionId})...`,
      );

      // Registrar formulario pendiente para auto-resolución de executionId
      this.pendingFormStore.register(node.id, context.executionId, context.workflowId);

      try {
        const resp = await _step.waitForEvent(`wait-form-${node.id}`, {
          event: eventName,
          if: `async.data.nodeId == '${node.id}' && async.data.workflowId == '${context.workflowId}'`,
          timeout: '24h',
        });

        if (!resp) {
          this.logger.warn(`FormHandler: Timeout esperando formulario en nodo ${node.id}`);
          return {
            status: 'warning',
            nodeId: node.id,
            nodeName: node.name || node.type,
            type: node.type,
            data: { message: 'Timeout esperando respuesta del formulario' },
          };
        }

        const formData = resp.data.payload ?? resp.data;
        this.logger.log(
          `FormHandler: Datos recibidos para nodo ${node.id}: ${JSON.stringify(Object.keys(formData ?? {}))}`,
        );
        this.logger.log(
          `FormHandler: Estado acumulado en $node: ${JSON.stringify(Object.keys(context.$node ?? {}))}`,
        );
        return {
          status: 'success',
          nodeId: node.id,
          nodeName: node.name || node.type,
          type: node.type,
          data: formData,
        };
      } finally {
        // Limpiar el registro pendiente una vez que se reanude o falle
        this.pendingFormStore.remove(node.id);
      }
    }

    // Fallback: Si no hay step o no es trigger, devolvemos esquema
    return {
      status: 'success',
      nodeId: node.id,
      nodeName: node.name || node.type,
      type: node.type,
      data: {
        title,
        description,
        successMsg,
        fields: formSchema,
        fieldCount: formSchema.length,
        requiredFields: formSchema.filter((f) => f.required).map((f) => f.name),
        executionId: context.executionId,
      },
      meta: { nodeType: 'form' },
    };
  }
}
