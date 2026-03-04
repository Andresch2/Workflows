import { Injectable, Logger } from '@nestjs/common';
import { NodeHandler, WorkflowContext } from '../types';
import { TemplateUtil } from '../utils/template.util';

/**
 * NotificationHandler: Envía notificaciones vía HTTP POST.
 *
 * Si tiene una URL configurada, envía un POST con el mensaje y destinatario.
 * Esto permite integrar con Slack webhooks, Discord webhooks, o cualquier
 * servicio que reciba notificaciones vía HTTP.
 *
 * Sin URL, solo registra la notificación en el log del servidor.
 */
@Injectable()
export class NotificationHandler implements NodeHandler {
  private readonly logger = new Logger(NotificationHandler.name);

  constructor(private readonly templateUtil: TemplateUtil) { }

  async execute(node: any, context: WorkflowContext, _step: any): Promise<any> {
    // Procesar la configuración con el motor de plantillas
    const config = this.templateUtil.process(node.config || {}, context);
    const message = config.message || 'Sin mensaje';
    const recipient = config.recipient || 'Sin destinatario';
    const url = config.url || '';

    this.logger.log(
      `[Notificación] Para: ${recipient} - Mensaje: "${message}"`,
    );

    // Si hay URL configurada, enviar como POST
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

        const data = await response.text();
        return {
          status: 'sent',
          statusCode: response.status,
          recipient,
          message,
          data,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        this.logger.error(`NotificationHandler error: ${error.message}`);
        return {
          status: 'failed',
          recipient,
          message,
          error: error.message,
        };
      }
    }

    // Sin URL: solo registrar en log
    return {
      status: 'logged',
      recipient,
      message,
      timestamp: new Date().toISOString(),
      note: 'No URL configured. Add a webhook URL (Slack, Discord, etc.) to send real notifications.',
    };
  }
}
