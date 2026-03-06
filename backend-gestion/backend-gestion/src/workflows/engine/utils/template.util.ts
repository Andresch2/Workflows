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

  private interpolate(obj: any, context: WorkflowContext): any {
    if (typeof obj === 'string') {
      if (obj.trim() === '{{ __FULL_PAYLOAD__ }}') {
        const payload: any = { ...context };
        delete payload.workflowId;
        return payload;
      }

      const wholeMatch = obj.match(TemplateUtil.WHOLE_EXPR_REGEX);
      if (wholeMatch) {
        const value = this.getValueByPath(context, wholeMatch[1]);
        return value === undefined ? '' : value;
      }

      return obj.replace(TemplateUtil.INLINE_EXPR_REGEX, (_match, pathExpr) => {
        const value = this.getValueByPath(context, pathExpr);
        if (value === undefined || value === null) {
          return '';
        }
        return this.stringifyValue(value);
      });
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.interpolate(item, context));
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolate(value, context);
      }
      return result;
    }

    return obj;
  }

  private getValueByPath(obj: any, rawPath: string): any {
    const path = this.normalizePath(rawPath.trim());
    if (!path) return undefined;

    return path.split('.').reduce((acc, part) => {
      if (acc === null || acc === undefined) return undefined;
      return acc[part];
    }, obj);
  }

  private normalizePath(path: string): string {
    return path
      .replace(/\[(\d+)\]/g, '.$1')
      .replace(/\[['"]([^'"]+)['"]\]/g, '.$1')
      .replace(/\.+/g, '.')
      .replace(/^\./, '')
      .replace(/\.$/, '');
  }

  private stringifyValue(value: any): string {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }
}
