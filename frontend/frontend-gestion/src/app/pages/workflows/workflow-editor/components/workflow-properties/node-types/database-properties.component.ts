import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
    inject,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { EditorNode } from '../../../../../../core/models/workflow.model';
import { ProjectService } from '../../../../../../core/services/project.service';
import { WorkflowService } from '../../../../../../core/services/workflow.service';

export interface FieldDef {
    key: string;
    label: string;
    type: 'text' | 'email' | 'textarea' | 'date' | 'select';
    placeholder?: string;
    options?: any[];
}

export interface TableRecord {
    label: string;
    value: string;
    endpoint: string;
    editableFields: FieldDef[];
    json: Record<string, any>;
}

// DATABASE_TABLES is now dynamic through catalog

@Component({
    selector: 'app-database-properties',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, TextareaModule, SelectModule, ButtonModule],
    template: `
    <div class="form-section">
        <h5><i class="pi pi-database"></i> Configuración Database</h5>

        <div class="flex flex-col gap-1 w-full mb-3">
            <label>Tabla</label>
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.6rem;">
                @for (table of databaseCatalog(); track table.tableName) {
                <span
                    (click)="onTableSelect(table)"
                    [style.background]="recordTableValue() === table.tableName ? '#3b82f6' : '#1e293b'"
                    [style.color]="recordTableValue() === table.tableName ? '#fff' : '#94a3b8'"
                    style="display: inline-flex; align-items: center; gap: 0.3rem;
                           padding: 0.25rem 0.65rem; border-radius: 20px; font-size: 0.78rem;
                           cursor: pointer; border: 1px solid #334155; transition: all 0.15s; user-select: none;"
                >
                    <i class="pi pi-table" style="font-size: 0.7rem;"></i>{{ table.label }}
                </span>
                }
            </div>
        </div>

        <div class="flex flex-col gap-1 w-full mb-3 mt-3">
            <label>Operación</label>
            <p-select
                [options]="operations"
                [ngModel]="recordOperation()"
                (ngModelChange)="onOperationChange($event)"
                placeholder="Selecciona una operación"
                styleClass="w-full"
                appendTo="body"
            />
        </div>

        @if (recordOperation() === 'UPDATE' || recordOperation() === 'DELETE') {
        <div class="flex flex-col gap-1 w-full mb-3 mt-3 p-3 bg-red-50/50 dark:bg-rose-950/20 border border-red-100 dark:border-rose-900/40 rounded-lg">
            <label style="font-size: 0.8rem; font-weight: 600; color: #b91c1c;">
                <i class="pi pi-key mr-1"></i>ID del Registro
            </label>
            <p-select
                [options]="availableRecords()"
                [ngModel]="recordData()['id'] || ''"
                (ngModelChange)="updateRecordField('id', $event)"
                [placeholder]="'Ej: uuid-1234 o {{ id }}'"
                [editable]="true"
                [loading]="loadingRecords()"
                optionLabel="label"
                optionValue="value"
                styleClass="w-full mt-1"
                class="w-full mt-1"
                appendTo="body"
            />
            <small style="color: #94a3b8; font-size: 0.7rem; margin-top: 0.2rem;">
                Obligatorio para {{ recordOperation() === 'UPDATE' ? 'actualizar' : 'eliminar' }} el registro exacto.
            </small>
        </div>
        }

        @if (recordFields().length > 0 && (recordOperation() === 'CREATE' || recordOperation() === 'UPDATE')) {
        <div class="flex flex-col gap-1 w-full mb-3 mt-3">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                <i class="pi pi-list" style="color: #3b82f6; font-size: 0.85rem;"></i>
                <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #64748b;">
                    Mapeo de Columnas
                </span>
            </div>

            <div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.75rem; padding: 0.5rem 0.75rem; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px;">
                <i class="pi pi-info-circle" style="color: #38bdf8; margin-right: 0.25rem;"></i>
                Escriba su valor fijo (Ej. "Mario") o interpole din\u00e1micamente usando
                <code [innerText]="'{{ $json.campo }}'" style="background: #e0f2fe; color: #0369a1; padding: 0.1rem 0.35rem; border-radius: 3px; font-size: 0.7rem; font-weight: 600;"></code>
            </div>

            <!-- Table header -->
            <div style="display: flex; gap: 0.5rem; padding: 0.4rem 0.5rem; border-bottom: 2px solid #e2e8f0; margin-bottom: 0.25rem;">
                <div style="width: 35%; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; color: #64748b;">
                    Columna
                </div>
                <div style="width: 65%; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; color: #64748b;">
                    Valor
                </div>
            </div>

            <!-- Table rows -->
            <div style="display: flex; flex-direction: column; gap: 0;">
                @for (field of recordFields(); track field.key) {
                    @if (shouldShowField(field)) {
                    <div style="display: flex; gap: 0.5rem; align-items: center; padding: 0.45rem 0.5rem; border-bottom: 1px solid #f1f5f9; transition: background 0.1s;"
                         class="hover:bg-slate-50">
                        <!-- Column info -->
                        <div style="width: 35%; display: flex; flex-direction: column; gap: 0.1rem;">
                            <span style="font-size: 0.8rem; font-weight: 600; color: #1e293b;">
                                {{ field.key }}
                            </span>
                            <span style="font-size: 0.65rem; color: #94a3b8; font-style: italic;">
                                {{ field.type === 'select' ? 'enum' : field.type === 'textarea' ? 'text' : field.type }}
                            </span>
                        </div>

                        <!-- Value input -->
                        <div style="width: 65%;">
                            @if (field.type === 'select') {
                            <p-select
                                [options]="field.options || []"
                                [ngModel]="recordData()[field.key] || ''"
                                (ngModelChange)="updateRecordField(field.key, $event)"
                                [placeholder]="'Selecciona ' + field.label"
                                [editable]="true"
                                styleClass="w-full"
                                appendTo="body"
                            />
                            } @else {
                            <input
                                pInputText
                                type="text"
                                [ngModel]="recordData()[field.key] || ''"
                                (ngModelChange)="updateRecordField(field.key, $event)"
                                [placeholder]="getFieldPlaceholder(field)"
                                class="w-full"
                                style="font-size: 0.82rem;"
                            />
                            }
                        </div>
                    </div>
                    }
                }
            </div>
        </div>
        }

        <div class="flex flex-col gap-1 w-full mb-3 mt-3">
            <p-button
                [label]="'Probar ' + recordOperation()"
                icon="pi pi-play"
                size="small"
                severity="secondary"
                (onClick)="testActionNode()"
                [loading]="testingAction()"
                [disabled]="!recordJson()['table'] || ((recordOperation() === 'UPDATE' || recordOperation() === 'DELETE') && !recordData()['id'])"
            />
        </div>

        @if (actionTestResult()) {
        <div class="flex flex-col gap-1 w-full mb-3 mt-3">
            @if (actionTestResult()!.rows && actionTestResult()!.rows!.length > 0) {
            <label>Resultado ({{ actionTestResult()!.rows!.length }} registros)</label>
            <div style="overflow-x: auto; margin-top: 0.5rem; border-radius: 6px; border: 1px solid #334155;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; font-family: monospace;">
                    <thead>
                        <tr style="background: #1e293b; color: #94a3b8;">
                            @for (col of getActionResultColumns(); track col) {
                            <th style="padding: 0.4rem 0.75rem; text-align: left; border-bottom: 1px solid #334155;">
                                {{ col }}
                            </th>
                            }
                        </tr>
                    </thead>
                    <tbody>
                        @for (row of actionTestResult()!.rows!; track $index) {
                        <tr [style.background]="$index % 2 === 0 ? '#0f172a' : '#1e293b'">
                            @for (col of getActionResultColumns(); track col) {
                            <td style="padding: 0.35rem 0.75rem; color: #e2e8f0; border-bottom: 1px solid #1e293b;">
                                {{ row[col] }}
                            </td>
                            }
                        </tr>
                        }
                    </tbody>
                </table>
            </div>
            } @else {
            <label>Respuesta</label>
            <textarea
                pTextarea
                [value]="actionTestResult()!.raw | json"
                readonly
                rows="6"
                class="w-full"
                style="background-color: #1e293b; color: #e2e8f0; font-family: monospace; font-size: 0.82rem; border-radius: 6px;"
            ></textarea>
            }
        </div>
        }
    </div>
  `,
})
export class DatabasePropertiesComponent implements OnInit, OnChanges {
    @Input({ required: true }) node!: EditorNode;
    @Input() availableAncestors: EditorNode[] = [];
    @Output() configChange = new EventEmitter<Record<string, any>>();

