import { Injectable, Logger } from '@nestjs/common';
import { NodeHandler, NodeResult, WorkflowContext } from '../types';
import { TemplateUtil } from '../utils/template.util';

/**
 * NotificationHandler: Envía notificaciones vía HTTP POST.
 */
@Injectable()
export class NotificationHandler implements NodeHandler {
  private readonly logger = new Logger(NotificationHandler.name);

  constructor(private readonly templateUtil: TemplateUtil) { }

  async execute(node: any, context: WorkflowContext, _step: any): Promise<NodeResult> {
    const config = this.templateUtil.process(node.config || {}, context);
    const message = config.message || 'Sin mensaje';
    const recipient = config.recipient || 'Sin destinatario';
    const url = config.url || '';

    this.logger.log(`[Notificación] Para: ${recipient} - Mensaje: "${message}"`);

    if (url) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient,
            message,
            timestamp: new Date().toISOString(),
            source: 'workflow-notification',
          }),
        });

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }

        return {
          status: 'success',
          nodeId: node.id,
          nodeName: node.name || node.type,
          type: node.type,
          data: { sent: true, statusCode: response.status, recipient, message, response: data },
          meta: { url, timestamp: new Date().toISOString() },
        };
      } catch (error: any) {
        this.logger.error(`NotificationHandler error: ${error.message}`);
        return {
          status: 'failed',
          nodeId: node.id,
          nodeName: node.name || node.type,
          type: node.type,
          data: { recipient, message },
          error: error.message,
        };
      }
    }

    return {
      status: 'success',
      nodeId: node.id,
      nodeName: node.name || node.type,
      type: node.type,
      data: { sent: false, recipient, message, timestamp: new Date().toISOString() },
      meta: { note: 'No URL configured — notification logged only' },
    };
  }
}
