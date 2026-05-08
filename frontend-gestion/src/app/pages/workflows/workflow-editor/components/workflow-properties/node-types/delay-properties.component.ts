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
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { EditorNode } from '../../../../../../core/models/workflow.model';

@Component({
    selector: 'app-delay-properties',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, InputNumberModule, SelectModule, DatePickerModule, SelectButtonModule, ButtonModule],
    template: `
    <div class="form-section">
        <h5><i class="pi pi-clock"></i> Wait </h5>

        <div class="flex flex-col gap-1 w-full mb-4">
            <label>Resume</label>
            <p-select 
                [options]="resumeOptions" 
                [ngModel]="resumeMode()"
                (ngModelChange)="resumeMode.set($event); onFieldChange()"
                styleClass="w-full" 
                appendTo="body" 
            />
        </div>

        <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 1rem; padding: 0.5rem 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
            <i class="pi pi-info-circle" style="color: #3b82f6; margin-right: 0.25rem;"></i>
            Configura cu\u00e1ndo debe reanudarse la ejecuci\u00f3n del workflow.
        </div>

        <!-- AFTER TIME INTERVAL -->
        @if (resumeMode() === 'interval') {
            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                    <div class="flex justify-between items-center">
                        <label class="font-medium">Wait Amount</label>
                        <p-selectButton [options]="expressionOptions" [ngModel]="isDurationExpression()" 
                            (ngModelChange)="isDurationExpression.set($event); onFieldChange()"
                            styleClass="compact-toggle" />
                    </div>

                    @if (!isDurationExpression()) {
                        <p-inputNumber 
                            [ngModel]="delayDuration()" 
                            (ngModelChange)="delayDuration.set($event); onFieldChange()"
                            [min]="1" [showButtons]="true" styleClass="w-full" />
                    } @else {
                        <input pInputText 
                            [ngModel]="delayDuration()" 
                            (ngModelChange)="delayDuration.set($event); onFieldChange()"
                            placeholder="{{ '{{' }} $json.value {{ '}}' }}" class="w-full" />
                    }
                </div>

                <div class="flex flex-col gap-1">
                    <label class="font-medium">Wait Unit</label>
                    <p-select 
                        [options]="delayUnits" 
                        [ngModel]="delayUnit()"
                        (ngModelChange)="delayUnit.set($event); onFieldChange()"
                        styleClass="w-full" appendTo="body" />
                </div>
            </div>
        }

        <!-- AT SPECIFIED TIME -->
        @if (resumeMode() === 'date') {
            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                    <div class="flex justify-between items-center">
                        <label class="font-medium">Date and Time</label>
                        <p-selectButton [options]="expressionOptions" [ngModel]="isDateTimeExpression()" 
                            (ngModelChange)="isDateTimeExpression.set($event); onFieldChange()"
                            styleClass="compact-toggle" />
                    </div>

                    @if (!isDateTimeExpression()) {
                        <p-datepicker 
                            [ngModel]="delayDateTime()" 
                            (ngModelChange)="delayDateTime.set($event); onFieldChange()"
                            [showTime]="true" [showIcon]="true" hourFormat="24"
                            styleClass="w-full" appendTo="body" />
                    } @else {
                        <input pInputText 
                            [ngModel]="delayDateTime()" 
                            (ngModelChange)="delayDateTime.set($event); onFieldChange()"
                            placeholder="{{ '{{' }} $json.date {{ '}}' }}" class="w-full" />
                    }
                </div>
            </div>
        }
    </div>

    <style>
        :host ::ng-deep .compact-toggle .p-button {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
        }
        .font-medium {
            font-weight: 500;
            font-size: 0.85rem;
            color: #475569;
        }
    </style>
  `,
})
export class DelayPropertiesComponent implements OnChanges {
    @Input({ required: true }) node!: EditorNode;
    @Input() availableAncestors: EditorNode[] = [];
    @Output() configChange = new EventEmitter<Record<string, any>>();

    resumeMode = signal<'interval' | 'date'>('interval');
    delayDuration = signal<number | string>(5);
    delayUnit = signal('seconds');
    delayDateTime = signal<Date | string | null>(null);

    isDurationExpression = signal(false);
    isDateTimeExpression = signal(false);

    resumeOptions = [
        { label: 'Despues de un intervalo de tiempo', value: 'interval' },
        { label: 'En un momento especificado', value: 'date' },
    ];

    expressionOptions = [
        { label: 'Fijo', value: false },
        { label: 'Expresion', value: true },
    ];

    delayUnits = [
        { label: 'Segundos', value: 'seconds' },
        { label: 'Minutos', value: 'minutes' },
        { label: 'Horas', value: 'hours' },
        { label: 'Dias', value: 'days' },
    ];

    private lastNodeId?: string;

    ngOnChanges(changes: SimpleChanges) {
        if (changes['node'] && this.node) {
            const config = this.node.config || {};
            const isNewNode = this.node.id !== this.lastNodeId;
            this.lastNodeId = this.node.id;

            if (isNewNode) {
                this.resumeMode.set(config['resumeMode'] || 'interval');
            }

            // Duración
            const rawDuration = config['duration'];
            const durationHasBraces = typeof rawDuration === 'string' && String(rawDuration).includes('{{');

            if (isNewNode || durationHasBraces) {
                this.isDurationExpression.set(durationHasBraces);
            }
            this.delayDuration.set(rawDuration ?? 5);

            // Fecha
            const rawDate = config['dateTime'];
            const dateHasBraces = typeof rawDate === 'string' && String(rawDate).includes('{{');

            if (isNewNode || dateHasBraces) {
                this.isDateTimeExpression.set(dateHasBraces);
            }

            if (!this.isDateTimeExpression()) {
                this.delayDateTime.set(rawDate ? new Date(rawDate) : null);
            } else {
                this.delayDateTime.set(rawDate || '');
            }

            if (isNewNode) {
                this.delayUnit.set(config['unit'] || 'seconds');
            }
        }
    }

    onFieldChange() {
        let finalDuration = this.delayDuration();
        let finalDateTime = this.delayDateTime();

        // Asegurar que la fecha sea ISO si no es una expresión
        if (finalDateTime instanceof Date) {
            finalDateTime = finalDateTime.toISOString();
        }

        this.configChange.emit({
            resumeMode: this.resumeMode(),
            duration: finalDuration,
            unit: this.delayUnit(),
            dateTime: finalDateTime,
            __dataSchema: this.buildDelaySchema(),
        });
    }

    private buildDelaySchema() {
        return {
            status: 'success',
            waited: '',
            resumedAt: '',
        };
    }
}