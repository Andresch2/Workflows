import { Injectable } from '@nestjs/common';
import { WorkflowContext } from '../types';

@Injectable()
export class TemplateUtil {
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

      return obj.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path) => {
        const value = this.getValueByPath(context, path);

        // Tolerar valores nulos o indefinidos devolviendo cadena vacía (o manejándolo adecuadamente)
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

  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => {
      if (acc === null || acc === undefined) return undefined;
      return acc[part];
    }, obj);
  }

  private stringifyValue(value: any): string {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }
}
