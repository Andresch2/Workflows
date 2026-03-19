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

    let result = this.getValueByPath(context, path);
    
    // Fallback: If not found and doesn't start with $, try to resolve from $json
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

    // NEW Fallback: Deep search by key if the path is a single word
    if (result === undefined && !path.includes('.') && !path.startsWith('$')) {
       result = this.deepSearchKey(context.$json, path);
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