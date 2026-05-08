import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { DrawerModule } from 'primeng/drawer';
import { PanelModule } from 'primeng/panel';
import { WorkflowHistoryComponent } from './components/workflow-history/workflow-history.component';
import { WorkflowExecution } from '../../../core/models/workflow.model';
import {
    CreateWorkflowNodeDto,
    EditorNode,
    Workflow,
    WorkflowConnection,
    WorkflowNodeType
} from '../../../core/models/workflow.model';
import { WorkflowService } from '../../../core/services/workflow.service';
import { WorkflowCanvasComponent } from './components/workflow-canvas/workflow-canvas.component';
import { WorkflowPropertiesComponent } from './components/workflow-properties/workflow-properties.component';
import { WorkflowToolbarComponent } from './components/workflow-toolbar/workflow-toolbar.component';
import { ToolboxItem, WorkflowToolboxComponent } from './components/workflow-toolbox/workflow-toolbox.component';

type CanvasDropEvent = {
    event: DragEvent;
    x: number;
    y: number;
};

@Component({
    selector: 'app-workflow-editor',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        ToastModule,
        TagModule,
        DialogModule,
        TextareaModule,
        WorkflowPropertiesComponent,
        WorkflowToolboxComponent,
        WorkflowCanvasComponent,
        WorkflowToolbarComponent,
        WorkflowHistoryComponent,
        DrawerModule,
        PanelModule
    ],
    providers: [MessageService],
    templateUrl: './workflow-editor.component.html',
    styleUrls: ['./workflow-editor.component.scss'],
})
export class WorkflowEditorComponent implements OnInit {
    workflowId = '';
    workflow = signal<Workflow | null>(null);
    nodes = signal<EditorNode[]>([]);
    connections = signal<WorkflowConnection[]>([]);
    selectedNode = signal<EditorNode | null>(null);
    connecting = signal(false);
    connectingFromId = signal<string | null>(null);
    connectingSourceHandle = signal<string | null>(null);
    saving = signal(false);
    simulating = signal(false);
    executing = signal(false);
    simulationIndex = signal(0);
    showExecutionDialog = signal(false);
    executionPayload = signal('{}');
    showHistory = signal(false);
    selectedExecution = signal<WorkflowExecution | null>(null);

    // Ancestros del nodo seleccionado (basado en conexiones del grafo)
    availableAncestors = computed<EditorNode[]>(() => {
        const selected = this.selectedNode();
        if (!selected) return [];
        return this.calculateAncestorsFromGraph(selected.id);
    });

    // Nodo padre inmediato del seleccionado (primer upstream)
    parentNode = computed<EditorNode | null>(() => {
        const selected = this.selectedNode();
        if (!selected) return null;
        const conns = this.connections();
        const incoming = conns.filter(c => c.targetNodeId === selected.id);
        if (incoming.length === 0) return null;
        return this.nodes().find(n => n.id === incoming[0].sourceNodeId) || null;
    });

    // IDs de nodos eliminados (para borrar del backend al guardar)
    deletedNodeIds: string[] = [];
    deletedConnectionIds: string[] = [];

    // Estado de drag
    dragging = false;
    dragNodeId: string | null = null;
    dragOffsetX = 0;
    dragOffsetY = 0;

