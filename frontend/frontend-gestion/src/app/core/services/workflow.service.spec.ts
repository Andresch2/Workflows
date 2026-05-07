import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WorkflowService } from './workflow.service';
import { environment } from '@/environments/environment';
import { CreateWorkflowDto, Workflow } from '../models/workflow.model';

describe('WorkflowService', () => {
    let service: WorkflowService;
    let httpMock: HttpTestingController;
    const apiUrl = `${environment.apiUrl}/workflows`;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [WorkflowService]
        });
        service = TestBed.inject(WorkflowService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('debe crearse correctamente', () => {
        expect(service).toBeTruthy();
    });

    describe('CRUD de Workflows', () => {
        it('debe obtener la lista de workflows (getWorkflows)', () => {
            const mockResponse = {
                data: [{ id: '1', title: 'Workflow 1', triggerType: 'webhook' } as Workflow],
                hasNextPage: false
            };

            service.getWorkflows(1, 10).subscribe(res => {
                expect(res.data.length).toBe(1);
                expect(res.data[0].title).toBe('Workflow 1');
            });

            const req = httpMock.expectOne(`${apiUrl}?page=1&limit=10`);
            expect(req.request.method).toBe('GET');
            req.flush(mockResponse);
        });

        it('debe obtener un workflow por ID (getWorkflowById)', () => {
            const mockWf = { id: '123', title: 'Test WF' } as Workflow;

            service.getWorkflowById('123').subscribe(wf => {
                expect(wf.id).toBe('123');
                expect(wf.title).toBe('Test WF');
            });

            const req = httpMock.expectOne(`${apiUrl}/123`);
            expect(req.request.method).toBe('GET');
            req.flush(mockWf);
        });

        it('debe crear un workflow (createWorkflow)', () => {
            const dto: CreateWorkflowDto = { title: 'Nuevo', triggerType: 'webhook' };
            const mockResponse = { id: 'new-id', ...dto } as Workflow;

            service.createWorkflow(dto).subscribe(res => {
                expect(res.id).toBe('new-id');
            });

            const req = httpMock.expectOne(apiUrl);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(dto);
            req.flush(mockResponse);
        });

        it('debe eliminar un workflow (deleteWorkflow)', () => {
            service.deleteWorkflow('123').subscribe();

            const req = httpMock.expectOne(`${apiUrl}/123`);
            expect(req.request.method).toBe('DELETE');
            req.flush(null);
        });
    });

    describe('Manejo de Nodos', () => {
        it('debe obtener nodos de un workflow (getNodesByWorkflowId)', () => {
            const mockNodes = [{ id: 'n1', name: 'Node 1' }];

            service.getNodesByWorkflowId('wf1').subscribe(nodes => {
                expect(nodes.length).toBe(1);
            });

            const req = httpMock.expectOne(`${apiUrl}/wf1/nodes`);
            req.flush(mockNodes);
        });
    });

    describe('Ejecución', () => {
        it('debe ejecutar un workflow (executeWorkflow)', () => {
            service.executeWorkflow('wf1', { key: 'val' }).subscribe();

            const req = httpMock.expectOne(`${apiUrl}/wf1/execute`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ key: 'val' });
            req.flush({ status: 'success' });
        });
    });
});
