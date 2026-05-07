import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkflowEditorComponent } from './workflow-editor.component';
import { WorkflowService } from '../../../core/services/workflow.service';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { WorkflowNodeType } from '../../../core/models/workflow.model';

describe('WorkflowEditorComponent', () => {
    let component: WorkflowEditorComponent;
    let fixture: ComponentFixture<WorkflowEditorComponent>;
    let workflowServiceMock: any;
    let messageService: MessageService;
    let routerMock: any;
    let activatedRouteMock: any;

    beforeEach(async () => {
        workflowServiceMock = {
            getWorkflowById: jasmine.createSpy('getWorkflowById').and.returnValue(of({ id: 'wf1', title: 'Test' })),
            getNodesByWorkflowId: jasmine.createSpy('getNodesByWorkflowId').and.returnValue(of([])),
            getConnectionsByWorkflowId: jasmine.createSpy('getConnectionsByWorkflowId').and.returnValue(of([])),
            createNode: jasmine.createSpy('createNode').and.returnValue(of({ id: 'new-node' })),
            updateNode: jasmine.createSpy('updateNode').and.returnValue(of({})),
            deleteNode: jasmine.createSpy('deleteNode').and.returnValue(of(null)),
            createConnection: jasmine.createSpy('createConnection').and.returnValue(of({})),
            executeWorkflowSync: jasmine.createSpy('executeWorkflowSync').and.returnValue(of({ results: {} })),
            getExecutions: jasmine.createSpy('getExecutions').and.returnValue(of({ data: [], hasNextPage: false })),
            getDatabaseCatalog: jasmine.createSpy('getDatabaseCatalog').and.returnValue(of([]))
        };

        routerMock = { navigate: jasmine.createSpy('navigate') };
        activatedRouteMock = {
            snapshot: {
                paramMap: {
                    get: (key: string) => (key === 'id' ? 'wf1' : null)
                }
            }
        };

        await TestBed.configureTestingModule({
            imports: [WorkflowEditorComponent, NoopAnimationsModule],
            providers: [
                { provide: WorkflowService, useValue: workflowServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: ActivatedRoute, useValue: activatedRouteMock },
                MessageService
            ]
        }).overrideComponent(WorkflowEditorComponent, {
            set: { providers: [MessageService] }
        }).compileComponents();

        fixture = TestBed.createComponent(WorkflowEditorComponent);
        component = fixture.componentInstance;
        
        messageService = fixture.debugElement.injector.get(MessageService);
        spyOn(messageService, 'add').and.callThrough();
    });

    it('debe cargar el workflow y sus nodos al inicializar', () => {
        fixture.detectChanges();
        expect(workflowServiceMock.getWorkflowById).toHaveBeenCalledWith('wf1');
        expect(workflowServiceMock.getNodesByWorkflowId).toHaveBeenCalledWith('wf1');
    });

    it('debe agregar un nodo al procesar un drop en el canvas', () => {
        const dropEvent = {
            event: {
                preventDefault: jasmine.createSpy('preventDefault'),
                dataTransfer: {
                    getData: (key: string) => (key === 'node-type' ? WorkflowNodeType.HTTP : '')
                }
            } as any,
            x: 100,
            y: 200
        };

        component.onCanvasDrop(dropEvent);

        const currentNodes = component.nodes();
        expect(currentNodes.length).toBe(1);
        expect(currentNodes[0].type).toBe(WorkflowNodeType.HTTP);
        expect(currentNodes[0].x).toBe(100);
    });

    it('no debe permitir más de un nodo TRIGGER', () => {
        // Simulamos que ya hay un trigger
        component.nodes.set([{ id: 't1', type: WorkflowNodeType.TRIGGER } as any]);

        const dropEvent = {
            event: {
                preventDefault: jasmine.createSpy('preventDefault'),
                dataTransfer: {
                    getData: (key: string) => (key === 'node-type' ? WorkflowNodeType.TRIGGER : '')
                }
            } as any,
            x: 100,
            y: 200
        };

        component.onCanvasDrop(dropEvent);

        expect(component.nodes().length).toBe(1); 
        expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
            severity: 'warn',
            summary: 'Atención'
        }));
    });

    it('debe seleccionar un nodo correctamente', () => {
        const node = { id: 'n1', name: 'Node 1' } as any;
        component.nodes.set([node]);
        
        component.selectNode(node);

        expect(component.selectedNode()?.id).toBe('n1');
        expect(component.nodes()[0].selected).toBeTrue();
    });

    it('debe marcar nodos como eliminados localmente antes de guardar', () => {
        const node = { id: 'real-id', name: 'Node 1' } as any;
        component.nodes.set([node]);

        component.deleteNode(node);

        expect(component.nodes().length).toBe(0);
        expect(component['deletedNodeIds']).toContain('real-id');
    });

    it('debe realizar el ordenamiento topológico correctamente para la simulación', () => {
        const nodes = [
            { id: 'n1', name: 'Start' },
            { id: 'n2', name: 'End' }
        ] as any[];
        const connections = [
            { sourceNodeId: 'n1', targetNodeId: 'n2' }
        ] as any[];

        const sorted = component['topologicalSort'](nodes, connections);

        expect(sorted[0].id).toBe('n1');
        expect(sorted[1].id).toBe('n2');
    });
});
