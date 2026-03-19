import { Injectable, Logger } from '@nestjs/common';
import { NodeHandler, NodeResult, WorkflowContext } from '../types';
import { TemplateUtil } from '../utils/template.util';

/**
 * FormHandler: Registra campos de formulario y los pasa al contexto.
 * Arquitectura preparada para interacción humana futura:
 *   - Genera definición del formulario
 *   - Puede emitir evento para solicitar input humano
 *   - Continúa cuando llega respuesta (futuro)
 */
@Injectable()
export class FormHandler implements NodeHandler {
  private readonly logger = new Logger(FormHandler.name);

  constructor(private readonly templateUtil: TemplateUtil) { }

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
      },
      meta: { nodeType: 'form' },
    };
  }
}
