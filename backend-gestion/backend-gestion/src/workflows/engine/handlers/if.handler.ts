import { Injectable, Logger } from '@nestjs/common';
import { WorkflowNode } from '../../domain/workflow-node';
import { NodeHandler, NodeResult, WorkflowContext } from '../types';
import { TemplateUtil } from '../utils/template.util';

@Injectable()
export class IfHandler implements NodeHandler {
  private readonly logger = new Logger(IfHandler.name);

  constructor(private readonly templateUtil: TemplateUtil) { }

  async execute(
    node: WorkflowNode,
    context: WorkflowContext,
    step: any,
  ): Promise<NodeResult> {
    const config = this.templateUtil.process(node.config || {}, context);
    const conditions = config.conditions || [];

    if (!conditions.length) {
      this.logger.warn(
        `Nodo IF [${node.id}] no tiene condiciones configuradas, evaluado como falso por defecto`,
      );
      return {
        status: 'success',
        nodeId: node.id,
        nodeName: node.name || 'IF',
        type: node.type,
        data: {
          result: false,
          branch: 'false',
        },
      };
    }

    let finalResult = true;

    for (const [idx, cond] of conditions.entries()) {
      if (!cond || !cond.operation) continue;

      const val1 = cond.value1;
      const val2 = this.isUnary(cond.operation) ? null : cond.value2;

      const condResult = this.evaluateCondition(val1, cond.operation, val2);
      this.logger.warn(`[IF DEBUG] Cond ${idx}: VAL1="${val1}" (${typeof val1}) | OP="${cond.operation}" | RESULT=${condResult}`);

      if (!condResult) {
        finalResult = false;
        break;
      }
    }

    return {
      status: 'success',
      nodeId: node.id,
      nodeName: node.name || 'IF',
      type: node.type,
      data: {
        result: finalResult,
        branch: finalResult ? 'true' : 'false',
      },
      meta: {
        evaluatedConditions: conditions.length,
      },
    };
  }

  private isUnary(operation: string): boolean {
    return ['booleanTrue', 'booleanFalse', 'isEmpty', 'isNotEmpty'].includes(operation);
  }

  private evaluateCondition(val1: any, operation: string, val2: any): boolean {
    const s1 = (val1 === null || val1 === undefined ? '' : String(val1)).trim();
    const s2 = (val2 === null || val2 === undefined ? '' : String(val2)).trim();

    switch (operation) {
      case 'stringEquals':
        return s1 === s2;
      case 'stringNotEquals':
        return s1 !== s2;
      case 'stringContains':
        return s1.includes(s2);
      case 'numberEquals':
        return Number(val1) === Number(val2);
      case 'numberGreaterThan':
        return Number(val1) > Number(val2);
      case 'numberLessThan':
        return Number(val1) < Number(val2);
      case 'booleanTrue':
        return val1 === true || s1.toLowerCase() === 'true';
      case 'booleanFalse':
        return val1 === false || s1.toLowerCase() === 'false';
      case 'isEmpty':
        return !val1 || s1 === '' || (Array.isArray(val1) && val1.length === 0);
      case 'isNotEmpty':
        return !!val1 && s1 !== '' && (!Array.isArray(val1) || val1.length > 0);
      default:
        return false;
    }
  }
}
