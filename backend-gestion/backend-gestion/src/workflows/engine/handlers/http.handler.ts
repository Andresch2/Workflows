import { Injectable, Logger } from '@nestjs/common';
import { NodeHandler, WorkflowContext } from '../types';
import { TemplateUtil } from '../utils/template.util';

@Injectable()
export class HttpHandler implements NodeHandler {
  private readonly logger = new Logger(HttpHandler.name);

  constructor(private readonly templateUtil: TemplateUtil) {}

  async execute(node: any, context: WorkflowContext, _step: any): Promise<any> {
    const config = this.templateUtil.process(node.config || {}, context);

    const url = config.url;
    const method = (config.method || 'POST').toUpperCase();
    const headers =
      this.parseJsonIfPossible(config.headersRaw ?? config.headers) || {
        'Content-Type': 'application/json',
      };
    const body = this.parseJsonIfPossible(config.bodyRaw ?? config.body) || {};

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

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
      return { status: 'success', statusCode: response.status, data };
    } catch (error: any) {
      this.logger.error(`HttpHandler error: ${error.message}`);
      return { status: 'failed', error: error.message };
    }
  }

  private parseJsonIfPossible(value: any): any {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
