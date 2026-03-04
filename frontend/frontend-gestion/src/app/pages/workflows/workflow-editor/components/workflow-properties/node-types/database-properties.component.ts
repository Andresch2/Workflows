import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { EditorNode } from '../../../../../../core/models/workflow.model';
import { ProjectService } from '../../../../../../core/services/project.service';
import { WorkflowService } from '../../../../../../core/services/workflow.service';

export interface FieldDef {
    key: string;         // nombre del campo
    label: string;       // etiqueta visible
    type: 'text' | 'email' | 'textarea' | 'date' | 'select'; // tipo de input
    placeholder?: string;
    options?: any[];  // para tipo select
}

export interface TableRecord {
    label: string;
    value: string;
    endpoint: string;
    editableFields: FieldDef[];
    json: Record<string, any>; // esquema interno
}

const DATABASE_TABLES: TableRecord[] = [
    {
        label: 'Proyectos',
        value: 'project',
        endpoint: '/api/v1/projects',
        editableFields: [
            { key: 'name', label: 'Nombre del proyecto', type: 'text', placeholder: 'Mi Proyecto' },
            { key: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Descripción del proyecto...' },
            { key: 'startDate', label: 'Fecha de inicio', type: 'date' },
            { key: 'endDate', label: 'Fecha de fin', type: 'date' },
        ],
        json: { table: 'project', fields: ['id', 'name', 'description', 'startDate', 'endDate', 'createdAt'] },
    },
    {
        label: 'Tareas',
        value: 'task',
        endpoint: '/api/v1/tasks',
        editableFields: [
            { key: 'title', label: 'Título', type: 'text', placeholder: 'Nueva tarea' },
            { key: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Descripción de la tarea...' },
            { key: 'status', label: 'Estado', type: 'select', options: ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA'] },
            { key: 'projectId', label: 'ID del Proyecto', type: 'text', placeholder: 'uuid del proyecto' },
        ],
        json: { table: 'task', fields: ['id', 'title', 'description', 'status', 'projectId', 'createdAt'] },
    },
    {
        label: 'Workflows',
        value: 'workflow',
        endpoint: '/api/v1/workflows',
        editableFields: [
            { key: 'title', label: 'Título', type: 'text', placeholder: 'Mi Workflow' },
            { key: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Descripción...' },
            { key: 'triggerType', label: 'Tipo de trigger', type: 'select', options: ['http', 'webhook'] },
        ],
        json: { table: 'workflow', fields: ['id', 'title', 'description', 'triggerType', 'createdAt'] },
    },
];

@Component({
    selector: 'app-database-properties',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, TextareaModule, SelectModule, ButtonModule, AutoCompleteModule],
    template: `
    <div class="form-section">
        <h5><i class="pi pi-database"></i> Configuración Database</h5>

        <!-- Tabla -->
        <div class="form-group">
            <label>Tabla</label>
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.6rem;">
                @for (table of databaseTables; track table.value) {
                <span (click)="onTableSelect(table)"
                    [style.background]="recordNombre() === table.label ? '#3b82f6' : '#1e293b'"
                    [style.color]="recordNombre() === table.label ? '#fff' : '#94a3b8'" style="display: inline-flex; align-items: center; gap: 0.3rem;
                            padding: 0.25rem 0.65rem; border-radius: 20px; font-size: 0.78rem;
                            cursor: pointer; border: 1px solid #334155; transition: all 0.15s; user-select: none;">
                    <i class="pi pi-table" style="font-size: 0.7rem;"></i>{{ table.label }}
                </span>
                }
            </div>
        </div>

        <!-- Operación -->
        <div class="form-group mt-3">
            <label>Operación</label>
            <p-select [options]="operations" [ngModel]="recordOperation()"
                (ngModelChange)="recordOperation.set($event); onFieldChange()" placeholder="Selecciona una operación"
                styleClass="w-full" appendTo="body" />
        </div>

        @if (recordFields().length > 0 && recordOperation() === 'CREATE') {
        <div class="form-group mt-3">
            <label style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
                <i class="pi pi-list" style="color: #3b82f6; font-size: 0.85rem;"></i>
                Datos del registro (CREATE)
            </label>
            <div style="display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.4rem;">
                @for (field of recordFields(); track field.key) {
                <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                    <label style="font-size: 0.78rem; color: #94a3b8; font-weight: 500;">
                        {{ field.label }}
                        <span style="font-family: monospace; color: #475569; font-size: 0.7rem; margin-left: 0.3rem;">({{ field.key }})</span>
                    </label>

                    @if (field.type === 'textarea') {
                    <textarea pTextarea [ngModel]="recordData()[field.key] || ''"
                        (ngModelChange)="updateRecordField(field.key, $event)"
                        [placeholder]="field.placeholder || ''" rows="2" class="w-full"
                        style="font-size: 0.85rem;"></textarea>
                    } @else if (field.type === 'select') {
                    <p-select [options]="field.options || []" [ngModel]="recordData()[field.key] || ''"
                        (ngModelChange)="updateRecordField(field.key, $event)"
                        [placeholder]="'Selecciona ' + field.label" styleClass="w-full" appendTo="body" />
                    } @else {
                    <input pInputText
                        [type]="field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'"
                        [ngModel]="recordData()[field.key] || ''"
                        (ngModelChange)="updateRecordField(field.key, $event)"
                        [placeholder]="field.placeholder || ''" class="w-full" style="font-size: 0.85rem;" />
                    }
                </div>
                }
            </div>
        </div>
        }

        <div class="form-group mt-3">
            <p-button label="Probar Database" icon="pi pi-play" size="small" severity="secondary"
                (onClick)="testActionNode()" [loading]="testingAction()" [disabled]="!recordJson()['table']" />
        </div>

        <!-- Resultados -->
        @if (actionTestResult()) {
        <div class="form-group mt-3">
            @if (actionTestResult()!.rows && actionTestResult()!.rows!.length > 0) {
            <label>Resultado ({{ actionTestResult()!.rows!.length }} registros)</label>
            <div style="overflow-x: auto; margin-top: 0.5rem; border-radius: 6px; border: 1px solid #334155;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; font-family: monospace;">
                    <thead>
                        <tr style="background: #1e293b; color: #94a3b8;">
                            @for (col of getActionResultColumns(); track col) {
                            <th style="padding: 0.4rem 0.75rem; text-align: left; border-bottom: 1px solid #334155;">{{ col }}</th>
                            }
                        </tr>
                    </thead>
                    <tbody>
                        @for (row of actionTestResult()!.rows!; track $index) {
                        <tr [style.background]="$index % 2 === 0 ? '#0f172a' : '#1e293b'">
                            @for (col of getActionResultColumns(); track col) {
                            <td style="padding: 0.35rem 0.75rem; color: #e2e8f0; border-bottom: 1px solid #1e293b;">{{ row[col] }}</td>
                            }
                        </tr>
                        }
                    </tbody>
                </table>
            </div>
            } @else {
            <label>Respuesta</label>
            <textarea pTextarea [value]="actionTestResult()!.raw | json" readonly rows="6" class="w-full"
                style="background-color: #1e293b; color: #e2e8f0; font-family: monospace; font-size: 0.82rem; border-radius: 6px;"></textarea>
            }
        </div>
        }
    </div>
  `
})
export class DatabasePropertiesComponent implements OnInit, OnChanges {
    @Input({ required: true }) node!: EditorNode;
    @Input() availableAncestors: EditorNode[] = [];
    @Output() configChange = new EventEmitter<Record<string, any>>();

    workflowService = inject(WorkflowService);
    messageService = inject(MessageService);
    projectService = inject(ProjectService);

    databaseTables = DATABASE_TABLES;
    operations = [
        { label: 'Leer Registros (READ)', value: 'READ' },
        { label: 'Crear Registro (CREATE)', value: 'CREATE' },
    ];

    recordNombre = signal('');
    recordOperation = signal('READ');
    recordFields = signal<FieldDef[]>([]);
    recordData = signal<Record<string, string>>({});
    recordJson = signal<Record<string, any>>({});

    testingAction = signal(false);
    actionTestResult = signal<{ raw: any; rows: any[] | null } | null>(null);

    ngOnInit() {
        this.loadProjects();
    }

    private loadProjects() {
        this.projectService.getProjects(1, 100).subscribe({
            next: (res: any) => {
                const projects = res.data;
                const projectOptions = projects.map((p: any) => ({ label: p.name, value: p.id }));

                const tasksTable = this.databaseTables.find(t => t.value === 'tasks');
                if (tasksTable) {
                    const projectField = tasksTable.editableFields.find(f => f.key === 'projectId');
                    if (projectField) {
                        projectField.type = 'select';
                        projectField.options = projectOptions;
                        projectField.placeholder = 'Selecciona un proyecto...';
                        if (this.recordNombre() === tasksTable.label) {
                            this.recordFields.set([...tasksTable.editableFields]);
                        }
                    }
                }
            },
            error: (err: any) => console.error('Error cargando proyectos para dropdown', err)
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['node']) {
            const config = this.node.config || {};
            this.recordNombre.set(config['nombre'] || '');
            this.recordData.set(config['data'] || {});

            const jsonStr = config['json'] || {};
            this.recordJson.set(jsonStr);
            this.recordOperation.set(jsonStr.operation || 'READ');

            const savedTable = this.databaseTables.find(t => t.label === config['nombre'] || t.json['table'] === jsonStr['table']);
            this.recordFields.set(savedTable ? savedTable.editableFields : []);
            this.actionTestResult.set(null);
        }
    }

    onFieldChange() {
        this.recordJson.update(json => ({
            ...json,
            operation: this.recordOperation()
        }));

        this.configChange.emit({
            nombre: this.recordNombre(),
            data: this.recordData(),
            json: this.recordJson(),
        });
    }

    onTableSelect(table: TableRecord) {
        this.recordNombre.set(table.label);
        this.recordFields.set(table.editableFields);
        this.recordJson.set({ ...table.json, operation: this.recordOperation() });

        const emptyData: Record<string, string> = {};
        table.editableFields.forEach(f => { emptyData[f.key] = ''; });
        this.recordData.set(emptyData);

        this.actionTestResult.set(null);
        this.onFieldChange();
    }

    updateRecordField(key: string, value: string) {
        this.recordData.update(d => ({ ...d, [key]: value }));
        this.onFieldChange();
    }

    getActionResultColumns(): string[] {
        const result = this.actionTestResult();
        if (!result?.rows?.length) return [];
        const schemaKeys = this.recordFields().map(f => f.key);
        const allCols = Object.keys(result.rows[0]);
        return schemaKeys.length > 0 ? allCols.filter(c => schemaKeys.includes(c)) : allCols;
    }

    testActionNode() {
        const payload = {
            nombre: this.recordNombre(),
            json: this.recordJson(),
            data: this.recordData(),
        };

        this.actionTestResult.set(null);

        this.workflowService.testDatabase(payload).subscribe({
            next: (result) => {
                if (result.status === 'success' && result.operation === 'READ') {
                    this.actionTestResult.set({ raw: result, rows: result.data });
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Test exitoso',
                        detail: `Se obtuvieron ${Array.isArray(result.data) ? result.data.length : 0} registros de "${result.table}"`,
                    });
                } else if (result.status === 'success') {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Test exitoso',
                        detail: `Operación ${result.operation} en "${result.table}" completada`,
                    });
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error en test',
                        detail: result.message || 'Error desconocido',
                    });
                }
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error de conexión',
                    detail: err.error?.message || err.message || 'No se pudo conectar al backend',
                });
            },
        });
    }
}
