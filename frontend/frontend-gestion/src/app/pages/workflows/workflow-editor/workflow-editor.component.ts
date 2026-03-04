import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import {
    CreateWorkflowNodeDto,
    EditorNode,
    Workflow,
    WorkflowNodeType
} from '../../../core/models/workflow.model';
import { WorkflowService } from '../../../core/services/workflow.service';
import { WorkflowCanvasComponent } from './components/workflow-canvas/workflow-canvas.component';
import { WorkflowPropertiesComponent } from './components/workflow-properties/workflow-properties.component';
import { WorkflowToolbarComponent } from './components/workflow-toolbar/workflow-toolbar.component';
import { ToolboxItem, WorkflowToolboxComponent } from './components/workflow-toolbox/workflow-toolbox.component';

@Component({
    selector: 'app-workflow-editor',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        ToastModule,
        TagModule,
        WorkflowPropertiesComponent,
        WorkflowToolboxComponent,
        WorkflowCanvasComponent,
        WorkflowToolbarComponent,
    ],
    providers: [MessageService],
    templateUrl: './workflow-editor.component.html',
    styleUrls: ['./workflow-editor.component.scss'],
})
export class WorkflowEditorComponent implements OnInit {
    workflowId = '';
    workflow = signal<Workflow | null>(null);
    nodes = signal<EditorNode[]>([]);
    selectedNode = signal<EditorNode | null>(null);
    connecting = signal(false);
    connectingFromId = signal<string | null>(null);
    saving = signal(false);
    simulating = signal(false);
    executing = signal(false);
    simulationIndex = signal(0);

    // Nodo padre del seleccionado actualmente
    parentNode = computed<EditorNode | null>(() => {
        const selected = this.selectedNode();
        if (!selected || !selected.parentId) return null;
        return this.nodes().find(n => n.id === selected.parentId) || null;
    });

    // Fase 4: Todos los ancestros del nodo seleccionado
    availableAncestors = computed<EditorNode[]>(() => {
        const selected = this.selectedNode();
        if (!selected) return [];

        const allNodes = this.nodes();
        const ancestors: EditorNode[] = [];
        let currentParentId = selected.parentId;

        // Prevención de ciclos
        const visited = new Set<string>();
        visited.add(selected.id);

        while (currentParentId) {
            const parent = allNodes.find(n => n.id === currentParentId);
            if (!parent || visited.has(parent.id)) break;

            ancestors.push(parent);
            visited.add(parent.id);
            currentParentId = parent.parentId;
        }

        return ancestors.reverse(); // Orden: desde la raíz hasta el padre inmediato
    });

    // IDs de nodos eliminados (para borrar del backend al guardar)
    deletedNodeIds: string[] = [];

    // Estado de drag
    dragging = false;
    dragNodeId: string | null = null;
    dragOffsetX = 0;
    dragOffsetY = 0;

