import { Injectable, Logger } from '@nestjs/common';
import { NodeHandler, WorkflowContext } from '../types';
import { TemplateUtil } from '../utils/template.util';

/**
 * DelayHandler: Espera un tiempo configurable antes de continuar.
 * Usa step.sleep() de Inngest para esperas durables.
 * Si no hay step disponible (ejecución local), usa setTimeout.
 */
@Injectable()
export class DelayHandler implements NodeHandler {
  private readonly logger = new Logger(DelayHandler.name);
  constructor(private readonly templateUtil: TemplateUtil) {}

  async execute(node: any, context: WorkflowContext, step: any): Promise<any> {
    const config = this.templateUtil.process(node.config || {}, context);
    const duration = Number(config.duration || 1);
    const unit = config.unit || 'seconds';

    // Convertir a formato Inngest sleep
    const sleepDuration = `${duration}${unit.charAt(0)}`; // "5s", "2m", "1h", "1d"

    this.logger.log(
      `DelayHandler: esperando ${duration} ${unit} en nodo ${node.id}`,
    );

    if (step?.sleep) {
      // Ejecución con Inngest: espera durable
      await step.sleep(`delay-${node.id}`, sleepDuration);
    } else {
      // Ejecución local/simulación: espera con setTimeout
      const ms = this.toMilliseconds(duration, unit);
      await new Promise((resolve) => setTimeout(resolve, ms));
    }

    return { status: 'success', waited: `${duration} ${unit}` };
  }

  private toMilliseconds(duration: number, unit: string): number {
    switch (unit) {
      case 'seconds':
        return duration * 1000;
      case 'minutes':
        return duration * 60 * 1000;
      case 'hours':
        return duration * 60 * 60 * 1000;
      case 'days':
        return duration * 24 * 60 * 60 * 1000;
      default:
        return duration * 1000;
    }
  }
}
