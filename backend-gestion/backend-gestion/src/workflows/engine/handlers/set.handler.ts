import { Injectable, Logger } from '@nestjs/common';
import { NodeHandler, WorkflowContext } from '../types';
import { TemplateUtil } from '../utils/template.util';

/**
 * SetHandler: Asigna propiedades tomando data del ecosistema/memoria global
 * de la ejecución y usando templates para resolver un nuevo modelo de datos (JSON)
 */
@Injectable()
export class SetHandler implements NodeHandler {
  private readonly logger = new Logger(SetHandler.name);

  constructor(private readonly templateUtil: TemplateUtil) {}

  async execute(node: any, context: WorkflowContext, _step: any): Promise<any> {
    const config = node.config || {};
    const nombre = config.nombre || 'Set Variable';

    // config.fields contiene la estructura que el usuario determinó.
    // Ej: { variableMia: '{{ nodes.52.data.id }}', otra: 'estatica' }
    const fieldsToSet = config.fields || {};

    this.logger.log(`SetHandler: resolviendo variables en nodo ${node.id}`);

    try {
      // Resolvemos el template usando el context que ahora tiene `context.nodes`
      const resolvedData = this.templateUtil.process(fieldsToSet, context);

      return {
        status: 'success',
        nombre,
        data: resolvedData,
      };
    } catch (error: any) {
      this.logger.error(
        `Error en SetHandler en el nodo ${node.id}: ${error.message}`,
      );
      return {
        status: 'error',
        nombre,
        message: error.message,
      };
    }
  }
}
