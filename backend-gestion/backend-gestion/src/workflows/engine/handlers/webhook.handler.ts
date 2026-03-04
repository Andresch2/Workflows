import { Injectable, Logger } from '@nestjs/common';
import { NodeHandler, WorkflowContext } from '../types';
import { TemplateUtil } from '../utils/template.util';

/**
 * WebhookHandler: Envía un POST a la URL configurada como webhook.
 * Soporta interpolación de templates {{ nodes.ID.data.campo }}.
 */
@Injectable()
export class WebhookHandler implements NodeHandler {
  private readonly logger = new Logger(WebhookHandler.name);

  constructor(private readonly templateUtil: TemplateUtil) { }

  async execute(node: any, context: WorkflowContext, _step: any): Promise<any> {
    // Procesar la configuración con el motor de plantillas
    const config = this.templateUtil.process(node.config || {}, context);
    const url = config.url;
    const headers = config.headers || { 'Content-Type': 'application/json' };
    const payload = config.payload || context;

    if (!url) {
      this.logger.warn(`WebhookHandler: nodo ${node.id} sin URL configurada`);
      return { status: 'skipped', reason: 'No URL' };
    }

    this.logger.log(`WebhookHandler: POST ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.text();
      return { status: 'success', statusCode: response.status, data };
    } catch (error) {
      this.logger.error(`WebhookHandler error: ${error.message}`);
      return { status: 'failed', error: error.message };
    }
  }
}
