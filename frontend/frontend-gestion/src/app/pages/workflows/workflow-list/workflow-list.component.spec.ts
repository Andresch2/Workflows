import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkflowListComponent } from './workflow-list.component';
import { WorkflowService } from '../../../core/services/workflow.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('WorkflowListComponent', () => {
    let component: WorkflowListComponent;
    let fixture: ComponentFixture<WorkflowListComponent>;
    let workflowServiceMock: any;
    let messageService: MessageService;
    let routerMock: any;

    beforeEach(async () => {
        workflowServiceMock = {
            getWorkflows: jasmine.createSpy('getWorkflows').and.returnValue(of({ data: [], hasNextPage: false })),
            createWorkflow: jasmine.createSpy('createWorkflow').and.returnValue(of({})),
            updateWorkflow: jasmine.createSpy('updateWorkflow').and.returnValue(of({})),
            deleteWorkflow: jasmine.createSpy('deleteWorkflow').and.returnValue(of(null))
        };

        routerMock = {
            navigate: jasmine.createSpy('navigate')
        };

        await TestBed.configureTestingModule({
            imports: [WorkflowListComponent, NoopAnimationsModule],
            providers: [
                { provide: WorkflowService, useValue: workflowServiceMock },
                { provide: Router, useValue: routerMock },
                MessageService // Proveedor global
            ]
        }).overrideComponent(WorkflowListComponent, {
            // Obligamos al componente a usar el MessageService real para que Toast no falle
            set: { providers: [MessageService] }
        }).compileComponents();

        fixture = TestBed.createComponent(WorkflowListComponent);
        component = fixture.componentInstance;
        
        // Obtenemos la instancia real de MessageService que usa el componente y le ponemos un espía
        messageService = fixture.debugElement.injector.get(MessageService);
        spyOn(messageService, 'add').and.callThrough();
    });

    it('debe crearse correctamente', () => {
        expect(component).toBeTruthy();
    });

    it('debe cargar los workflows al inicializar (ngOnInit)', () => {
        const mockWfs = [{ id: '1', title: 'Test' }];
        workflowServiceMock.getWorkflows.and.returnValue(of({ data: mockWfs, hasNextPage: false }));

        fixture.detectChanges(); 

        expect(workflowServiceMock.getWorkflows).toHaveBeenCalled();
        expect(component.workflows().length).toBe(1);
        expect(component.workflows()[0].title).toBe('Test');
    });

    it('debe mostrar error si loadWorkflows falla', () => {
        workflowServiceMock.getWorkflows.and.returnValue(throwError(() => new Error('Error')));

        fixture.detectChanges();

        expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
            severity: 'error',
            summary: 'Error'
        }));
    });

    it('debe abrir el diálogo de creación correctamente', () => {
        component.showDialog();
        expect(component.dialogVisible).toBeTrue();
        expect(component.isEditing()).toBeFalse();
        expect(component.formData.title).toBe('');
    });

    it('debe llamar a createWorkflow al guardar un nuevo workflow', () => {
        component.formData = { title: 'Nuevo WF', triggerType: 'webhook' };
        component.editingId = null;

        component.saveWorkflow();

        expect(workflowServiceMock.createWorkflow).toHaveBeenCalled();
        expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
            severity: 'success'
        }));
    });

    it('debe navegar al editor al llamar a openEditor', () => {
        component.openEditor('123');
        expect(routerMock.navigate).toHaveBeenCalledWith(['/workflows', '123', 'editor']);
    });

    it('debe eliminar un workflow y recargar la lista', () => {
        component.deleteWorkflow('123');

        expect(workflowServiceMock.deleteWorkflow).toHaveBeenCalledWith('123');
        expect(workflowServiceMock.getWorkflows).toHaveBeenCalled();
    });
});
