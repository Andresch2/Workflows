import { Injectable, Logger } from '@nestjs/common';
import { NodeHandler, NodeResult, WorkflowContext } from '../types';
import { TemplateUtil } from '../utils/template.util';

@Injectable()
export class DelayHandler implements NodeHandler {
  private readonly logger = new Logger(DelayHandler.name);
  constructor(private readonly templateUtil: TemplateUtil) { }

  async execute(node: any, context: WorkflowContext, step: any): Promise<NodeResult> {
    const config = this.templateUtil.process(node.config || {}, context);
    const resumeMode = config.resumeMode || 'interval';
    
    let sleepDuration = '1s';
    let waitsText = '';

    if (resumeMode === 'date' && config.dateTime) {
      const targetDate = new Date(config.dateTime);
      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();
      
      if (diffMs > 0) {
        const seconds = Math.ceil(diffMs / 1000);
        sleepDuration = `${seconds}s`;
        waitsText = `hasta ${targetDate.toISOString()}`;
      } else {
        sleepDuration = '0s'; // Continue immediately
        waitsText = `inmediato (fecha pasada: ${targetDate.toISOString()})`;
      }
    } else {
      // Interval mode (default)
      const duration = Number(config.duration || 1);
      const unit = config.unit || 'seconds';
      sleepDuration = `${duration}${unit.charAt(0)}`;
      waitsText = `por ${duration} ${unit}`;
    }

    this.logger.log(`DelayHandler: esperando ${waitsText} en nodo ${node.id}`);

    if (step?.sleep && sleepDuration !== '0s') {
      await step.sleep(`delay-${node.id}`, sleepDuration);
    } else if (sleepDuration !== '0s') {
      const ms = this.parseDurationToMs(sleepDuration);
      await new Promise((resolve) => setTimeout(resolve, ms));
    }

    return {
      status: 'success',
      nodeId: node.id,
      nodeName: node.name || node.type,
      type: node.type,
      data: { waited: waitsText },
    };
  }

  private parseDurationToMs(durationStr: string): number {
    const value = parseInt(durationStr.slice(0, -1));
    const unit = durationStr.slice(-1);
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return value * 1000;
    }
  }
}
