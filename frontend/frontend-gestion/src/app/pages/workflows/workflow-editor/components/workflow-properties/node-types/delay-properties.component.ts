import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { EditorNode } from '../../../../../../core/models/workflow.model';

@Component({
    selector: 'app-delay-properties',
    standalone: true,
    imports: [CommonModule, FormsModule, InputNumberModule, SelectModule],
    template: `
    <div class="form-section">
        <h5><i class="pi pi-clock"></i> Configuración Delay</h5>
        <div class="form-row" style="display: flex; gap: 0.5rem;">
            <div class="form-group flex-1">
                <label>Duración</label>
                <p-inputNumber [ngModel]="delayDuration()"
                    (ngModelChange)="delayDuration.set($event); onFieldChange()" [min]="1" [max]="3600"
                    styleClass="w-full" />
            </div>
            <div class="form-group flex-1">
                <label>Unidad</label>
                <p-select [options]="delayUnits" [ngModel]="delayUnit()"
                    (ngModelChange)="delayUnit.set($event); onFieldChange()" styleClass="w-full"
                    appendTo="body" />
            </div>
        </div>
    </div>
  `
})
export class DelayPropertiesComponent implements OnChanges {
    @Input({ required: true }) node!: EditorNode;
    @Input() availableAncestors: EditorNode[] = [];
    @Output() configChange = new EventEmitter<Record<string, any>>();

    delayDuration = signal(5);
    delayUnit = signal('seconds');

    delayUnits = [
        { label: 'Segundos', value: 'seconds' },
        { label: 'Minutos', value: 'minutes' },
        { label: 'Horas', value: 'hours' },
    ];

    ngOnChanges(changes: SimpleChanges) {
        if (changes['node'] && this.node) {
            const config = this.node.config || {};
            this.delayDuration.set(config['duration'] || 5);
            this.delayUnit.set(config['unit'] || 'seconds');
        }
    }

    onFieldChange() {
        this.configChange.emit({
            duration: this.delayDuration(),
            unit: this.delayUnit(),
        });
    }
}
