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
import { DialogModule } from 'primeng/dialog';
import { EditorNode } from '../../../../../../core/models/workflow.model';
import { PublicFormComponent } from '../../../../public-form/public-form.component';

type FormField = {
    name: string;
    type: string;
    required?: boolean;
    value?: string;
    mode?: 'fixed' | 'expression';
};

@Component({
    selector: 'app-form-properties',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        InputTextModule, 
        SelectModule, 
        ButtonModule, 
        SelectButtonModule,
        DialogModule,
        PublicFormComponent
    ],
    template: `
    <div class="form-section p-1">
        <!-- Compartir Formulario -->
        <div class="mb-6 p-3 bg-violet-600 rounded-2xl text-white shadow-lg shadow-violet-200">
            <h5 class="flex items-center gap-2 font-bold mb-2 text-white border-b border-white/20 pb-2">
                <i class="pi pi-share-alt"></i> Compartir Formulario
            </h5>
            <p class="text-[10px] opacity-80 mb-3">Usa este enlace para que otros llenen el formulario y activen este flujo.</p>
            
            <div class="flex gap-2">
                <input 
                    pInputText 
                    [value]="getPublicUrl()" 
                    readonly 
                    class="flex-1 text-[10px] bg-white/10 border-white/20 text-white placeholder:text-white/40 h-8"
                />
                <p-button 
                    icon="pi pi-copy" 
                    (onClick)="copyToClipboard()" 
                    pTooltip="Copiar enlace"
                    styleClass="p-button-sm p-button-rounded bg-white/20 border-none hover:bg-white/30 h-8 w-8"
                />
                <p-button 
                    icon="pi pi-eye" 
                    (onClick)="showPreview.set(true)" 
                    pTooltip="Vista previa rápida"
                    styleClass="p-button-sm p-button-rounded bg-white/20 border-none hover:bg-white/30 h-8 w-8"
                />
                <p-button 
                    icon="pi pi-external-link" 
                    (onClick)="openPublicUrl()" 
                    pTooltip="Abrir en pestaña nueva"
                    styleClass="p-button-sm p-button-rounded bg-white/20 border-none hover:bg-white/30 h-8 w-8"
                />
            </div>
        </div>

        <!-- Modal de Vista Previa -->
        <p-dialog 
            [(visible)]="showPreview" 
            [modal]="true" 
            [header]="'Vista Previa: ' + (formTitle() || 'Formulario')" 
            [style]="{ width: '550px' }"
            [breakpoints]="{ '960px': '95vw' }"
            [dismissableMask]="true"
            appendTo="body"
            styleClass="preview-dialog"
        >
            <app-public-form 
                [nodeId]="node.id" 
                [previewConfig]="{
                    title: formTitle(),
                    description: formDescription(),
                    successMsg: formSuccessMsg(),
                    fields: formFields()
                }"
            ></app-public-form>
        </p-dialog>

        <h5 class="flex items-center gap-2 text-violet-700 font-bold mb-4">
            <i class="pi pi-list"></i> Configuración Formulario
        </h5>

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
                <!-- UI para tipos especiales (title, description, successMsg) -->
                @if (['title', 'description', 'successMsg'].includes(field.type)) {
                    <div class="flex flex-col gap-2">
                        <div class="flex justify-between items-center">
                            <label class="text-[9px] uppercase tracking-widest text-violet-700 font-bold">
                                {{ field.type === 'title' ? 'Título del Formulario' : field.type === 'description' ? 'Descripción' : 'Mensaje de Éxito' }}
                            </label>
                            <p-selectButton
                                [options]="modeOptions"
                                [ngModel]="field.mode || 'fixed'"
                                (ngModelChange)="updateFormField($index, 'mode', $event)"
                                optionLabel="label"
                                optionValue="value"
                                styleClass="n8n-toggle"
                            />
                        </div>
                        <input
                            pInputText
                            [ngModel]="field.value"
                            (ngModelChange)="updateFormField($index, 'value', $event)"
                            [placeholder]="field.type === 'title' ? 'Ej: Datos del Cliente' : field.type === 'description' ? 'Breve descripción...' : '¡Gracias por enviarlo!'"
                            class="w-full text-xs p-2 border-violet-100 bg-white/80 focus:bg-white"
                            [class.form-input-expression]="field.mode === 'expression'"
                        />
                        <div class="flex justify-end">
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
                } @else {
                    <!-- UI para campos normales -->
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
                }
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
    
    showPreview = signal(false);
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
        { label: 'Título', value: 'title' },
        { label: 'Descripción', value: 'description' },
        { label: 'Mensaje de Éxito', value: 'successMsg' },
    ];

    getPublicUrl(): string {
        if (!this.node?.id) return '';
        return `${window.location.host.includes('localhost') ? 'http://' : 'https://'}${window.location.host}/form/${this.node.id}`;
    }

    copyToClipboard() {
        const url = this.getPublicUrl();
        navigator.clipboard.writeText(url);
    }

    openPublicUrl() {
        const url = this.getPublicUrl();
        window.open(url, '_blank');
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['node'] && this.node) {
            const config = this.node.config || {};
            
            const title = config['title'] || '';
            const description = config['description'] || '';
            const successMsg = config['successMsg'] || '';

            this.formTitle.set(title);
            this.formDescription.set(description);
            this.formSuccessMsg.set(successMsg);

            // Importar campos existentes
            const incomingFields = Array.isArray(config['fields']) ? config['fields'] : [];
            const mappedFields: FormField[] = incomingFields.map((field: any) => ({
                name: String(field?.name || ''),
                type: String(field?.type || 'text'),
                required: Boolean(field?.required),
                value: field?.value || '',
                mode: field?.mode || 'fixed'
            }));

            // Si tenemos valores heredados de nivel superior pero sin campos correspondientes, los agregamos
            if (title && !mappedFields.some(f => f.type === 'title')) {
                mappedFields.unshift({ name: 'title', type: 'title', value: title, mode: title.includes('{{') ? 'expression' : 'fixed' });
            }
            if (description && !mappedFields.some(f => f.type === 'description')) {
                mappedFields.push({ name: 'description', type: 'description', value: description, mode: description.includes('{{') ? 'expression' : 'fixed' });
            }
            if (successMsg && !mappedFields.some(f => f.type === 'successMsg')) {
                mappedFields.push({ name: 'successMsg', type: 'successMsg', value: successMsg, mode: successMsg.includes('{{') ? 'expression' : 'fixed' });
            }

            this.formFields.set(mappedFields);
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
            if (['title', 'description', 'successMsg'].includes(field.type)) continue;
            
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
        const fields = this.formFields();
        
        // Sincronizar campos especiales de vuelta al nivel superior para retrocompatibilidad
        const titleField = fields.find(f => f.type === 'title');
        const descField = fields.find(f => f.type === 'description');
        const successField = fields.find(f => f.type === 'successMsg');

        if (titleField) this.formTitle.set(titleField.value || '');
        if (descField) this.formDescription.set(descField.value || '');
        if (successField) this.formSuccessMsg.set(successField.value || '');

        this.configChange.emit({
            title: this.formTitle(),
            description: this.formDescription(),
            successMsg: this.formSuccessMsg(),
            fields: fields,
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

    updateFormField(index: number, key: 'name' | 'type' | 'required' | 'value' | 'mode', value: any) {
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
                                    : key === 'mode'
                                        ? String(value || 'fixed')
                                        : String(value || ''),
                    }
                    : field,
            ),
        );

        this.onFieldChange();
    }
}