import { Injectable, Logger } from '@nestjs/common';
import * as vm from 'node:vm';
import { WorkflowNode } from '../../domain/workflow-node';
import { NodeHandler, NodeResult, WorkflowContext } from '../types';

@Injectable()
export class CodeHandler implements NodeHandler {
  private readonly logger = new Logger(CodeHandler.name);

  async execute(
    node: WorkflowNode,
    context: WorkflowContext,
    _step: any,
  ): Promise<NodeResult> {
    const rawCode = node.config?.['code'] ?? node.config?.['script'] ?? '';
    const code = typeof rawCode === 'string' ? rawCode.trim() : '';

    if (!code) {
      return {
        status: 'warning',
        nodeId: node.id,
        nodeName: node.name || 'CODE',
        type: node.type,
        data: context.$json ?? {},
        error: 'No se configuró código JavaScript en el nodo CODE',
      };
    }

    const input = context.$json ?? context.input ?? {};
    const logBuffer: string[] = [];

    const sandbox: Record<string, any> = {
      input,
      $json: input,
      $prev: context.$prev ?? null,
      $node: context.$node ?? {},
      $globals: context.$globals ?? {},
      $env: context.$env ?? {},
      output: input,
      console: {
        log: (...args: any[]) => {
          const line = args
            .map((arg) =>
              typeof arg === 'string' ? arg : JSON.stringify(arg),
            )
            .join(' ');
          logBuffer.push(line);
        },
      },
    };

    try {
      const script = new vm.Script(
        `(function () { ${code}\n })()`,
        { filename: `workflow-code-${node.id}.js` },
      );

      const returned = script.runInNewContext(sandbox, { timeout: 1000 });
      const data =
        returned !== undefined ? returned : sandbox.output !== undefined ? sandbox.output : input;

      return {
        status: 'success',
        nodeId: node.id,
        nodeName: node.name || 'CODE',
        type: node.type,
        data,
        meta: {
          logs: logBuffer,
        },
      };
    } catch (error: any) {
      this.logger.error(`CodeHandler error en nodo ${node.id}: ${error.message}`);
      return {
        status: 'failed',
        nodeId: node.id,
        nodeName: node.name || 'CODE',
        type: node.type,
        data: null,
        error: error.message,
      };
    }
  }
}
