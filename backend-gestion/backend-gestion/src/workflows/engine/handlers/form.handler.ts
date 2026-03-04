import { Injectable, Logger } from '@nestjs/common';
import { NodeHandler, WorkflowContext } from '../types';
import { TemplateUtil } from '../utils/template.util';

/**
 * FormHandler: Registra campos de formulario y los pasa al contexto.
 * Tipos de campo soportados: text, email, number, date, textarea
 * Soporta interpolación de templates {{ nodes.ID.data.campo }}.
 */
@Injectable()
export class FormHandler implements NodeHandler {
  private readonly logger = new Logger(FormHandler.name);

  constructor(private readonly templateUtil: TemplateUtil) { }

  async execute(
    node: any,
    context: WorkflowContext,
    _step: any,
  ): Promise<any> {
    // Procesar la configuración con el motor de plantillas
    const config = this.templateUtil.process(node.config || {}, context);
    const title = config.title || 'Formulario';
    const fields: Array<{ name: string; type: string; required: boolean }> =
      config.fields || [];

    this.logger.log(
      `FormHandler: procesando formulario "${title}" con ${fields.length} campo(s) en nodo ${node.id}`,
    );

    // Validar que hay campos definidos
    if (!fields.length) {
      this.logger.warn(
        `FormHandler: formulario "${title}" no tiene campos definidos`,
      );
      return {
        status: 'warning',
        nodeType: 'form',
        title,
        message: 'No hay campos definidos en el formulario',
        fields: [],
      };
    }

    // Construir esquema del formulario
    const formSchema = fields.map((field) => ({
      name: field.name || 'campo_sin_nombre',
      type: field.type || 'text',
      required: field.required ?? false,
    }));

    this.logger.log(
      `FormHandler: formulario "${title}" registrado exitosamente — campos: ${formSchema.map((f) => f.name).join(', ')}`,
    );

    return {
      status: 'success',
      nodeType: 'form',
      title,
      fields: formSchema,
      fieldCount: formSchema.length,
      requiredFields: formSchema.filter((f) => f.required).map((f) => f.name),
    };
  }
}