    // Nodos ordenados para simulación (DFS desde raíz)
    simulationOrder = computed<EditorNode[]>(() => {
        const allNodes = this.nodes();
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
            const children = childMap.get(node.id) || [];
            for (const child of children) {
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

    // ==================== Toolbox Drag & Drop ====================

    onToolboxDragStart(event: { event: DragEvent, item: ToolboxItem }) {
        this.messageService.add({ severity: 'info', summary: 'Arrastrando', detail: `Agregando nodo ${event.item.label}` });
    }

    onCanvasDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onCanvasDrop(event: DragEvent) {
        event.preventDefault();
        const type = event.dataTransfer?.getData('node-type') as WorkflowNodeType;
        if (!type) return;

        const canvasEl = (event.currentTarget as HTMLElement);
        const rect = canvasEl.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Validar que solo haya un TRIGGER
        if (type === WorkflowNodeType.TRIGGER) {
            const hasTrigger = this.nodes().some(n => n.type === WorkflowNodeType.TRIGGER);
            if (hasTrigger) {
                this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Solo puede haber un nodo Trigger (raíz)' });
                return;
            }
        }

        const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
        const newNode: EditorNode = {
            id: tempId,
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

    // ==================== Node Handling on Canvas ====================

    updateNodePosition(event: { id: string, x: number, y: number }) {
        this.nodes.update(nodes =>
            nodes.map(n => n.id === event.id ? { ...n, x: event.x, y: event.y } : n),
        );
    }

    // ==================== Selection ====================

    selectNode(node: EditorNode) {
        if (this.connecting()) {
            this.completeConnection(node);
            return;
        }
        this.nodes.update(nodes =>
            nodes.map(n => ({ ...n, selected: n.id === node.id })),
        );
        this.selectedNode.set(node);
    }

    deselectAll() {
        if (this.connecting()) return;
        this.nodes.update(nodes => nodes.map(n => ({ ...n, selected: false })));
        this.selectedNode.set(null);
    }

    // ==================== Connections ====================

    startConnection(node: EditorNode) {
        this.connecting.set(true);
        this.connectingFromId.set(node.id);
        this.messageService.add({ severity: 'info', summary: 'Conexión', detail: 'Haz clic en el nodo destino' });
    }

    completeConnection(targetNode: EditorNode) {
        const fromId = this.connectingFromId();
        if (!fromId || fromId === targetNode.id) {
            this.connecting.set(false);
            this.connectingFromId.set(null);
            return;
        }

        // Asignar parentId al nodo destino
        this.nodes.update(nodes =>
            nodes.map(n => n.id === targetNode.id ? { ...n, parentId: fromId } : n),
        );

        this.connecting.set(false);
        this.connectingFromId.set(null);
        this.messageService.add({ severity: 'success', summary: 'Conectado', detail: 'Nodos conectados correctamente' });
    }

    cancelConnection() {
        this.connecting.set(false);
        this.connectingFromId.set(null);
    }

    removeConnection(node: EditorNode) {
        this.nodes.update(nodes =>
            nodes.map(n => n.id === node.id ? { ...n, parentId: null } : n),
        );
        // update selectedNode if it's the disconnected one
        if (this.selectedNode()?.id === node.id) {
            this.selectedNode.set({ ...node, parentId: null });
        }
    }

    // ==================== Config Editing ====================

    updateNodeConfig(config: Record<string, any>) {
        const node = this.selectedNode();
        if (!node) return;

        this.nodes.update(nodes =>
            nodes.map(n => n.id === node.id ? { ...n, config } : n),
        );

        this.selectedNode.set({ ...node, config });
    }

    // ==================== Delete Node ====================

    deleteNode(node: EditorNode) {
        this.nodes.update(nodes =>
            nodes.filter(n => n.id !== node.id).map(n =>
                n.parentId === node.id ? { ...n, parentId: null } : n
            ),
        );

        // Si el nodo ya existe en backend, guardar para eliminar
        if (!node.id.startsWith('temp-')) {
            this.deletedNodeIds.push(node.id);
        }

        if (this.selectedNode()?.id === node.id) {
            this.selectedNode.set(null);
        }
    }

    // ==================== Save ====================

    async saveAll() {
        this.saving.set(true);

        try {
            // 1. Eliminar nodos borrados del backend
            for (const id of this.deletedNodeIds) {
                await this.workflowService.deleteNode(id).toPromise();
            }
            this.deletedNodeIds = [];

            // 2. Crear nodos nuevos (sin parentId primero para obtener IDs reales)
            const currentNodes = this.nodes();
            const tempToRealId = new Map<string, string>();

            // Pass 1: Crear nodos nuevos sin parent
            for (const node of currentNodes) {
                if (node.id.startsWith('temp-')) {
                    const dto: CreateWorkflowNodeDto = {
                        type: node.type,
                        config: node.config,
                        x: node.x,
                        y: node.y,
                        workflowId: this.workflowId,
                        parentId: null, // se asigna en pass 2
                    };
                    const created = await this.workflowService.createNode(dto).toPromise();
                    if (created) {
                        tempToRealId.set(node.id, created.id);
                        // Update local ID immediately to avoid duplicate creation on retry if a later step fails
                        this.nodes.update(nodes => nodes.map(n => n.id === node.id ? { ...n, id: created.id } : n));
                        if (this.selectedNode()?.id === node.id) {
                            this.selectedNode.set({ ...node, id: created.id });
                        }
                    }
                }
            }

            // Pass 2: Actualizar todos los nodos (posiciones, config, parentId)
            for (const node of currentNodes) {
                const realId = tempToRealId.get(node.id) || node.id;
                let parentId = node.parentId;
                if (parentId && tempToRealId.has(parentId)) {
                    parentId = tempToRealId.get(parentId)!;
                }

                await this.workflowService.updateNode(realId, {
                    type: node.type,
                    config: node.config,
                    x: node.x,
                    y: node.y,
                    parentId: parentId || null,
                }).toPromise();
            }

            // Reload nodes from backend
            this.loadNodes();
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Workflow guardado correctamente' });
        } catch (err: any) {
            console.error('Error saving workflow:', err);
            const msg = err.error?.message || err.message || 'Error desconocido';
            this.messageService.add({ severity: 'error', summary: 'Error al guardar', detail: msg });
        } finally {
            this.saving.set(false);
        }
    }

    // ==================== Simulation ====================

    startSimulation() {
        const order = this.simulationOrder();
        if (!order.length) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'No hay nodos para simular' });
            return;
        }

        this.simulating.set(true);
        this.simulationIndex.set(0);
        this.highlightNode(0);
    }

    private highlightNode(index: number) {
        const order = this.simulationOrder();
        if (index >= order.length) {
            this.nodes.update(nodes => nodes.map(n => ({ ...n, active: false })));
            this.simulating.set(false);
            this.messageService.add({ severity: 'success', summary: 'Simulación', detail: 'Simulación completada' });
            return;
        }

        const currentId = order[index].id;
        this.nodes.update(nodes =>
            nodes.map(n => ({ ...n, active: n.id === currentId })),
        );
        this.simulationIndex.set(index);

        setTimeout(() => this.highlightNode(index + 1), 1200);
    }

    stopSimulation() {
        this.simulating.set(false);
        this.nodes.update(nodes => nodes.map(n => ({ ...n, active: false })));
    }

    async realExecute() {
        if (!this.workflowId) return;
        this.executing.set(true);
        this.workflowService.executeWorkflow(this.workflowId, {}).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Ejecución', detail: 'Evento enviado a Inngest correctamente' });
                this.executing.set(false);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo iniciar la ejecución' });
                this.executing.set(false);
            }
        });
    }

    // ==================== Helpers ====================

    goBack() {
        this.router.navigate(['/workflows']);
    }
}
