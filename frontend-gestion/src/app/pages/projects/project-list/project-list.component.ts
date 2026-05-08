import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CreateProjectDto, Project } from '../../../core/models/project.model';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="card">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-3xl font-bold m-0">Proyectos</h2>
        <p-button
          label="Nuevo Proyecto"
          icon="pi pi-plus"
          (onClick)="showDialog()">
        </p-button>
      </div>

      <p-table
        [value]="projects()"
        [loading]="loading()"
        [paginator]="true"
        [rows]="rows"
        [first]="first"
        [totalRecords]="totalRecords()"
        [lazy]="true"
        (onPage)="onPageChange($event)"
        styleClass="p-datatable-striped">

        <ng-template #header>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Fecha Inicio</th>
            <th>Fecha Fin</th>
            <th style="inline-size: 180px">Acciones</th>
          </tr>
        </ng-template>

        <ng-template #body let-project>
          <tr>
            <td>{{ project.name }}</td>
            <td>{{ project.description || '-' }}</td>
            <td>{{ project.startDate ? (project.startDate | date:'dd/MM/yyyy':'UTC') : '-' }}</td>
            <td>{{ project.endDate ? (project.endDate | date:'dd/MM/yyyy':'UTC') : '-' }}</td>
            <td>
              <p-button
                icon="fa fa-tasks"
                [text]="true"
                [rounded]="true"
                severity="info"
                (onClick)="viewProject(project.id)"
                pTooltip="Tareas">
              </p-button>

              <p-button
                icon="pi pi-pencil"
                [text]="true"
                [rounded]="true"
                severity="warn"
                (onClick)="editProject(project)"
                pTooltip="Editar">
              </p-button>

              <p-button
                icon="pi pi-trash"
                [text]="true"
                [rounded]="true"
                severity="danger"
                (onClick)="deleteProject(project.id)"
                pTooltip="Eliminar">
              </p-button>
            </td>
          </tr>
        </ng-template>

        <ng-template #emptymessage>
          <tr>
            <td colspan="5" class="text-center py-8">
              <i class="pi pi-inbox text-4xl text-muted-color mb-4 block"></i>
              <p class="text-muted-color">No hay proyectos creados</p>
            </td>
          </tr>
        </ng-template>

        <ng-template #summary>
          <div class="flex align-items-center justify-content-between">
            En total hay {{totalRecords()}} proyectos.
          </div>
        </ng-template>
      </p-table>
    </div>

    <p-dialog
      [(visible)]="displayDialog"
      [modal]="true"
      [style]="{ width: '600px' }"
      [header]="isEditing() ? 'Editar Proyecto' : 'Nuevo Proyecto'">

      <div class="flex flex-col gap-4">

        <div>
          <label class="block mb-2 font-medium">Nombre *</label>
          <input
            pInputText
            [(ngModel)]="newProject.name"
            class="w-full"
            placeholder="Nombre del proyecto" />
        </div>

        <div>
          <label class="block mb-2 font-medium">Descripción</label>
          <input
            pInputText
            [(ngModel)]="newProject.description"
            class="w-full"
            placeholder="Descripción del proyecto" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block mb-2 font-medium">Fecha Inicio</label>
            <input
              type="date"
              pInputText
              [(ngModel)]="newProject.startDate"
              class="w-full" />
          </div>

          <div>
            <label class="block mb-2 font-medium">Fecha Fin</label>
            <input
              type="date"
              pInputText
              [(ngModel)]="newProject.endDate"
              class="w-full" />
          </div>
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
          (onClick)="saveProject()">
        </p-button>
      </ng-template>
    </p-dialog>
  `
})
export class ProjectListComponent implements OnInit {

  projects = signal<Project[]>([]);
  totalRecords = signal(0);
  hasNextPage = signal(false);
  loading = signal(false);
  saving = signal(false);

  rows = 10;
  first = 0;

  displayDialog = false;
  isEditing = signal(false);
  editingProjectId: string | null = null;

  newProject: any = {
    name: '',
    description: null,
    startDate: null,
    endDate: null
  };

  constructor(
    private projectService: ProjectService,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects(page: number = (this.first / this.rows) + 1, limit: number = this.rows) {
    this.loading.set(true);
    this.projectService.getProjects(page, limit).subscribe({
      next: res => {
        this.projects.set(res.data);
        this.totalRecords.set(res.total || res.data.length);
        this.hasNextPage.set(res.hasNextPage);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los proyectos'
        });
      }
    });
  }

  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
    const page = (event.first / event.rows) + 1;
    this.loadProjects(page, event.rows);
  }

  nextPage() {
    if (this.hasNextPage()) {
      this.first += this.rows;
      const page = (this.first / this.rows) + 1;
      this.loadProjects(page, this.rows);
    }
  }

  showDialog() {
    this.isEditing.set(false);
    this.editingProjectId = null;
    this.resetForm();
    this.displayDialog = true;
  }

  editProject(project: Project) {
    this.isEditing.set(true);
    this.editingProjectId = project.id;

    this.newProject = {
      name: project.name,
      description: project.description,
      startDate: project.startDate ? project.startDate.substring(0, 10) : null,
      endDate: project.endDate ? project.endDate.substring(0, 10) : null
    };

    this.displayDialog = true;
  }

  hideDialog() {
    this.displayDialog = false;
    this.resetForm();
  }

  saveProject() {
    if (!this.newProject.name) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'El nombre es obligatorio'
      });
      return;
    }

    this.saving.set(true);

    const projectData = {
      name: this.newProject.name,
      description: this.newProject.description,
      startDate: this.newProject.startDate || null,
      endDate: this.newProject.endDate || null
    };

    const request = this.isEditing() && this.editingProjectId
      ? this.projectService.updateProject(this.editingProjectId, projectData)
      : this.projectService.createProject(projectData as CreateProjectDto);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.hideDialog();
        this.loadProjects();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: this.isEditing()
            ? 'Proyecto actualizado correctamente'
            : 'Proyecto creado correctamente'
        });
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el proyecto'
        });
      }
    });
  }

  viewProject(id: string) {
    this.router.navigate(['/projects', id]);
  }

  deleteProject(id: string) {
    if (!confirm('¿Estás seguro de eliminar este proyecto?')) return;

    this.projectService.deleteProject(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Proyecto eliminado'
        });
        this.loadProjects();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar'
        });
      }
    });
  }

  private resetForm() {
    this.newProject = {
      name: '',
      description: null,
      startDate: null,
      endDate: null
    };
  }
}