    workflowService = inject(WorkflowService);
    messageService = inject(MessageService);
    projectService = inject(ProjectService);

    databaseCatalog = inject(WorkflowService).databaseCatalog;
    operations = [
        { label: 'Leer Registros', value: 'READ' },
        { label: 'Crear Registro', value: 'CREATE' },
        { label: 'Actualizar Registro', value: 'UPDATE' },
        { label: 'Eliminar Registro', value: 'DELETE' },
    ];

    recordNombre = signal('');
    recordTableValue = signal('');
    recordOperation = signal('READ');
    recordFields = signal<FieldDef[]>([]);
    recordData = signal<Record<string, any>>({});
    recordJson = signal<Record<string, any>>({});
    
    availableRecords = signal<{label: string, value: string}[]>([]);
    loadingRecords = signal(false);

    onOperationChange(op: string) {
        this.recordOperation.set(op);
        if ((op === 'UPDATE' || op === 'DELETE') && this.recordTableValue()) {
            this.fetchAvailableRecords(this.recordTableValue());
        }
        this.onFieldChange();
    }

    private fetchAvailableRecords(tableName: string) {
        if (!tableName) {
            this.availableRecords.set([]);
            return;
        }

        const payload = {
            nombre: 'FetchRecords',
            json: {
                table: tableName,
                operation: 'READ',
            },
            data: {},
        };

        this.loadingRecords.set(true);
        this.workflowService.testDatabase(payload).subscribe({
            next: (result) => {
                this.loadingRecords.set(false);
                if (result.status === 'success' && Array.isArray(result.data)) {
                    const records = result.data.map((item: any) => {
                        const labelField = item.name || item.title || item.nombre || item.id;
                        return {
                            label: `${labelField} (${item.id.substring(0, 8)}...)`,
                            value: item.id
                        };
                    });
                    this.availableRecords.set(records);
                } else {
                    this.availableRecords.set([]);
                }
            },
            error: () => {
                this.loadingRecords.set(false);
                this.availableRecords.set([]);
            }
        });
    }

