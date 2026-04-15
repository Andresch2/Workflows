import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import {
    CreateWorkflowConnectionDto,
    CreateWorkflowDto,
    CreateWorkflowNodeDto,
    UpdateWorkflowDto,
    UpdateWorkflowNodeDto,
    Workflow,
    WorkflowConnection,
    WorkflowNode,
} from '../models/workflow.model';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
    private readonly apiUrl = `${environment.apiUrl}/workflows`;

    // Estado compartido del catálogo de base de datos
    private _catalog = signal<any[]>([]);
    readonly databaseCatalog = this._catalog.asReadonly();
    private catalogLoaded = false;

    constructor(private http: HttpClient) { }

    // Configuración

    getDatabaseCatalog(): Observable<any[]> {
        if (this.catalogLoaded) {
            return of(this._catalog());
        }
        return this.http.get<any[]>(`${this.apiUrl}/database/configs`).pipe(
            tap(catalog => {
                this._catalog.set(catalog);
                this.catalogLoaded = true;
            })
        );
    }

    // CRUD de workflows

    getWorkflows(page = 1, limit = 50): Observable<{ data: Workflow[]; hasNextPage: boolean }> {
        return this.http.get<{ data: Workflow[]; hasNextPage: boolean }>(`${this.apiUrl}?page=${page}&limit=${limit}`);
    }

    getWorkflowById(id: string): Observable<Workflow> {
        return this.http.get<Workflow>(`${this.apiUrl}/${id}`);
    }

    createWorkflow(dto: CreateWorkflowDto): Observable<Workflow> {
        return this.http.post<Workflow>(this.apiUrl, dto);
    }

    updateWorkflow(id: string, dto: UpdateWorkflowDto): Observable<Workflow> {
        return this.http.patch<Workflow>(`${this.apiUrl}/${id}`, dto);
    }

    deleteWorkflow(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // CRUD de nodos

    getNodesByWorkflowId(workflowId: string): Observable<WorkflowNode[]> {
        return this.http.get<WorkflowNode[]>(`${this.apiUrl}/${workflowId}/nodes`);
    }

    createNode(dto: CreateWorkflowNodeDto): Observable<WorkflowNode> {
        return this.http.post<WorkflowNode>(`${this.apiUrl}/nodes`, dto);
    }

    updateNode(id: string, dto: UpdateWorkflowNodeDto): Observable<WorkflowNode> {
        return this.http.patch<WorkflowNode>(`${this.apiUrl}/nodes/${id}`, dto);
    }

    deleteNode(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/nodes/${id}`);
    }

    // CRUD de conexiones

    getConnectionsByWorkflowId(workflowId: string): Observable<WorkflowConnection[]> {
        return this.http.get<WorkflowConnection[]>(`${this.apiUrl}/${workflowId}/connections`);
    }

    createConnection(dto: CreateWorkflowConnectionDto): Observable<WorkflowConnection> {
        return this.http.post<WorkflowConnection>(
            `${this.apiUrl}/${dto.workflowId}/connections`,
            dto,
        );
    }

    deleteConnection(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/connections/${id}`);
    }

    // Pruebas

    testHttpNode(config: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/test/http`, config);
    }

    testDatabase(config: { nombre?: string; json?: any; data?: any }): Observable<any> {
        return this.http.post(`${this.apiUrl}/test/database`, config);
    }

    testNotification(config: { url?: string; recipient: string; message: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/test/notification`, config);
    }

    // Endpoints públicos de formularios

    getFormConfig(nodeId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/form/${nodeId}`);
    }

    submitForm(nodeId: string, payload: any, executionId?: string): Observable<any> {
        const body = {
            ...payload,
            executionId
        };
        return this.http.post(`${this.apiUrl}/form/${nodeId}/submit`, body);
    }

    // Ejecución

    executeWorkflow(id: string, payload: any = {}): Observable<any> {
        return this.http.post(`${this.apiUrl}/${id}/execute`, payload);
    }

    executeWorkflowSync(id: string, payload: any = {}): Observable<any> {
        return this.http.post(`${this.apiUrl}/${id}/execute/sync`, payload);
    }

    getLatestWebhookPayload(workflowId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/webhook/${workflowId}/latest`);
    }
}