    // Nodos ordenados para simulación (topological sort)
    simulationOrder = computed<EditorNode[]>(() => {
        const allNodes = this.nodes();
        const conns = this.connections();

        if (conns.length > 0) {
            return this.topologicalSort(allNodes, conns);
        }

        // Alternativa heredada: DFS por parentId
        const root = allNodes.find(n => !n.parentId);
        if (!root) return [];
        const order: EditorNode[] = [];
        const visited = new Set<string>();
        const childMap = new Map<string, EditorNode[]>();

        for (const node of allNodes) {
            if (node.parentId) {
                const children = childMap.get(node.parentId) || [];
                children.push(node);
                childMap.set(node.parentId, children);
            }
        }

        const dfs = (node: EditorNode) => {
            if (visited.has(node.id)) return;
            visited.add(node.id);
            order.push(node);
            for (const child of childMap.get(node.id) || []) {
                dfs(child);
            }
        };
        dfs(root);
        return order;
    });

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private workflowService: WorkflowService,
        private messageService: MessageService,
    ) { }

    ngOnInit() {
        this.workflowId = this.route.snapshot.paramMap.get('id') || '';
        if (this.workflowId) {
            this.loadWorkflow();
            this.loadNodes();
            this.loadConnections();
        }
    }

    loadWorkflow() {
        this.workflowService.getWorkflowById(this.workflowId).subscribe({
            next: (wf) => this.workflow.set(wf),
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el workflow' }),
        });
    }

    loadNodes() {
        this.workflowService.getNodesByWorkflowId(this.workflowId).subscribe({
            next: (nodes) => {
                this.nodes.set(nodes.map(n => ({ ...n, selected: false, active: false })));
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los nodos' }),
        });
    }

    loadConnections() {
        this.workflowService.getConnectionsByWorkflowId(this.workflowId).subscribe({
            next: (conns) => this.connections.set(conns),
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las conexiones' }),
        });
    }

    // Arrastrar y Soltar

    onToolboxDragStart(event: { event: DragEvent, item: ToolboxItem }) {
        this.messageService.add({ severity: 'info', summary: 'Arrastrando', detail: `Agregando nodo ${event.item.label}` });
    }

    onCanvasDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onCanvasDrop(payload: CanvasDropEvent) {
        payload.event.preventDefault();
        const type = payload.event.dataTransfer?.getData('node-type') as WorkflowNodeType;
        if (!type) return;
        const x = payload.x;
        const y = payload.y;

        if (type === WorkflowNodeType.TRIGGER || type === WorkflowNodeType.WEBHOOK) {
            const hasExisting = this.nodes().some(n => n.type === type);
            if (hasExisting) {
                const label = type === WorkflowNodeType.WEBHOOK ? 'Webhook' : 'Trigger';
                this.messageService.add({ 
                    severity: 'warn', 
                    summary: 'Atención', 
                    detail: `Solo puede haber un nodo ${label} en el workflow` 
                });
                return;
            }
        }

        const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
        const nodeCount = this.nodes().filter(n => n.type === type).length + 1;
        const defaultName = `${type}_${nodeCount}`;

        const newNode: EditorNode = {
            id: tempId,
            name: defaultName,
            type,
            config: {},
            x,
            y,
            workflowId: this.workflowId,
            parentId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            selected: false,
            active: false,
        };

        this.nodes.update(nodes => [...nodes, newNode]);
    }

    // Manejo de Nodos

    updateNodePosition(event: { id: string, x: number, y: number }) {
        this.nodes.update(nodes =>
            nodes.map(n => n.id === event.id ? { ...n, x: event.x, y: event.y } : n),
        );
    }

    // Selección

    removeConnection(connectionId: string) {
        console.log('Editor: Removiendo conexión:', connectionId);
        const conn = this.connections().find(c => c.id === connectionId);
        if (!conn) return;

        this.connections.update(conns => conns.filter(c => c.id !== connectionId));

        if (!conn.id.startsWith('temp-')) {
            this.deletedConnectionIds.push(conn.id);
        }

        // Actualizar parentId si esta era la única conexión
        const remaining = this.connections().filter(c => c.targetNodeId === conn.targetNodeId);
        if (remaining.length === 0) {
            this.nodes.update(nodes =>
                nodes.map(n => n.id === conn.targetNodeId ? { ...n, parentId: null } : n)
            );
        }

        this.messageService.add({
            severity: 'info',
            summary: 'Conexión eliminada',
            detail: 'La conexión ha sido removida del workflow.',
            life: 2000
        });
    }

    selectNode(node: EditorNode) {
        if (this.connecting()) {
            this.completeConnection(node);
            return;
        }
        this.nodes.update(nodes =>
            nodes.map(n => ({ ...n, selected: n.id === node.id }))
        );
        this.selectedNode.set({ ...node });
    }

    deselectAll() {
        if (this.connecting()) return;
        this.nodes.update(nodes => nodes.map(n => ({ ...n, selected: false })));
        this.selectedNode.set(null);
    }

    // Conexiones (Basadas en Grafo)

    startConnection(event: { node: EditorNode, handle?: string } | EditorNode) {
        const node = 'node' in event ? event.node : event;
        const handle = 'handle' in event ? event.handle : null;

        this.connecting.set(true);
        this.connectingFromId.set(node.id);
        this.connectingSourceHandle.set(handle || null);
        this.messageService.add({ severity: 'info', summary: 'Conexión', detail: 'Haz clic en el nodo destino' });
    }

    completeConnection(targetNode: EditorNode) {
        const fromId = this.connectingFromId();
        if (!fromId || fromId === targetNode.id) {
            this.connecting.set(false);
            this.connectingFromId.set(null);
            this.connectingSourceHandle.set(null);
            return;
        }

        // Verificar si existe una conexión duplicada
        const existing = this.connections().find(
            c => c.sourceNodeId === fromId && c.targetNodeId === targetNode.id
        );
        if (existing) {
            this.messageService.add({ severity: 'warn', summary: 'Duplicado', detail: 'Esta conexión ya existe' });
            this.connecting.set(false);
            this.connectingFromId.set(null);
            this.connectingSourceHandle.set(null);
            return;
        }

        // Crear una conexión temporal
        const tempConn: WorkflowConnection = {
            id: 'temp-conn-' + Date.now(),
            workflowId: this.workflowId,
            sourceNodeId: fromId,
            targetNodeId: targetNode.id,
            sourceHandle: this.connectingSourceHandle(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        this.connections.update(conns => [...conns, tempConn]);

        // También establecer parentId para retrocompatibilidad
        this.nodes.update(nodes =>
            nodes.map(n => n.id === targetNode.id ? { ...n, parentId: fromId } : n),
        );

        this.connecting.set(false);
        this.connectingFromId.set(null);
        this.connectingSourceHandle.set(null);
        this.messageService.add({ severity: 'success', summary: 'Conectado', detail: 'Nodos conectados correctamente' });

        // Actualizar nodo seleccionado
        if (this.selectedNode()?.id === targetNode.id) {
            const updated = this.nodes().find(n => n.id === targetNode.id);
            if (updated) this.selectedNode.set({ ...updated });
        }
    }

    cancelConnection() {
        this.connecting.set(false);
        this.connectingFromId.set(null);
        this.connectingSourceHandle.set(null);
    }

    removeConnectionByNode(node: EditorNode) {
        // Eliminar todas las conexiones DESDE o HACIA este nodo
        const nodeConns = this.connections().filter(
            c => c.sourceNodeId === node.id || c.targetNodeId === node.id
        );
        for (const conn of nodeConns) {
            this.removeConnection(conn.id);
        }
    }

    // Edición de Configuración

    updateNodeConfig(config: Record<string, any>) {
        const node = this.selectedNode();
        if (!node) return;

        let nextConfig = { ...config };
        let nextDataSchema = node.dataSchema;

        const schemaCandidate = config['__dataSchema'];
        if (Object.prototype.hasOwnProperty.call(config, '__dataSchema')) {
            delete nextConfig['__dataSchema'];
            nextDataSchema = this.cloneDataSchema(schemaCandidate);
        }

        this.nodes.update(nodes =>
            nodes.map(n => n.id === node.id ? { ...n, config: nextConfig, dataSchema: nextDataSchema } : n),
        );

        const updated = this.nodes().find(n => n.id === node.id);
        if (updated) {
            this.selectedNode.set({ ...updated });
        }
    }

    private cloneDataSchema(schemaCandidate: unknown): EditorNode['dataSchema'] {
        if (schemaCandidate === null || schemaCandidate === undefined) {
            return null;
        }

        if (typeof schemaCandidate !== 'object') {
            return null;
        }

        // Preserva arrays/objetos tal cual para evitar convertir arrays en {"0": ...}
        return JSON.parse(JSON.stringify(schemaCandidate));
    }

    updateNodeName(name: string) {
        const node = this.selectedNode();
        if (!node) return;

        // Validar que el nombre sea único
        const duplicate = this.nodes().find(n => n.name === name && n.id !== node.id);
        if (duplicate) {
            this.messageService.add({ severity: 'warn', summary: 'Nombre duplicado', detail: `Ya existe un nodo llamado "${name}"` });
            return;
        }

        this.nodes.update(nodes =>
            nodes.map(n => n.id === node.id ? { ...n, name } : n),
        );
        const updated = this.nodes().find(n => n.id === node.id);
        if (updated) {
            this.selectedNode.set({ ...updated });
        }
    }

    // Eliminar Nodo

    deleteNode(node: EditorNode) {
        // Eliminar todas las conexiones hacia/desde este nodo
        this.removeConnectionByNode(node);

        this.nodes.update(nodes =>
            nodes.filter(n => n.id !== node.id).map(n =>
                n.parentId === node.id ? { ...n, parentId: null } : n
            ),
        );

        if (!node.id.startsWith('temp-')) {
            this.deletedNodeIds.push(node.id);
        }

        if (this.selectedNode()?.id === node.id) {
            this.selectedNode.set(null);
        }
    }

    // Guardar

    async saveAll() {
        this.saving.set(true);

        try {
            // 1. Eliminar nodos borrados
            for (const id of this.deletedNodeIds) {
                await this.workflowService.deleteNode(id).toPromise();
            }
            this.deletedNodeIds = [];

            // 2. Eliminar conexiones borradas
            for (const id of this.deletedConnectionIds) {
                await this.workflowService.deleteConnection(id).toPromise();
            }
            this.deletedConnectionIds = [];

            // 3. Crear nodos nuevos
            const currentNodes = this.nodes();
            const tempToRealId = new Map<string, string>();

            for (const node of currentNodes) {
                if (node.id.startsWith('temp-')) {
                    const dto: CreateWorkflowNodeDto = {
                        type: node.type,
                        name: node.name,
                        config: node.config,
                        dataSchema: node.dataSchema,
                        x: node.x,
                        y: node.y,
                        workflowId: this.workflowId,
                        parentId: null,
                    };
                    const created = await this.workflowService.createNode(dto).toPromise();
                    if (created) {
                        tempToRealId.set(node.id, created.id);
                        this.nodes.update(nodes => nodes.map(n => n.id === node.id ? { ...n, id: created.id } : n));
                        if (this.selectedNode()?.id === node.id) {
                            this.selectedNode.set({ ...node, id: created.id });
                        }
                    }
                }
            }

            // 4. Actualizar todos los nodos
            for (const node of currentNodes) {
                const realId = tempToRealId.get(node.id) || node.id;
                let parentId = node.parentId;
                if (parentId && tempToRealId.has(parentId)) {
                    parentId = tempToRealId.get(parentId)!;
                }

                await this.workflowService.updateNode(realId, {
                    type: node.type,
                    name: node.name,
                    config: node.config,
                    dataSchema: node.dataSchema,
                    x: node.x,
                    y: node.y,
                    parentId: parentId || null,
                }).toPromise();
            }

            // 5. Guardar conexiones nuevas
            for (const conn of this.connections()) {
                if (conn.id.startsWith('temp-')) {
                    const sourceNodeId = tempToRealId.get(conn.sourceNodeId) || conn.sourceNodeId;
                    const targetNodeId = tempToRealId.get(conn.targetNodeId) || conn.targetNodeId;

                    await this.workflowService.createConnection({
                        workflowId: this.workflowId,
                        sourceNodeId,
                        targetNodeId,
                        sourceHandle: conn.sourceHandle,
                        targetHandle: conn.targetHandle,
                    }).toPromise();
                }
            }

            // 6. Recargar todo
            this.loadNodes();
            this.loadConnections();
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Workflow guardado correctamente' });
        } catch (err: any) {
            console.error('Error saving workflow:', err);
            const msg = err.error?.message || err.message || 'Error desconocido';
            this.messageService.add({ severity: 'error', summary: 'Error al guardar', detail: msg });
        } finally {
            this.saving.set(false);
        }
    }

    // Simulación

    startSimulation() {
        const order = this.simulationOrder();
        if (!order.length) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'No hay nodos para simular' });
            return;
        }

        let payload = {};
        try {
            payload = JSON.parse(this.executionPayload() || '{}');
        } catch (e) {
            this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'Payload JSON inválido, usando {}' });
        }

        // Reset all states
        this.nodes.update(nodes => nodes.map(n => ({ 
            ...n, 
            active: false, 
            executionStatus: 'idle', 
            errorMessage: undefined 
        })));

        this.simulating.set(true);
        this.messageService.add({ severity: 'info', summary: 'Simulando', detail: 'Ejecutando en el backend...' });

        // Ejecución Real Sincrónica
        this.workflowService.executeWorkflowSync(this.workflowId, payload).subscribe({
            next: (res: any) => {
                const results = res.results || {};
                this.simulationIndex.set(0);
                this.highlightNodeReal(0, order, results);
            },
            error: (err) => {
                this.simulating.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Falló la comunicación con el motor' });
            }
        });
    }

    private highlightNodeReal(index: number, order: EditorNode[], executionResults: Record<string, any>) {
        if (index >= order.length) {
            this.nodes.update(nodes => nodes.map(n => ({ ...n, active: false })));
            this.simulating.set(false);
            this.messageService.add({ severity: 'success', summary: 'Simulación', detail: 'Simulación completada con éxito' });
            return;
        }

        const currentId = order[index].id;
        const nodeResult = executionResults[currentId];

        // Si el backend no ejecutó este nodo (ej. la rama IF no pasó por aquí o falló antes)
        if (!nodeResult) {
            // Saltamos silenciosamente al siguiente nodo para la animación
            this.highlightNodeReal(index + 1, order, executionResults);
            return;
        }
        
        // Mark as active (running)
        this.nodes.update(nodes => nodes.map(n => ({ 
            ...n, 
            active: n.id === currentId,
            executionStatus: n.id === currentId ? 'running' : n.executionStatus
        })));

        this.simulationIndex.set(index);

        setTimeout(() => {
            const status = nodeResult.status === 'failed' ? 'error' : 'success';
            const errorMsg = nodeResult.error;

            this.nodes.update(nodes => nodes.map(n => n.id === currentId ? { 
                ...n, 
                active: false,
                executionStatus: status,
                errorMessage: errorMsg
            } : n));

            if (status === 'error') {
                this.simulating.set(false);
                this.nodes.update(nodes => nodes.map(n => ({ ...n, active: false })));
                this.messageService.add({ severity: 'error', summary: 'Error en Nodo', detail: errorMsg || 'Falló la ejecución' });
                return; // Stop simulation early on error
            }

            this.highlightNodeReal(index + 1, order, executionResults);
        }, 800); // 800ms por nodo para la animación
    }

    // Historial
    
    viewHistory() {
        this.showHistory.set(true);
    }

    onSelectExecution(execution: WorkflowExecution) {
        this.selectedExecution.set(execution);
        
        // Reset nodes state
        this.nodes.update(nodes => nodes.map(n => ({ 
            ...n, 
            active: false, 
            executionStatus: 'idle', 
            errorMessage: undefined 
        })));

        // "Play" the execution results onto the canvas
        const results = execution.results || {};
        const order = this.simulationOrder();
        
        this.simulating.set(true); // Usamos el flag de simulación para bloquear edición
        this.playbackExecution(0, order, results);
    }

    private playbackExecution(index: number, order: EditorNode[], executionResults: Record<string, any>) {
        if (index >= order.length) {
            this.simulating.set(false);
            return;
        }

        const currentId = order[index].id;
        const nodeResult = executionResults[currentId];

        if (!nodeResult) {
            this.playbackExecution(index + 1, order, executionResults);
            return;
        }

        const status = nodeResult.status === 'failed' ? 'error' : 'success';
        
        this.nodes.update(nodes => nodes.map(n => n.id === currentId ? { 
            ...n, 
            executionStatus: status,
            errorMessage: nodeResult.error
        } : n));

        // En modo playback vamos más rápido
        setTimeout(() => {
            this.playbackExecution(index + 1, order, executionResults);
        }, 300);
    }

    stopSimulation() {
        this.simulating.set(false);
        this.nodes.update(nodes => nodes.map(n => ({ ...n, active: false, executionStatus: 'idle', errorMessage: undefined })));
    }

    realExecuteDirect() {
        this.startSimulation();
    }

    realExecuteWithParams() {
        this.showExecutionDialog.set(true);
    }

    async confirmExecute() {
        if (!this.workflowId) return;

        let payload = {};
        try {
            payload = JSON.parse(this.executionPayload());
        } catch (e) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'JSON inválido' });
            return;
        }

        this.showExecutionDialog.set(false);
        this.executing.set(true);
        this.workflowService.executeWorkflow(this.workflowId, payload).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Ejecución', detail: 'Evento enviado a Inngest correctamente' });
                this.executing.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo iniciar la ejecución' });
                this.executing.set(false);
            }
        });
    }

    // Funciones Auxiliares

    /** Ordenamiento topológico para conexiones (Algoritmo de Kahn) */
    private topologicalSort(nodes: EditorNode[], connections: WorkflowConnection[]): EditorNode[] {
        const nodeMap = new Map<string, EditorNode>();
        const inDegree = new Map<string, number>();
        const adjacency = new Map<string, string[]>();

        for (const node of nodes) {
            nodeMap.set(node.id, node);
            inDegree.set(node.id, 0);
            adjacency.set(node.id, []);
        }

        for (const conn of connections) {
            const targets = adjacency.get(conn.sourceNodeId) || [];
            targets.push(conn.targetNodeId);
            adjacency.set(conn.sourceNodeId, targets);
            inDegree.set(conn.targetNodeId, (inDegree.get(conn.targetNodeId) || 0) + 1);
        }

        const queue: string[] = [];
        for (const [id, degree] of inDegree) {
            if (degree === 0) queue.push(id);
        }

        const sorted: EditorNode[] = [];
        while (queue.length > 0) {
            const currentId = queue.shift()!;
            const currentNode = nodeMap.get(currentId);
            if (currentNode) sorted.push(currentNode);

            for (const targetId of adjacency.get(currentId) || []) {
                const newDegree = (inDegree.get(targetId) || 1) - 1;
                inDegree.set(targetId, newDegree);
                if (newDegree === 0) queue.push(targetId);
            }
        }

        return sorted;
    }

    /** Calcular ancestros del grafo usando conexiones */
    calculateAncestorsFromGraph(nodeId: string, visited: Set<string> = new Set()): EditorNode[] {
        if (visited.has(nodeId)) return [];
        visited.add(nodeId);

        const conns = this.connections();
        const allNodes = this.nodes();
        const ancestors: EditorNode[] = [];

        // Encontrar todos los nodos que se conectan HACIA este nodo
        const incoming = conns.filter(c => c.targetNodeId === nodeId);
        for (const conn of incoming) {
            const sourceNode = allNodes.find(n => n.id === conn.sourceNodeId);
            if (sourceNode) {
                // Obtener recursivamente los ancestros del nodo origen primero
                const deeper = this.calculateAncestorsFromGraph(sourceNode.id, visited);
                ancestors.push(...deeper, sourceNode);
            }
        }

        // Usar parentId como alternativa cuando no hay conexiones
        if (incoming.length === 0) {
            const node = allNodes.find(n => n.id === nodeId);
            if (node?.parentId) {
                const parent = allNodes.find(n => n.id === node.parentId);
                if (parent) {
                    const deeper = this.calculateAncestorsFromGraph(parent.id, visited);
                    ancestors.push(...deeper, parent);
                }
            }
        }

        return ancestors;
    }

    goBack() {
        this.router.navigate(['/workflows']);
    }
}
