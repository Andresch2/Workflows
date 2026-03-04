import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { EditorNode } from '../../../../../../core/models/workflow.model';

@Component({
    selector: 'app-form-properties',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, SelectModule, ButtonModule, DialogModule],
    template: `
    <div class="form-section">
        <h5><i class="pi pi-list"></i> Configuración Formulario</h5>
        <div class="form-group">
            <label>Título del Formulario</label>
            <input pInputText [ngModel]="formTitle()" (ngModelChange)="formTitle.set($event); onFieldChange()"
                placeholder="Ej: Datos del Cliente" class="w-full" />
        </div>

        <div class="form-group">
            <label>Campos</label>
            @for (field of formFields(); track $index) {
            <div class="form-field-row"
                style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
                <input pInputText [ngModel]="field.name" (ngModelChange)="updateFormField($index, 'name', $event)"
                    placeholder="Nombre del campo" style="flex: 1;" />
                <p-select [options]="fieldTypes" [ngModel]="field.type"
                    (ngModelChange)="updateFormField($index, 'type', $event)" placeholder="Tipo"
                    style="width: 130px;" appendTo="body" />
                <label
                    style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; white-space: nowrap; cursor: pointer;">
                    <input type="checkbox" [checked]="field.required"
                        (change)="updateFormField($index, 'required', $any($event.target).checked)" />
                    Req.
                </label>
                <p-button icon="pi pi-trash" size="small" [text]="true" severity="danger"
                    (onClick)="removeFormField($index)" pTooltip="Eliminar campo" />
            </div>
            }
            @if (!formFields().length) {
            <small style="color: #9ca3af;">No hay campos. Agrega uno con el botón de abajo.</small>
            }
            <div class="form-group" style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                <p-button label="Agregar Campo" icon="pi pi-plus" size="small" severity="secondary"
                    (onClick)="addFormField()" />
                <p-button label="Vista Previa" icon="pi pi-desktop" size="small" severity="info"
                    (onClick)="previewForm()" />
            </div>
        </div>
    </div>
    
    <!-- Phase 5 Preview Modal -->
    <p-dialog header="Vista Previa del Formulario: {{ formTitle() }}" [(visible)]="showPreview" [modal]="true" [style]="{width: '50vw'}">
        <div class="preview-container" style="padding: 1rem;">
            @for(field of formFields(); track $index) {
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-weight: bold; margin-bottom: 0.3rem;">
                        {{ field.name || 'Campo sin nombre' }}
                        @if (field.required) { <span style="color: red;">*</span> }
                    </label>
                    @if (field.type === 'textarea') {
                        <textarea pTextarea rows="3" class="w-full" disabled placeholder="Vista previa..."></textarea>
                    } @else if (field.type === 'date') {
                        <input pInputText type="date" class="w-full" disabled />
                    } @else if (field.type === 'number') {
                        <input pInputText type="number" class="w-full" disabled />
                    } @else {
                        <input pInputText type="text" class="w-full" disabled placeholder="Vista previa..." />
                    }
                </div>
            }
        </div>
        <ng-template pTemplate="footer">
            <p-button label="Cerrar" icon="pi pi-times" (onClick)="showPreview = false" />
        </ng-template>
    </p-dialog>
  `
})
export class FormPropertiesComponent implements OnChanges {
    @Input({ required: true }) node!: EditorNode;
    @Input() availableAncestors: EditorNode[] = [];
    @Output() configChange = new EventEmitter<Record<string, any>>();

    formTitle = signal('');
    formFields = signal<Array<{ name: string; type: string; required: boolean }>>([]);

    showPreview = false;

    fieldTypes = [
        { label: 'Texto', value: 'text' },
        { label: 'Email', value: 'email' },
        { label: 'Número', value: 'number' },
        { label: 'Fecha', value: 'date' },
        { label: 'Área de texto', value: 'textarea' },
    ];

    ngOnChanges(changes: SimpleChanges) {
        if (changes['node'] && this.node) {
            const config = this.node.config || {};
            this.formTitle.set(config['title'] || '');
            this.formFields.set(config['fields'] || []);
        }
    }

    onFieldChange() {
        this.configChange.emit({
            title: this.formTitle(),
            fields: this.formFields(),
        });
    }

    addFormField() {
        this.formFields.update(fields => [...fields, { name: '', type: 'text', required: false }]);
        this.onFieldChange();
    }

    removeFormField(index: number) {
        this.formFields.update(fields => fields.filter((_, i) => i !== index));
        this.onFieldChange();
    }

    updateFormField(index: number, key: 'name' | 'type' | 'required', value: any) {
        this.formFields.update(fields =>
            fields.map((f, i) => i === index ? { ...f, [key]: value } : f),
        );
        this.onFieldChange();
    }

    previewForm() {
        this.showPreview = true;
    }
}
