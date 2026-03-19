import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { CreateWorkflowDto, Workflow } from '../../../core/models/workflow.model';
import { WorkflowService } from '../../../core/services/workflow.service';

@Component({
    selector: 'app-workflow-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        DialogModule,
        SelectModule,
        InputTextModule,
        TableModule,
        TagModule,
        TextareaModule,
        ToastModule,
        ToolbarModule,
    ],
    providers: [MessageService],
    template: `
    <p-toast />
    <div class="card">
        <p-toolbar>
            <ng-template #start>
                <h2 style="margin:0">
                    <i class="pi pi-sitemap mr-2"></i>Workflows
                </h2>
            </ng-template>
            <ng-template #end>
                <p-button
                    label="Nuevo Workflow"
                    icon="pi pi-plus"
                    (onClick)="showDialog()"
                />
            </ng-template>
        </p-toolbar>

        <p-table
            [value]="workflows()"
            [rows]="10"
            [paginator]="true"
            [rowsPerPageOptions]="[5, 10, 20]"
            [loading]="loading()"
            styleClass="mt-4"
        >
            <ng-template #header>
                <tr>
                    <th>Título</th>
                    <th>Descripción</th>
                    <th>Trigger</th>
                    <th>Creado</th>
                    <th>Acciones</th>
                </tr>
            </ng-template>
            <ng-template #body let-wf>
                <tr>
                    <td>{{ wf.title }}</td>
                    <td>{{ wf.description || '—' }}</td>
                    <td>
                        <p-tag [value]="wf.triggerType" [severity]="wf.triggerType === 'webhook' ? 'info' : wf.triggerType === 'event' ? 'warn' : 'success'" />
                        @if (wf.triggerType === 'event' && wf.eventName) {
                            <div style="font-size: 0.75rem; margin-top: 0.25rem; color: #6b7280;">
                                <i class="pi pi-bolt" style="font-size: 0.7rem;"></i> {{ wf.eventName }}
                            </div>
                        }
                    </td>
                    <td>{{ wf.createdAt | date:'medium' }}</td>
                    <td>
                        <div class="flex gap-2">
                            <p-button
                                icon="pi pi-pencil"
                                [rounded]="true"
                                [text]="true"
                                (onClick)="editWorkflow(wf)"
                            />
                            <p-button
                                icon="pi pi-sitemap"
                                [rounded]="true"
                                [text]="true"
                                severity="info"
                                pTooltip="Abrir Editor"
                                (onClick)="openEditor(wf.id)"
                            />
                            <p-button
                                icon="pi pi-trash"
                                [rounded]="true"
                                [text]="true"
                                severity="danger"
                                (onClick)="deleteWorkflow(wf.id)"
                            />
                        </div>
                    </td>
                </tr>
            </ng-template>
            <ng-template #emptymessage>
                <tr>
                    <td colspan="5" class="text-center p-5">
                        <p class="text-lg" style="color:var(--text-color-secondary)">No hay workflows creados</p>
                        <p-button label="Crear primer workflow" icon="pi pi-plus" (onClick)="showDialog()" />
                    </td>
                </tr>
            </ng-template>
        </p-table>
    </div>

    <!-- Dialog Crear / Editar -->
    <p-dialog
        [(visible)]="dialogVisible"
        [modal]="true"
        [resizable]="false"
        [style]="{ width: '480px' }"
        [header]="isEditing() ? 'Editar Workflow' : 'Nuevo Workflow'"
    >
        <div class="flex flex-col gap-4 mt-2">
            <div class="flex flex-col gap-2">
                <label for="wf-title"><strong>Título</strong></label>
                <input pInputText id="wf-title" [(ngModel)]="formData.title" placeholder="Ej: Workflow de aprobación" class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
                <label for="wf-desc"><strong>Descripción</strong></label>
                <textarea pTextarea id="wf-desc" [(ngModel)]="formData.description" rows="3" placeholder="Descripción del workflow..." class="w-full"></textarea>
            </div>
            <div class="flex flex-col gap-2">
                <label for="wf-trigger"><strong>Tipo de Trigger</strong></label>
                <p-select
                    id="wf-trigger"
                    [(ngModel)]="formData.triggerType"
                    [options]="triggerOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar tipo"
                    styleClass="w-full"
                    appendTo="body"
                />
            </div>
            @if (formData.triggerType === 'event') {
                <div class="flex flex-col gap-2">
                    <label for="wf-eventname"><strong>Nombre del Evento (Ej: task.created)</strong></label>
                    <input pInputText id="wf-eventname" [(ngModel)]="formData.eventName" placeholder="project.updated, task.completed..." class="w-full" />
                </div>
            }
        </div>

        <ng-template #footer>
            <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="dialogVisible = false" />
            <p-button label="Guardar" icon="pi pi-check" (onClick)="saveWorkflow()" [loading]="saving()" />
        </ng-template>
    </p-dialog>
    `,
})
export class WorkflowListComponent implements OnInit {
    workflows = signal<Workflow[]>([]);
    loading = signal(false);
    saving = signal(false);
    dialogVisible = false;
    editingId: string | null = null;
    isEditing = signal(false);

    formData: CreateWorkflowDto = {
        title: '',
        description: '',
        triggerType: 'webhook',
        eventName: '',
    };

    triggerOptions = [
        { label: 'Webhook (URL Externa)', value: 'webhook' },
        { label: 'Petición HTTP Directa', value: 'http' },
        { label: 'Evento Interno Automático', value: 'event' },
    ];

    constructor(
        private workflowService: WorkflowService,
        private messageService: MessageService,
        private router: Router,
    ) { }

    ngOnInit() {
        this.loadWorkflows();
    }

    loadWorkflows() {
        this.loading.set(true);
        this.workflowService.getWorkflows().subscribe({
            next: (res) => {
                this.workflows.set(res.data);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los workflows' });
                this.loading.set(false);
            },
        });
    }

    showDialog() {
        this.editingId = null;
        this.isEditing.set(false);
        this.formData = { title: '', description: '', triggerType: 'webhook', eventName: '' };
        this.dialogVisible = true;
    }

    editWorkflow(wf: Workflow) {
        this.editingId = wf.id;
        this.isEditing.set(true);
        this.formData = {
            title: wf.title,
            description: wf.description || '',
            triggerType: wf.triggerType,
            eventName: wf.eventName || '',
        };
        this.dialogVisible = true;
    }

    saveWorkflow() {
        if (!this.formData.title?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'El título es obligatorio' });
            return;
        }
        this.saving.set(true);

        const obs = this.editingId
            ? this.workflowService.updateWorkflow(this.editingId, this.formData)
            : this.workflowService.createWorkflow(this.formData);

        obs.subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: this.isEditing() ? 'Workflow actualizado' : 'Workflow creado',
                });
                this.dialogVisible = false;
                this.saving.set(false);
                this.loadWorkflows();
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el workflow' });
                this.saving.set(false);
            },
        });
    }

    openEditor(id: string) {
        this.router.navigate(['/workflows', id, 'editor']);
    }

    deleteWorkflow(id: string) {
        this.workflowService.deleteWorkflow(id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Workflow eliminado' });
                this.loadWorkflows();
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el workflow' });
            },
        });
    }
}
