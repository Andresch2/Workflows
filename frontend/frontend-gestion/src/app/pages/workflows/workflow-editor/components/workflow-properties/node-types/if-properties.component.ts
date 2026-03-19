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
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { EditorNode } from '../../../../../../core/models/workflow.model';

export interface IfCondition {
    value1: string;
    operation: string;
    value2: string;
}

@Component({
    selector: 'app-if-properties',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, SelectModule, ButtonModule],
    template: `
    <div class="form-section">
        <h5><i class="pi pi-code"></i> Condiciones IF/ELSE</h5>

        <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 1rem; padding: 0.5rem 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
            <i class="pi pi-info-circle" style="color: #3b82f6; margin-right: 0.25rem;"></i>
            Si <b>todas</b> las condiciones se cumplen, el flujo ir\u00e1 por la rama verdadera (salida superior). De lo contrario, ir\u00e1 por la falsa (salida inferior).
        </div>

        <div class="flex flex-col gap-3">
            @for (condition of conditions(); track $index) {
                <div class="p-3 bg-slate-50 border border-slate-200 rounded-md relative flex flex-col gap-2">
                    <button class="absolute top-1 right-1 text-slate-400 hover:text-red-500 bg-transparent border-none cursor-pointer p-1"
                            (click)="removeCondition($index)" title="Eliminar condición">
                        <i class="pi pi-times text-xs"></i>
                    </button>
                    
                    <div class="flex flex-col gap-1 w-full mt-2">
                        <label class="text-xs font-semibold text-slate-600">Valor 1</label>
                        <input pInputText [ngModel]="condition.value1" (ngModelChange)="updateCondition($index, 'value1', $event)"
                               placeholder="{{ '{{' }} $json.campo {{ '}}' }}" class="w-full text-sm" />
                    </div>

                    <div class="flex flex-col gap-1 w-full">
                        <label class="text-xs font-semibold text-slate-600">Operación</label>
                        <p-select [options]="operations" [ngModel]="condition.operation"
                                  (ngModelChange)="updateCondition($index, 'operation', $event)"
                                  styleClass="w-full text-sm" appendTo="body" />
                    </div>

                    @if (!isUnary(condition.operation)) {
                        <div class="flex flex-col gap-1 w-full">
                            <label class="text-xs font-semibold text-slate-600">Valor 2</label>
                            <input pInputText [ngModel]="condition.value2" (ngModelChange)="updateCondition($index, 'value2', $event)"
                                   placeholder="Valor a comparar..." class="w-full text-sm" />
                        </div>
                    }
                </div>
            }

            <p-button label="Agregar Condición" icon="pi pi-plus" size="small" severity="secondary" outlined="true"
                      (onClick)="addCondition()" styleClass="w-full mt-2" />
        </div>
    </div>
  `,
})
export class IfPropertiesComponent implements OnChanges {
    @Input({ required: true }) node!: EditorNode;
    @Input() availableAncestors: EditorNode[] = [];
    @Output() configChange = new EventEmitter<Record<string, any>>();

    conditions = signal<IfCondition[]>([]);

    operations = [
        { label: 'Es igual a (Texto)', value: 'stringEquals' },
        { label: 'No es igual a (Texto)', value: 'stringNotEquals' },
        { label: 'Contiene (Texto)', value: 'stringContains' },
        { label: 'Es igual a (Número)', value: 'numberEquals' },
        { label: 'Mayor que (Número)', value: 'numberGreaterThan' },
        { label: 'Menor que (Número)', value: 'numberLessThan' },
        { label: 'Es Verdadero (Booleano)', value: 'booleanTrue' },
        { label: 'Es Falso (Booleano)', value: 'booleanFalse' },
        { label: 'Está vacío', value: 'isEmpty' },
        { label: 'No está vacío', value: 'isNotEmpty' }
    ];

    ngOnChanges(changes: SimpleChanges) {
        if (changes['node'] && this.node) {
            const config = this.node.config || {};
            const savedConditions = config['conditions'] || [];
            
            if (savedConditions.length === 0) {
                // Add one default empty condition if none exists
                this.conditions.set([{ value1: '', operation: 'stringEquals', value2: '' }]);
            } else {
                this.conditions.set(savedConditions);
            }
        }
    }

    addCondition() {
        this.conditions.update(conds => [...conds, { value1: '', operation: 'stringEquals', value2: '' }]);
        this.emitConfig();
    }

    removeCondition(index: number) {
        this.conditions.update(conds => conds.filter((_, i) => i !== index));
        this.emitConfig();
    }

    updateCondition(index: number, field: keyof IfCondition, value: any) {
        this.conditions.update(conds => {
            const newConds = [...conds];
            newConds[index] = { ...newConds[index], [field]: value };
            return newConds;
        });
        this.emitConfig();
    }

    isUnary(operation: string): boolean {
        return ['booleanTrue', 'booleanFalse', 'isEmpty', 'isNotEmpty'].includes(operation);
    }

    private emitConfig() {
        this.configChange.emit({
            conditions: this.conditions(),
            __dataSchema: {
                branch: 'true | false',
                result: 'boolean',
            },
        });
    }
}
