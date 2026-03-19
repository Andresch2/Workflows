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
import { SelectButtonModule } from 'primeng/selectbutton';
import { EditorNode } from '../../../../../../core/models/workflow.model';

type FormField = {
    name: string;
    type: string;
    required: boolean;
};

@Component({
    selector: 'app-form-properties',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, SelectModule, ButtonModule, SelectButtonModule],
    template: `
    <div class="form-section p-1">
        <h5 class="flex items-center gap-2 text-violet-700 font-bold mb-4">
            <i class="pi pi-list"></i> Configuración Formulario
        </h5>

        <!-- Título -->
        <div class="flex flex-col gap-1 w-full mb-4">
            <div class="flex justify-between items-center mb-1">
                <label class="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">
                    Título del Formulario
                </label>
                <p-selectButton
                    [options]="modeOptions"
                    [ngModel]="titleMode()"
                    (ngModelChange)="onModeChange('title', $event)"
                    optionLabel="label"
                    optionValue="value"
                    styleClass="n8n-toggle"
                />
            </div>
            
            <input
                pInputText
                [ngModel]="formTitle()"
                (ngModelChange)="formTitle.set($event || ''); onFieldChange()"
                placeholder="Ej: Datos del Cliente"
                class="w-full border-slate-200 focus:border-violet-400 transition-colors shadow-none bg-white/50"
                [class.form-input-expression]="titleMode() === 'expression'"
            />
            <small *ngIf="titleMode() === 'expression'" class="text-[10px] text-slate-400 ml-1">
                <i class="pi pi-info-circle text-[9px]"></i> Usa {{ '&#123;&#123;' }} &#125;&#125; para variables
            </small>
        </div>

        <!-- Descripción -->
        <div class="flex flex-col gap-1 w-full mb-4">
            <div class="flex justify-between items-center mb-1">
                <label class="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">
                    Descripción
                </label>
                <p-selectButton
                    [options]="modeOptions"
                    [ngModel]="descriptionMode()"
                    (ngModelChange)="onModeChange('description', $event)"
                    optionLabel="label"
                    optionValue="value"
                    styleClass="n8n-toggle"
                />
            </div>
            
            <input
                pInputText
                [ngModel]="formDescription()"
                (ngModelChange)="formDescription.set($event || ''); onFieldChange()"
                placeholder="Breve descripción del objetivo de este formulario..."
                class="w-full border-slate-200 focus:border-violet-400 transition-colors shadow-none bg-white/50"
                [class.form-input-expression]="descriptionMode() === 'expression'"
            />
            <small *ngIf="descriptionMode() === 'expression'" class="text-[10px] text-slate-400 ml-1">
                <i class="pi pi-info-circle text-[9px]"></i> Usa {{ '&#123;&#123;' }} &#125;&#125; para variables
            </small>
        </div>

        <!-- Mensaje de Éxito -->
        <div class="flex flex-col gap-1 w-full mb-6">
            <div class="flex justify-between items-center mb-1">
                <label class="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">
                    Mensaje de Éxito
                </label>
                <p-selectButton
                    [options]="modeOptions"
                    [ngModel]="successMsgMode()"
                    (ngModelChange)="onModeChange('successMsg', $event)"
                    optionLabel="label"
                    optionValue="value"
                    styleClass="n8n-toggle"
                />
            </div>
            
            <input
                pInputText
                [ngModel]="formSuccessMsg()"
                (ngModelChange)="formSuccessMsg.set($event || ''); onFieldChange()"
                placeholder="¡Gracias por tu respuesta!"
                class="w-full border-slate-200 focus:border-violet-400 transition-colors shadow-none bg-white/50"
                [class.form-input-expression]="successMsgMode() === 'expression'"
            />
             <small *ngIf="successMsgMode() === 'expression'" class="text-[10px] text-slate-400 ml-1">
                <i class="pi pi-info-circle text-[9px]"></i> Usa {{ '&#123;&#123;' }} &#125;&#125; para variables
            </small>
        </div>

        <div class="flex flex-col gap-3 w-full">
            <div class="flex items-center justify-between mb-1 px-1">
                <label class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Campos del Formulario
                </label>
                <span class="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                    {{ formFields().length }} campos
                </span>
            </div>

            @for (field of formFields(); track $index) {
            <div
                class="group relative flex flex-col gap-3 p-3 bg-violet-50/30 border border-violet-100 rounded-xl hover:border-violet-300 hover:bg-violet-50/50 transition-all shadow-sm"
            >
                <div class="flex gap-2 items-start">
                    <div class="flex-1 flex flex-col gap-1">
                        <label class="text-[9px] uppercase tracking-widest text-violet-600/70 font-bold min-h-[22px] flex items-end">
                            Nombre del Identificador
                        </label>
                        <input
                            pInputText
                            [ngModel]="field.name"
                            (ngModelChange)="updateFormField($index, 'name', $event)"
                            placeholder="nombre_variable"
                            class="w-full text-xs p-2 border-violet-100 bg-white/80 focus:bg-white h-[32px]"
                        />
                    </div>

                    <div class="w-32 flex flex-col gap-1">
                        <label class="text-[9px] uppercase tracking-widest text-violet-600/70 font-bold min-h-[22px] flex items-end">
                            Tipo de Dato
                        </label>
                        <p-select
                            [options]="fieldTypes"
                            [ngModel]="field.type"
                            (ngModelChange)="updateFormField($index, 'type', $event)"
                            placeholder="Tipo"
                            class="w-full text-xs h-[32px] border-violet-100 bg-white/80"
                            appendTo="body"
                        />
                    </div>
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-violet-100/50">
                    <label class="flex items-center gap-2 text-[11px] text-violet-700 font-medium cursor-pointer select-none">
                        <input
                            type="checkbox"
                            [checked]="field.required"
                            (change)="updateFormField($index, 'required', $any($event.target).checked)"
                            class="w-3.5 h-3.5 rounded border-violet-200 text-violet-600 focus:ring-violet-500"
                        />
                        Requerido
                    </label>

                    <p-button
                        icon="pi pi-trash"
                        size="small"
                        [text]="true"
                        severity="danger"
                        (onClick)="removeFormField($index)"
                        pTooltip="Eliminar"
                        styleClass="p-0 h-7 w-7 hover:bg-red-50"
                    />
                </div>
            </div>
            }

            @if (!formFields().length) {
            <div class="text-center py-6 border-2 border-dashed border-violet-100 rounded-xl bg-violet-50/10">
                <i class="pi pi-plus-circle text-violet-200 text-xl mb-2 block"></i>
                <small class="text-violet-400 font-medium italic">Sin campos definidos</small>
            </div>
            }

            <div class="mt-4">
                <p-button
                    label="Agregar Nuevo Campo"
                    icon="pi pi-plus"
                    size="small"
                    severity="secondary"
                    (onClick)="addFormField()"
                    [outlined]="true"
                    styleClass="w-full border-dashed border-2 hover:border-violet-400 hover:text-violet-600 py-2"
                />
            </div>
        </div>
    </div>
  `,
})
export class FormPropertiesComponent implements OnChanges {
    @Input({ required: true }) node!: EditorNode;
    @Input() availableAncestors: EditorNode[] = [];
    @Output() configChange = new EventEmitter<Record<string, any>>();

