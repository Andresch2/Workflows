import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { signal, computed } from '@angular/core';
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
    
    // Shared state for database catalog
    private _catalog = signal<any[]>([]);
    readonly databaseCatalog = this._catalog.asReadonly();
    private catalogLoaded = false;

    constructor(private http: HttpClient) { }

    // ==================== Configuration ====================

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

    // ==================== Workflow CRUD ====================

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

    // ==================== Node CRUD ====================

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

    // ==================== Connection CRUD ====================

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

    // ==================== Test ====================

    testHttpNode(config: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/test/http`, config);
    }

    testDatabase(config: { nombre?: string; json?: any; data?: any }): Observable<any> {
        return this.http.post(`${this.apiUrl}/test/database`, config);
    }

    testNotification(config: { url?: string; recipient: string; message: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/test/notification`, config);
    }

    // ==================== Execution ====================

    executeWorkflow(id: string, payload: any = {}): Observable<any> {
        return this.http.post(`${this.apiUrl}/${id}/execute`, payload);
    }

    getLatestWebhookPayload(workflowId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/webhook/${workflowId}/latest`);
    }
}
