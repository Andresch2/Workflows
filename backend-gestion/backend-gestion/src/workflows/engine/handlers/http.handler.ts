import { Injectable, Logger } from '@nestjs/common';
import { NodeHandler, WorkflowContext } from '../types';
import { TemplateUtil } from '../utils/template.util';

/**
 * HttpHandler: Realiza peticiones HTTP externas (GET/POST).
 */
@Injectable()
export class HttpHandler implements NodeHandler {
  private readonly logger = new Logger(HttpHandler.name);

  constructor(private readonly templateUtil: TemplateUtil) {}

  async execute(node: any, context: WorkflowContext, _step: any): Promise<any> {
    // Procesar la configuración con el motor de plantillas
    const config = this.templateUtil.process(node.config || {}, context);

    const url = config.url;
    const method = (config.method || 'POST').toUpperCase();
    const headers = config.headers || { 'Content-Type': 'application/json' };
    const body = config.body || {};

    if (!url) {
      this.logger.warn(`HttpHandler: nodo ${node.id} sin URL configurada`);
      return { status: 'skipped', reason: 'No URL' };
    }

    this.logger.log(`HttpHandler: ${method} ${url}`);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body:
          method !== 'GET'
            ? typeof body === 'string'
              ? body
              : JSON.stringify(body)
            : undefined,
      });

      const data = await response.text();
      return { status: 'success', statusCode: response.status, data };
    } catch (error) {
      this.logger.error(`HttpHandler error: ${error.message}`);
      return { status: 'failed', error: error.message };
    }
  }
}
