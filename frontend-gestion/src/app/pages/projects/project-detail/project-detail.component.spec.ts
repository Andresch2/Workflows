import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectDetailComponent } from './project-detail.component';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TaskStatus } from '../../../core/models/task.model';

describe('ProjectDetailComponent', () => {
  let component: ProjectDetailComponent;
  let fixture: ComponentFixture<ProjectDetailComponent>;
  let projectServiceMock: any;
  let taskServiceMock: any;
  let messageService: MessageService;
  let routerMock: any;
  let activatedRouteMock: any;

  beforeEach(async () => {
    projectServiceMock = {
      getProjectById: jasmine.createSpy('getProjectById').and.returnValue(of({ id: 'p1', name: 'Test Proj' }))
    };

    taskServiceMock = {
      getTasks: jasmine.createSpy('getTasks').and.returnValue(of({ data: [], total: 0 })),
      createTask: jasmine.createSpy('createTask').and.returnValue(of({})),
      updateTask: jasmine.createSpy('updateTask').and.returnValue(of({})),
      deleteTask: jasmine.createSpy('deleteTask').and.returnValue(of(null))
    };

    routerMock = { navigate: jasmine.createSpy('navigate') };
    activatedRouteMock = {
      snapshot: {
        params: { id: 'p1' }
      }
    };

    await TestBed.configureTestingModule({
      imports: [ProjectDetailComponent, NoopAnimationsModule],
      providers: [
        { provide: ProjectService, useValue: projectServiceMock },
        { provide: TaskService, useValue: taskServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        MessageService
      ]
    }).overrideComponent(ProjectDetailComponent, {
      set: { providers: [MessageService] }
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDetailComponent);
    component = fixture.componentInstance;
    
    messageService = fixture.debugElement.injector.get(MessageService);
    spyOn(messageService, 'add').and.callThrough();
  });

  it('debe cargar el proyecto y las tareas al iniciar', () => {
    fixture.detectChanges();
    expect(projectServiceMock.getProjectById).toHaveBeenCalledWith('p1');
    expect(taskServiceMock.getTasks).toHaveBeenCalled();
    expect(component.project()?.name).toBe('Test Proj');
  });

  it('debe cambiar el estado de una tarea correctamente', () => {
    const task = { id: 't1', title: 'Task 1', status: TaskStatus.PENDIENTE } as any;
    
    component.updateTaskStatus(task, TaskStatus.COMPLETADA);

    expect(taskServiceMock.updateTask).toHaveBeenCalledWith('t1', { status: TaskStatus.COMPLETADA });
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'success'
    }));
  });

  it('debe crear una nueva tarea correctamente', () => {
    component.projectId = 'p1';
    component.newTask = { title: 'New Task', status: TaskStatus.PENDIENTE };
    component.isEditing = false;

    component.saveTask();

    expect(taskServiceMock.createTask).toHaveBeenCalled();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'success'
    }));
  });

  it('debe eliminar una tarea tras confirmar', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    
    component.deleteTask('t1');

    expect(taskServiceMock.deleteTask).toHaveBeenCalledWith('t1');
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'success'
    }));
  });

  it('debe volver a la lista de proyectos al llamar a goBack', () => {
    component.goBack();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/projects']);
  });
});
