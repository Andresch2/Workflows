import { Injectable } from '@nestjs/common';
import { WorkflowContext } from '../types';

@Injectable()
export class TemplateUtil {
  private static readonly WHOLE_EXPR_REGEX = /^\{\{\s*([^{}]+?)\s*\}\}$/;
  private static readonly INLINE_EXPR_REGEX = /\{\{\s*([^{}]+?)\s*\}\}/g;

  process<T>(template: T, context: WorkflowContext): T {
    if (!template) return template;

    const cloned = JSON.parse(JSON.stringify(template));
    return this.interpolate(cloned, context);
  }

  private interpolate(value: any, context: WorkflowContext): any {
    if (typeof value === 'string') {
      const wholeMatch = value.match(TemplateUtil.WHOLE_EXPR_REGEX);

      if (wholeMatch) {
        const result = this.resolveExpression(wholeMatch[1].trim(), context);
        return result === undefined ? '' : result;
      }

      return value.replace(TemplateUtil.INLINE_EXPR_REGEX, (_m, expr) => {
        const result = this.resolveExpression(expr.trim(), context);
        if (result === undefined || result === null) return '';
        return this.stringifyValue(result);
      });
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.interpolate(item, context));
    }

    if (value && typeof value === 'object') {
      const result: any = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = this.interpolate(val, context);
      }
      return result;
    }

    return value;
  }

  public resolveExpression(expr: string, context: WorkflowContext): any {
    const path = this.normalizePath(expr);
    if (!path) return undefined;

    // Prioridad absoluta para variables de sistema
    if (path === 'executionId') return context.executionId;
    if (path === 'workflowId') return context.workflowId;
    if (path === 'initialNodeId') return context.initialNodeId;

    let result = this.getValueByPath(context, path);
    // Compatibilidad: si una expresión apunta a $json.* y no existe en el nodo previo,
    // intentamos resolverla en otros espacios conocidos del contexto.
    if (result === undefined && path.startsWith('$json.')) {
      result = this.resolveLegacyJsonPath(path, context);
    }
    if (result === undefined && !path.startsWith('$')) {
      result = this.getValueByPath(context.$json, path);
    }

    // Fallback: Try to resolve from $node (e.g., HTTP_Request_1.correo -> $node.HTTP_Request_1.data.correo)
    if (result === undefined && !path.startsWith('$') && context.$node) {
      const parts = path.split('.');
      const nodeName = parts[0];
      if (context.$node[nodeName]) {
        const restPath = parts.slice(1).join('.');
        result = restPath ? this.getValueByPath(context.$node[nodeName].data, restPath) : context.$node[nodeName].data;
      }
    }

    if (result === undefined && !path.includes('.') && !path.startsWith('$')) {
      // 1. Buscar en $globals (acumula datos de todos los FORMs ejecutados)
      if (result === undefined && context.$globals) {
        result = this.deepSearchKey(context.$globals, path);
      }
      // 2. Buscar en $json (datos del nodo padre inmediato)
      if (result === undefined) {
        result = this.deepSearchKey(context.$json, path);
      }
      // 3. Buscar en cada nodo acumulado en $node
      if (result === undefined && context.$node) {
        for (const nodeKey of Object.keys(context.$node)) {
          result = this.deepSearchKey(context.$node[nodeKey].data, path);
          if (result !== undefined) break;
        }
      }
    }

    return result;
  }

  private deepSearchKey(obj: any, keyToFind: string): any {
    if (!obj || typeof obj !== 'object') return undefined;
    if (keyToFind in obj) return obj[keyToFind];

    if (Array.isArray(obj)) {
      for (const item of obj) {
        const result = this.deepSearchKey(item, keyToFind);
        if (result !== undefined) return result;
      }
      return undefined;
    }

    for (const key of Object.keys(obj)) {
      if (obj[key] && typeof obj[key] === 'object') {
        const result = this.deepSearchKey(obj[key], keyToFind);
        if (result !== undefined) return result;
      }
    }
    return undefined;
  }

  private getValueByPath(obj: any, path: string): any {
    if (!obj) return undefined;
    return path.split('.').reduce((current, key) => {
      if (current === null || current === undefined) return undefined;
      return current[key];
    }, obj);
  }

  private resolveLegacyJsonPath(path: string, context: WorkflowContext): any {
    const relativePath = path.replace(/^\$json\./, '');
    if (!relativePath) return undefined;

    // 1) Variables globales (formularios acumulados)
    let result = this.getValueByPath(context.$globals, relativePath);
    if (result !== undefined) return result;

    // 2) Resultado del nodo previo
    result = this.getValueByPath(context.$prev?.data, relativePath);
    if (result !== undefined) return result;

    // 3) Nodos previos del workflow, incluyendo payloads anidados comunes (body/data)
    if (context.$node) {
      for (const nodeKey of Object.keys(context.$node)) {
        const nodeData = context.$node[nodeKey]?.data;
        if (!nodeData) continue;

        result = this.getValueByPath(nodeData, relativePath);
        if (result !== undefined) return result;

        result = this.getValueByPath(nodeData?.body, relativePath);
        if (result !== undefined) return result;
      }
    }

    return undefined;
  }

  private normalizePath(path: string): string {
    return path
      .replace(/\[(\d+)\]/g, '.$1')
      .replace(/['"]\s*\]/g, '')
      .replace(/\[\s*['"]/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\./, '')
      .replace(/\.$/, '');
  }

  private stringifyValue(value: any): string {
    return typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);
  }
}
