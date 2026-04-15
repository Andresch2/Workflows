import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { EditorNode } from '../../../../../../core/models/workflow.model';

const DEFAULT_SCRIPT = `// Puedes usar: $json, $node, $globals, $env
// Retorna un objeto o asigna a "output".
const userId = Number($json?.user_id ?? 0);

output = {
  ...$json,
  user_id: userId,
  aprobado: userId > 0,
};`;

@Component({
    selector: 'app-code-properties',
    standalone: true,
    imports: [CommonModule, FormsModule, TextareaModule],
    template: `
    <div class="form-section">
        <h5><i class="pi pi-file-edit"></i> Configuracion Code</h5>

        <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 1rem; padding: 0.5rem 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
            <i class="pi pi-info-circle" style="color: #3b82f6; margin-right: 0.25rem;"></i>
            Este nodo ejecuta JavaScript sobre los datos de entrada y entrega el resultado al siguiente nodo.
        </div>

        <div class="flex flex-col gap-1 mb-3">
            <label class="text-xs font-semibold text-slate-600">Codigo JavaScript</label>
            <textarea
                [ngModel]="code()"
                (ngModelChange)="code.set($event); emitConfig()"
                rows="12"
                class="json-editor"
                placeholder="return { ...$json, nuevoCampo: 'valor' };"></textarea>
        </div>

        <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-slate-600">Schema de salida (JSON opcional)</label>
            <textarea
                [ngModel]="outputSchemaRaw()"
                (ngModelChange)="outputSchemaRaw.set($event); emitConfig()"
                rows="4"
                class="json-editor"
                placeholder='{"user_id":"number","aprobado":"boolean"}'></textarea>
        </div>
    </div>
  `,
})
export class CodePropertiesComponent implements OnChanges {
    @Input({ required: true }) node!: EditorNode;
    @Output() configChange = new EventEmitter<Record<string, any>>();

    code = signal(DEFAULT_SCRIPT);
    outputSchemaRaw = signal('');

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['node'] || !this.node) return;

        this.code.set((this.node.config?.['code'] as string) || DEFAULT_SCRIPT);

        const schema = this.node.config?.['outputSchema'];
        if (schema && typeof schema === 'object') {
            this.outputSchemaRaw.set(JSON.stringify(schema, null, 2));
        } else {
            this.outputSchemaRaw.set('');
        }
    }

    emitConfig() {
        const config: Record<string, any> = {
            code: this.code(),
        };

        const parsedSchema = this.parseSchema(this.outputSchemaRaw());
        if (parsedSchema) {
            config['outputSchema'] = parsedSchema;
        }

        this.configChange.emit({
            ...config,
            __dataSchema: parsedSchema || { result: 'any' },
        });
    }

    private parseSchema(raw: string): Record<string, any> | null {
        const trimmed = (raw || '').trim();
        if (!trimmed) return null;

        try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed;
            }
            return null;
        } catch {
            return null;
        }
    }
}