    formTitle = signal('');
    formDescription = signal('');
    formSuccessMsg = signal('');
    
    titleMode = signal<'fixed' | 'expression'>('fixed');
    descriptionMode = signal<'fixed' | 'expression'>('fixed');
    successMsgMode = signal<'fixed' | 'expression'>('fixed');

    formFields = signal<FormField[]>([]);

    modeOptions: any[] = [{ label: 'Fixed', value: 'fixed' }, { label: 'Expression', value: 'expression' }];

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
            
            const title = config['title'] || '';
            const description = config['description'] || '';
            const successMsg = config['successMsg'] || '';

            this.formTitle.set(title);
            this.formDescription.set(description);
            this.formSuccessMsg.set(successMsg);

            // Set specific modes based on curly braces (only on load, not on every keystroke)
            if (!this.titleMode() || this.titleMode() === 'fixed') {
                this.titleMode.set(title.includes('{{') && title.includes('}}') ? 'expression' : 'fixed');
            }
            if (!this.descriptionMode() || this.descriptionMode() === 'fixed') {
                this.descriptionMode.set(description.includes('{{') && description.includes('}}') ? 'expression' : 'fixed');
            }
            if (!this.successMsgMode() || this.successMsgMode() === 'fixed') {
                this.successMsgMode.set(successMsg.includes('{{') && successMsg.includes('}}') ? 'expression' : 'fixed');
            }

            const incomingFields = Array.isArray(config['fields']) ? config['fields'] : [];
            this.formFields.set(
                incomingFields.map((field: any) => ({
                    name: String(field?.name || ''),
                    type: String(field?.type || 'text'),
                    required: Boolean(field?.required),
                })),
            );
        }
    }

    private buildFieldSchemaValue(field: FormField): any {
        switch (field.type) {
            case 'number':
                return 0;
            case 'date':
                return '';
            case 'email':
                return '';
            case 'textarea':
                return '';
            case 'text':
            default:
                return '';
        }
    }

    private buildFormSchema(): Record<string, any> {
        const schema: Record<string, any> = {};

        for (const field of this.formFields()) {
            const fieldName = String(field.name || '').trim();
            if (!fieldName) continue;

            schema[fieldName] = this.buildFieldSchemaValue(field);
        }

        return schema;
    }

    onModeChange(field: 'title' | 'description' | 'successMsg', mode: 'fixed' | 'expression') {
        if (!mode) return;
        
        switch (field) {
            case 'title':
                this.titleMode.set(mode);
                break;
            case 'description':
                this.descriptionMode.set(mode);
                break;
            case 'successMsg':
                this.successMsgMode.set(mode);
                break;
        }
        this.onFieldChange();
    }

    onFieldChange() {
        this.configChange.emit({
            title: this.formTitle(),
            description: this.formDescription(),
            successMsg: this.formSuccessMsg(),
            fields: this.formFields(),
            __dataSchema: this.buildFormSchema(),
        });
    }

    addFormField() {
        this.formFields.update((fields) => [
            ...fields,
            { name: '', type: 'text', required: false },
        ]);
        this.onFieldChange();
    }

    removeFormField(index: number) {
        this.formFields.update((fields) => fields.filter((_, i) => i !== index));
        this.onFieldChange();
    }

    updateFormField(index: number, key: 'name' | 'type' | 'required', value: any) {
        this.formFields.update((fields) =>
            fields.map((field, i) =>
                i === index
                    ? {
                        ...field,
                        [key]:
                            key === 'required'
                                ? Boolean(value)
                                : key === 'type'
                                    ? String(value || 'text')
                                    : String(value || ''),
                    }
                    : field,
            ),
        );

        this.onFieldChange();
    }
}