    testingAction = signal(false);
    actionTestResult = signal<{ raw: any; rows: any[] | null } | null>(null);

    ngOnInit() {
        this.fetchCatalog();
        this.loadProjects();
    }

    private fetchCatalog() {
        this.workflowService.getDatabaseCatalog().subscribe({
            next: (catalog) => {
                if (this.node) {
                    this.applyConfigFromCatalog(catalog);
                }
            },
            error: (err) => console.error('Error fetching database catalog', err)
        });
    }

    private applyConfigFromCatalog(catalog: any[]) {
        const config = this.node.config || {};
        const savedJson = config['json'] || {};
        const savedTable = catalog.find(
            (table) =>
                table.label === config['nombre'] ||
                table.tableName === savedJson['table'] ||
                table.jsonConfig?.['table'] === savedJson['table'],
        );

        if (savedTable) {
            this.recordNombre.set(config['nombre'] || savedTable.label);
            this.recordTableValue.set(savedTable.tableName);
            this.recordFields.set([...savedTable.editableFields]);
            this.recordJson.set({ ...savedJson, table: savedTable.tableName });
        }
    }

    private loadProjects() {
        this.projectService.getProjects(1, 100).subscribe({
            next: (res: any) => {
                const projects = Array.isArray(res?.data) ? res.data : [];
                const projectOptions = projects.map((project: any) => ({
                    label: project.name,
                    value: project.id,
                }));

                const tasksTable = this.databaseCatalog().find((table) => table.tableName === 'task');
                if (tasksTable) {
                    const projectField = tasksTable.editableFields.find((field: any) => field.key === 'projectId');
                    if (projectField) {
                        projectField.type = 'select';
                        projectField.options = projectOptions;
                        projectField.placeholder = 'Selecciona un proyecto...';

                        if (this.recordTableValue() === tasksTable.tableName) {
                            this.recordFields.set([...tasksTable.editableFields]);
                        }
                    }
                }
            },
            error: (err: any) => console.error('Error cargando proyectos para dropdown', err),
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['node'] && this.node) {
            const config = this.node.config || {};
            const savedJson = config['json'] || {};
            const catalog = this.databaseCatalog();
            const savedTable =
                catalog.find(
                    (table) =>
                        table.label === config['nombre'] ||
                        table.tableName === savedJson['table'] ||
                        table.jsonConfig?.['table'] === savedJson['table'],
                ) || null;

            this.recordNombre.set(config['nombre'] || savedTable?.label || '');
            this.recordTableValue.set(savedTable?.tableName || savedJson['table'] || '');
            this.recordFields.set(savedTable ? [...savedTable.editableFields] : []);
            this.recordJson.set(savedJson);
            const op = savedJson.operation || 'READ';
            this.recordOperation.set(op);
            this.recordData.set(config['data'] || {});
            this.actionTestResult.set(null);

            if ((op === 'UPDATE' || op === 'DELETE') && this.recordTableValue()) {
                this.fetchAvailableRecords(this.recordTableValue());
            }
        }
    }

    shouldShowField(field: FieldDef): boolean {
        if (field.key !== 'eventName') return true;
        return this.recordData()['triggerType'] === 'event';
    }

    getFieldPlaceholder(field: FieldDef): string {
        const examples: Record<string, string> = {
            name: 'Ej: Mario o {{ $json.name }}',
            title: 'Ej: Mi tarea o {{ $json.title }}',
            description: 'Ej: Texto o {{ $json.description }}',
            email: 'Ej: user@mail.com o {{ $json.email }}',
            startDate: 'Ej: 2025-01-01 o {{ $json.date }}',
            endDate: 'Ej: 2025-12-31 o {{ $json.date }}',
            status: 'Ej: PENDIENTE o {{ $json.status }}',
            eventName: 'Ej: task.created o {{ $json.event }}',
            triggerType: 'Ej: http',
        };
        return examples[field.key] || `Ej: valor o {{ $json.${field.key} }}`;
    }

    private sampleValueForField(field: FieldDef): any {
        switch (field.type) {
            case 'date':
                return '';
            case 'select':
                return '';
            case 'textarea':
            case 'email':
            case 'text':
            default:
                return '';
        }
    }

    private buildDatabaseSchema(): any {
        const table = this.databaseCatalog().find((item) => item.tableName === this.recordTableValue());
        if (!table) return {};

        const row: Record<string, any> = {};

        const fieldsToUse = table.editableFields.filter((field: any) => this.shouldShowField(field));
        for (const field of fieldsToUse) {
            row[field.key] = this.sampleValueForField(field);
        }

        const metadataFields = Array.isArray(table.jsonConfig?.['fields']) ? table.jsonConfig['fields'] : [];
        for (const fieldName of metadataFields) {
            if (!(fieldName in row)) {
                row[fieldName] = '';
            }
        }

        if (this.recordOperation() === 'READ') {
            return [row];
        }

        return row;
    }

    private inferSchemaFromResult(value: any): any {
        if (Array.isArray(value)) {
            if (!value.length) return [];
            return [this.inferSchemaFromResult(value[0])];
        }

        if (value && typeof value === 'object') {
            const result: Record<string, any> = {};
            for (const key of Object.keys(value)) {
                result[key] = this.inferSchemaFromResult(value[key]);
            }
            return result;
        }

        if (typeof value === 'number') return 0;
        if (typeof value === 'boolean') return false;
        return '';
    }

    private emitConfig(schema?: any) {
        this.recordJson.update((json) => ({
            ...json,
            operation: this.recordOperation(),
            table: this.recordTableValue(),
        }));

        this.configChange.emit({
            nombre: this.recordNombre(),
            data: this.recordData(),
            json: this.recordJson(),
            __dataSchema: schema || this.buildDatabaseSchema(),
        });
    }

    onFieldChange() {
        this.emitConfig();
    }

    onTableSelect(table: any) {
        this.recordNombre.set(table.label);
        this.recordTableValue.set(table.tableName);
        this.recordFields.set([...table.editableFields]);
        this.recordJson.set({ ...table.jsonConfig, table: table.tableName, operation: this.recordOperation() });

        const emptyData: Record<string, any> = {};
        for (const field of table.editableFields) {
            if (field.key === 'triggerType') {
                emptyData[field.key] = 'http';
            } else {
                emptyData[field.key] = '';
            }
        }

        this.recordData.set(emptyData);
        this.actionTestResult.set(null);

        if (this.recordOperation() === 'UPDATE' || this.recordOperation() === 'DELETE') {
            this.fetchAvailableRecords(table.tableName);
        }

        this.emitConfig();
    }

    updateRecordField(key: string, value: any) {
        this.recordData.update((data) => {
            const next = { ...data, [key]: value };

            if (key === 'triggerType' && value !== 'event') {
                next['eventName'] = '';
            }

            return next;
        });

        this.onFieldChange();
    }

    getActionResultColumns(): string[] {
        const result = this.actionTestResult();
        if (!result?.rows?.length) return [];

        const schemaKeys = this.recordFields()
            .filter((field) => this.shouldShowField(field))
            .map((field) => field.key);

        const allCols = Object.keys(result.rows[0]);
        return schemaKeys.length > 0 ? allCols.filter((col) => schemaKeys.includes(col) || col === 'id' || col === 'createdAt') : allCols;
    }

    testActionNode() {
        const payload = {
            nombre: this.recordNombre(),
            json: {
                ...this.recordJson(),
                table: this.recordTableValue(),
                operation: this.recordOperation(),
            },
            data: this.recordData(),
        };

        this.testingAction.set(true);
        this.actionTestResult.set(null);

        this.workflowService.testDatabase(payload).subscribe({
            next: (result) => {
                this.testingAction.set(false);

                if (result.status === 'success' && result.operation === 'READ') {
                    this.actionTestResult.set({
                        raw: result,
                        rows: Array.isArray(result.data) ? result.data : [],
                    });

                    this.emitConfig(this.inferSchemaFromResult(result.data || []));

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Test exitoso',
                        detail: `Se obtuvieron ${Array.isArray(result.data) ? result.data.length : 0} registros de "${result.table}"`,
                    });
                    return;
                }

                if (result.status === 'success') {
                    this.actionTestResult.set({
                        raw: result,
                        rows: null,
                    });

                    this.emitConfig(this.inferSchemaFromResult(result.data || result));

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Test exitoso',
                        detail: `Operación ${result.operation} en "${result.table}" completada`,
                    });
                    return;
                }

                this.actionTestResult.set({
                    raw: result,
                    rows: null,
                });

                this.emitConfig(this.inferSchemaFromResult(result || {}));

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error en test',
                    detail: result.message || 'Error desconocido',
                });
            },
            error: (err) => {
                this.testingAction.set(false);

                const failedResult = {
                    status: 'failed',
                    error: err?.error?.message || err?.message || 'No se pudo conectar al backend',
                };

                this.actionTestResult.set({
                    raw: failedResult,
                    rows: null,
                });

                this.emitConfig(this.inferSchemaFromResult(failedResult));

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error de conexión',
                    detail: err?.error?.message || err?.message || 'No se pudo conectar al backend',
                });
            },
        });
    }
}