import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Project } from '../../../core/models/project.model';
import { CreateTaskDto, Task, TaskStatus } from '../../../core/models/task.model';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    TagModule,
    TooltipModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="card">
      <div class="flex justify-between items-center mb-6">
        <div>
          <p-button 
            icon="pi pi-arrow-left" 
            [text]="true"
            (onClick)="goBack()"
            label="Volver">
          </p-button>
          <h2 class="text-3xl font-bold m-0 mt-2">{{ project()?.name }}</h2>
          <p class="text-muted-color mt-2">{{ project()?.description }}</p>
        </div>
        <p-button 
          label="Nueva Tarea" 
          icon="pi pi-plus" 
          (onClick)="showDialog()">
        </p-button>
      </div>

      <div class="mb-4">
        <h3 class="text-xl font-semibold m-0">Tareas</h3>
      </div>

      <p-table 
        [value]="tasks()" 
        [loading]="loading()"
        styleClass="p-datatable-striped">
        <ng-template #header>
          <tr>
            <th>Título</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th style="inline-size: 150px">Acciones</th>
          </tr>
        </ng-template>
        <ng-template #body let-task>
          <tr>
            <td>{{ task.title }}</td>
            <td>{{ task.description || '-' }}</td>
            <td>
              <p-tag 
                [value]="getStatusLabel(task.status)" 
                [severity]="getStatusSeverity(task.status)">
              </p-tag>
            </td>
            <td>
              <p-button 
                icon="pi pi-check" 
                [text]="true" 
                [rounded]="true" 
                severity="success"
                *ngIf="task.status !== 'COMPLETADA'"
                (onClick)="updateTaskStatus(task, 'COMPLETADA')"
                pTooltip="Completar">
              </p-button>
              <p-button 
                icon="pi pi-pencil" 
                [text]="true" 
                [rounded]="true" 
                severity="warn"
                (onClick)="showDialog(task)"
                pTooltip="Editar">
              </p-button>
              <p-button 
                icon="pi pi-trash" 
                [text]="true" 
                [rounded]="true" 
                severity="danger"
                (onClick)="deleteTask(task.id)"
                pTooltip="Eliminar">
              </p-button>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="4" class="text-center py-8">
              <i class="pi pi-inbox text-4xl text-muted-color mb-4 block"></i>
              <p class="text-muted-color">No hay tareas en este proyecto</p>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>


    <p-dialog 
      [(visible)]="displayDialog" 
      [modal]="true" 
      [style]="{width: '600px'}"
      [header]="isEditing ? 'Editar Tarea' : 'Nueva Tarea'">
      <div class="flex flex-col gap-4">
        <div>
          <label for="title" class="block mb-2 font-medium">Título *</label>
          <input 
            pInputText 
            id="title" 
            [(ngModel)]="newTask.title" 
            class="w-full" 
            placeholder="Título de la tarea" />
        </div>

        <div>
          <label for="description" class="block mb-2 font-medium">Descripción</label>
          <input 
            pInputText 
            id="description" 
            [(ngModel)]="newTask.description" 
            class="w-full"
            placeholder="Descripción de la tarea" />
        </div>

        <div>
          <label for="status" class="block mb-2 font-medium">Estado</label>
          <select 
            id="status"
            [(ngModel)]="newTask.status" 
            class="w-full p-3 border border-surface-300 rounded-lg">
            <option [value]="TaskStatus.PENDIENTE">Pendiente</option>
            <option [value]="TaskStatus.EN_PROGRESO">En Progreso</option>
            <option [value]="TaskStatus.COMPLETADA">Completada</option>
          </select>
        </div>
      </div>

      <ng-template #footer>
        <p-button 
          label="Cancelar" 
          severity="secondary" 
          (onClick)="hideDialog()">
        </p-button>
        <p-button 
          label="Guardar" 
          [loading]="saving()"
          (onClick)="saveTask()">
        </p-button>
      </ng-template>
    </p-dialog>
  `,
  styles: []
})
export class ProjectDetailComponent implements OnInit {
  project = signal<Project | null>(null);
  tasks = signal<Task[]>([]);
  loading = signal(false);
  displayDialog = false;
  isEditing = false;
  editingTaskId: string | null = null;
  saving = signal(false);



  projectId: string = '';

  TaskStatus = TaskStatus;

  newTask: any = {
    title: '',
    description: null,
    status: TaskStatus.PENDIENTE
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private taskService: TaskService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.projectId = this.route.snapshot.params['id'];
    this.loadProject();
    this.loadTasks();
  }

  loadProject() {
    this.loading.set(true);
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (project) => {
        this.project.set(project);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error:', error);
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el proyecto'
        });
        this.router.navigate(['/projects']);
      }
    });
  }

  loadTasks() {
    this.taskService.getTasks(1, 100, this.projectId).subscribe({
      next: (response) => {
        this.tasks.set(response.data);
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }

  showDialog(task?: Task) {
    if (task) {
      this.isEditing = true;
      this.editingTaskId = task.id;
      this.newTask = {
        title: task.title,
        description: task.description,
        status: task.status
      };
    } else {
      this.isEditing = false;
      this.editingTaskId = null;
      this.resetForm();
    }
    this.displayDialog = true;
  }

  hideDialog() {
    this.displayDialog = false;
    this.resetForm();
  }

  saveTask() {
    if (!this.newTask.title) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'El título es obligatorio'
      });
      return;
    }

    this.saving.set(true);

    if (this.isEditing && this.editingTaskId) {
      this.taskService.updateTask(this.editingTaskId, this.newTask).subscribe({
        next: () => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Tarea actualizada correctamente'
          });
          this.hideDialog();
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error:', error);
          this.saving.set(true);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la tarea'
          });
        }
      });
    } else {
      const taskData: CreateTaskDto = {
        title: this.newTask.title,
        description: this.newTask.description,
        status: this.newTask.status,
        projectId: this.projectId
      };

      this.taskService.createTask(taskData).subscribe({
        next: () => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Tarea creada correctamente'
          });
          this.hideDialog();
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error:', error);
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la tarea'
          });
        }
      });
    }
  }

  updateTaskStatus(task: Task, newStatus: any) {
    this.taskService.updateTask(task.id, { status: newStatus }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Estado actualizado'
        });
        this.loadTasks();
      },
      error: (error) => {
        console.error('Error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar'
        });
      }
    });
  }

  deleteTask(id: string) {
    if (confirm('¿Eliminar esta tarea?')) {
      this.taskService.deleteTask(id).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Tarea eliminada'
          });
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar'
          });
        }
      });
    }
  }

  getStatusSeverity(status: TaskStatus): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case TaskStatus.COMPLETADA:
        return 'success';
      case TaskStatus.EN_PROGRESO:
        return 'warn';
      case TaskStatus.PENDIENTE:
        return 'danger';
      default:
        return 'info';
    }
  }

  getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.COMPLETADA:
        return 'Completada';
      case TaskStatus.EN_PROGRESO:
        return 'En Progreso';
      case TaskStatus.PENDIENTE:
        return 'Pendiente';
      default:
        return status;
    }
  }

  goBack() {
    this.router.navigate(['/projects']);
  }

  private resetForm() {
    this.isEditing = false;
    this.editingTaskId = null;
    this.newTask = {
      title: '',
      description: null,
      status: TaskStatus.PENDIENTE
    };
  }

}
