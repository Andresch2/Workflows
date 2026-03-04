import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { EditorNode } from '../../../../../../core/models/workflow.model';

@Component({
    selector: 'app-set-properties',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, ButtonModule],
    template: `
    <div class="form-section">
        <h5><i class="pi pi-tags"></i> Nodo Set (Establecer Variables)</h5>
        
        <div class="form-group" style="margin-bottom: 1rem;">
            <p style="font-size: 0.8rem; color: #9ca3af; line-height: 1.4;">
                Crea nuevas variables usando datos de nodos anteriores (Global Memory Context).<br>
                Usa <code>{{ '{' + '{ nodes.NODO_ID.data.campo }' + '}' }}</code> para evaluar paths.
            </p>
        </div>

        <div class="form-group">
            <label>Campos a establecer</label>
            @for (field of setFields(); track $index) {
            <div class="form-field-row"
                style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
                <input pInputText [ngModel]="field.key" (ngModelChange)="updateSetField($index, 'key', $event)"
                    placeholder="nombreDeVariable" style="flex: 0.8;" />
                
                <span style="color: #9ca3af;">=</span>
                
                <input pInputText [ngModel]="field.value" (ngModelChange)="updateSetField($index, 'value', $event)"
                    placeholder="{{ '{' + '{ nodes.... }' + '}' }}" style="flex: 1.5;" />
                
                <p-button icon="pi pi-trash" size="small" [text]="true" severity="danger"
                    (onClick)="removeSetField($index)" pTooltip="Eliminar" />
            </div>
            }

            @if (!setFields().length) {
                <small style="color: #64748b;">No hay variables definidas.</small>
            }

            <div class="form-group" style="margin-top: 0.5rem;">
                <p-button label="Agregar Variable" icon="pi pi-plus" size="small" severity="secondary"
                    (onClick)="addSetField()" />
            </div>
        </div>
    </div>
  `
})
export class SetPropertiesComponent implements OnChanges {
    @Input({ required: true }) node!: EditorNode;
    @Input() availableAncestors: EditorNode[] = [];
    @Output() configChange = new EventEmitter<Record<string, any>>();

    setFields = signal<Array<{ key: string; value: string }>>([]);

    ngOnChanges(changes: SimpleChanges) {
        if (changes['node']) {
            const config = this.node.config || {};
            const configFields = config['fields'] || {};

            // Convertir object a array de pares
            const arr = Object.keys(configFields).map(k => ({ key: k, value: configFields[k] }));
            this.setFields.set(arr);
        }
    }

    onFieldChange() {
        // Reconstruir objeto JSON a partir del array
        const fieldsObj: Record<string, string> = {};
        for (const f of this.setFields()) {
            if (f.key.trim()) {
                fieldsObj[f.key.trim()] = f.value;
            }
        }

        this.configChange.emit({
            fields: fieldsObj
        });
    }

    addSetField() {
        this.setFields.update(f => [...f, { key: '', value: '' }]);
        // No emitimos onFieldChange todavía hasta que tengan texto válido
    }

    removeSetField(index: number) {
        this.setFields.update(f => f.filter((_, i) => i !== index));
        this.onFieldChange();
    }

    updateSetField(index: number, type: 'key' | 'value', val: string) {
        this.setFields.update(f => f.map((item, i) => i === index ? { ...item, [type]: val } : item));
        this.onFieldChange();
    }
}
