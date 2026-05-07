import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectListComponent } from './project-list.component';
import { ProjectService } from '../../../core/services/project.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;
  let projectServiceMock: any;
  let messageService: MessageService;
  let routerMock: any;

  beforeEach(async () => {
    projectServiceMock = {
      getProjects: jasmine.createSpy('getProjects').and.returnValue(of({ data: [], total: 0, hasNextPage: false })),
      createProject: jasmine.createSpy('createProject').and.returnValue(of({})),
      updateProject: jasmine.createSpy('updateProject').and.returnValue(of({})),
      deleteProject: jasmine.createSpy('deleteProject').and.returnValue(of(null))
    };

    routerMock = {
      navigate: jasmine.createSpy('navigate')
    };

    await TestBed.configureTestingModule({
      imports: [ProjectListComponent, NoopAnimationsModule],
      providers: [
        { provide: ProjectService, useValue: projectServiceMock },
        { provide: Router, useValue: routerMock },
        MessageService
      ]
    }).overrideComponent(ProjectListComponent, {
      set: { providers: [MessageService] }
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    
    messageService = fixture.debugElement.injector.get(MessageService);
    spyOn(messageService, 'add').and.callThrough();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar los proyectos al iniciar', () => {
    const mockRes = { data: [{ id: '1', name: 'Project 1' }], total: 1, hasNextPage: false };
    projectServiceMock.getProjects.and.returnValue(of(mockRes));

    fixture.detectChanges();

    expect(projectServiceMock.getProjects).toHaveBeenCalled();
    expect(component.projects().length).toBe(1);
  });

  it('debe abrir el diálogo para nuevo proyecto', () => {
    component.showDialog();
    expect(component.displayDialog).toBeTrue();
    expect(component.isEditing()).toBeFalse();
  });

  it('debe guardar un nuevo proyecto correctamente', () => {
    component.newProject = { name: 'New Project', description: 'Desc' };
    component.displayDialog = true;

    component.saveProject();

    expect(projectServiceMock.createProject).toHaveBeenCalled();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'success'
    }));
    expect(component.displayDialog).toBeFalse();
  });

  it('debe eliminar un proyecto tras confirmar', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    
    component.deleteProject('123');

    expect(projectServiceMock.deleteProject).toHaveBeenCalledWith('123');
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'success'
    }));
  });

  it('debe navegar al detalle del proyecto', () => {
    component.viewProject('123');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/projects', '123']);
  });
});
