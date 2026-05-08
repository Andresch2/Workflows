import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { EditorNode, WorkflowConnection, WorkflowNodeType } from '../../../../../core/models/workflow.model';
import { getNodeColor, getNodeIcon, getNodeLabel } from '../../utils/workflow-node.utils';

type CanvasDropEvent = {
    event: DragEvent;
    x: number;
    y: number;
};

@Component({
    selector: 'app-workflow-canvas',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './workflow-canvas.component.html',
    styleUrls: []
})
export class WorkflowCanvasComponent {
    @Input() nodes: EditorNode[] = [];
    @Input() connections: WorkflowConnection[] = [];
    @Input() connecting = false;
    @Input() connectingFromId: string | null = null;
    @Input() selectedNodeId: string | undefined;

    @Output() canvasDragOver = new EventEmitter<DragEvent>();
    @Output() canvasDrop = new EventEmitter<CanvasDropEvent>();
    @Output() nodeSelected = new EventEmitter<EditorNode>();
    @Output() canvasClicked = new EventEmitter<void>();
    @Output() connectionStarted = new EventEmitter<{ node: EditorNode, handle?: string }>();
    @Output() nodeMoved = new EventEmitter<{ id: string, x: number, y: number }>();
    @Output() connectionRemoved = new EventEmitter<string>();

    @ViewChild('editorCanvas', { static: true }) canvasRef!: ElementRef<HTMLElement>;

    // Drag state
    dragging = false;
    dragNodeId: string | null = null;
    dragOffsetX = 0;
    dragOffsetY = 0;
    private dragStartClientX = 0;
    private dragStartClientY = 0;
    private didDrag = false;
    private readonly dragThreshold = 4;
    private suppressNextClick = false;

    zoom = 1;
    readonly minZoom = 0.4;
    readonly maxZoom = 2;
    private readonly nodeWidth = 180;
    private readonly nodeHeight = 120;

    onCanvasDragOver(event: DragEvent) {
        event.preventDefault();
        this.canvasDragOver.emit(event);
    }

    onCanvasDrop(event: DragEvent) {
        event.preventDefault();
        const canvas = this.canvasRef?.nativeElement;
        if (!canvas) {
            this.canvasDrop.emit({ event, x: 0, y: 0 });
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left + canvas.scrollLeft) / this.zoom;
        const y = (event.clientY - rect.top + canvas.scrollTop) / this.zoom;
        this.canvasDrop.emit({ event, x, y });
    }

    onNodeMouseDown(event: MouseEvent, node: EditorNode) {
        if (this.connecting) return;
        event.stopPropagation();
        const canvas = this.canvasRef?.nativeElement;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const pointerX = (event.clientX - rect.left + canvas.scrollLeft) / this.zoom;
        const pointerY = (event.clientY - rect.top + canvas.scrollTop) / this.zoom;

        this.dragging = true;
        this.dragNodeId = node.id;
        this.dragOffsetX = pointerX - node.x;
        this.dragOffsetY = pointerY - node.y;
        this.dragStartClientX = event.clientX;
        this.dragStartClientY = event.clientY;
        this.didDrag = false;
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (!this.dragging || !this.dragNodeId) return;

        const canvas = this.canvasRef?.nativeElement;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const pointerX = (event.clientX - rect.left + canvas.scrollLeft) / this.zoom;
        const pointerY = (event.clientY - rect.top + canvas.scrollTop) / this.zoom;
        const x = pointerX - this.dragOffsetX;
        const y = pointerY - this.dragOffsetY;

        if (!this.didDrag) {
            const deltaX = Math.abs(event.clientX - this.dragStartClientX);
            const deltaY = Math.abs(event.clientY - this.dragStartClientY);
            this.didDrag = deltaX > this.dragThreshold || deltaY > this.dragThreshold;
        }

        this.nodeMoved.emit({ id: this.dragNodeId, x: Math.max(0, x), y: Math.max(0, y) });
    }

    @HostListener('document:mouseup')
    onMouseUp() {
        if (this.dragging && this.didDrag) {
            // Evita que el click de mouseup tras arrastrar abra el panel de propiedades.
            this.suppressNextClick = true;
            setTimeout(() => {
                this.suppressNextClick = false;
            }, 0);
        }
        this.dragging = false;
        this.dragNodeId = null;
        this.didDrag = false;
    }

    onNodeClick(event: MouseEvent, node: EditorNode) {
        if (this.suppressNextClick) {
            event.stopPropagation();
            return;
        }
        event.stopPropagation();
        this.nodeSelected.emit(node);
    }

    onCanvasClick() {
        this.canvasClicked.emit();
    }

    onConnectorClick(event: MouseEvent, node: EditorNode, handle?: string) {
        event.stopPropagation();
        this.connectionStarted.emit({ node, handle });
    }

    getConnections(): Array<{ from: EditorNode; to: EditorNode; id: string; handle?: string }> {
        const result: Array<{ from: EditorNode; to: EditorNode; id: string; handle?: string }> = [];
        for (const conn of this.connections) {
            const from = this.nodes.find(n => n.id === conn.sourceNodeId);
            const to = this.nodes.find(n => n.id === conn.targetNodeId);
            if (from && to) {
                result.push({ from, to, id: conn.id, handle: conn.sourceHandle as string | undefined });
            }
        }
        return result;
    }

    getConnectionPath(from: EditorNode, to: EditorNode, handle?: string): string {
        const start = this.getConnectorPosition(from, true, handle);
        const end = this.getConnectorPosition(to, false);

        const dist = Math.abs(end.y - start.y);
        const verticalOffset = Math.min(Math.max(dist / 2, 40), 100);

        const cp1x = start.x;
        const cp1y = start.y + verticalOffset;
        const cp2x = end.x;
        const cp2y = end.y - verticalOffset;

        return `M ${start.x} ${start.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${end.x} ${end.y}`;
    }

    private getConnectorPosition(node: EditorNode, isSource: boolean, handle?: string): { x: number, y: number } {
        const nodeWidth = 180;

        if (!isSource) {
            return { x: node.x + nodeWidth / 2, y: node.y };
        }

        let xOffset = 0.5; // Center

        if (node.type === WorkflowNodeType.IF) {
            if (handle === 'true') xOffset = 0.3;
            if (handle === 'false') xOffset = 0.7;
        }

        // Use more realistic heights based on node type
        const height = node.type === WorkflowNodeType.IF ? 110 : 85;

        return { x: node.x + (nodeWidth * xOffset), y: node.y + height + 10 };
    }

    getArrowPoints(from: EditorNode, to: EditorNode, handle?: string): string {
        const end = this.getConnectorPosition(to, false);
        const start = this.getConnectorPosition(from, true, handle);
        const size = 8;

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const angle = Math.atan2(dy, dx);

        const x1 = end.x - size * Math.cos(angle - Math.PI / 6);
        const y1 = end.y - size * Math.sin(angle - Math.PI / 6);
        const x2 = end.x - size * Math.cos(angle + Math.PI / 6);
        const y2 = end.y - size * Math.sin(angle + Math.PI / 6);

        return `${end.x},${end.y} ${x1},${y1} ${x2},${y2}`;
    }

    getDeleteButtonPos(from: EditorNode, to: EditorNode, handle?: string): { x: number, y: number } {
        const start = this.getConnectorPosition(from, true, handle);
        const end = this.getConnectorPosition(to, false);

        const dist = Math.abs(end.y - start.y);
        const verticalOffset = Math.min(Math.max(dist / 2, 40), 100);

        const cp1y = start.y + verticalOffset;
        const cp2y = end.y - verticalOffset;

        return {
            x: (start.x + 3 * start.x + 3 * end.x + end.x) / 8,
            y: (start.y + 3 * cp1y + 3 * cp2y + end.y) / 8
        };
    }

    onDeleteConnection(event: MouseEvent, connId: string) {
        console.log('Canvas: Intentando borrar conexión:', connId);
        event.preventDefault();
        event.stopPropagation();
        this.connectionRemoved.emit(connId);
    }

    getNodeIcon(type: WorkflowNodeType): string {
        return getNodeIcon(type);
    }

    getNodeLabel(type: WorkflowNodeType): string {
        return getNodeLabel(type);
    }

    getNodeDisplayName(node: EditorNode): string {
        return node.name || node.config?.['title'] || node.config?.['action'] || node.config?.['url'] || getNodeLabel(node.type);
    }

    getNodeColor(type: WorkflowNodeType): string {
        return getNodeColor(type);
    }

    get zoomPercent(): number {
        return Math.round(this.zoom * 100);
    }

    get canvasWidth(): number {
        const maxX = this.nodes.reduce((acc, node) => Math.max(acc, node.x + this.nodeWidth + 140), 1200);
        return maxX;
    }

    get canvasHeight(): number {
        const maxY = this.nodes.reduce((acc, node) => Math.max(acc, node.y + this.nodeHeight + 180), 800);
        return maxY;
    }

    zoomIn() {
        this.setZoom(this.zoom + 0.1);
    }

    zoomOut() {
        this.setZoom(this.zoom - 0.1);
    }

    resetZoom() {
        this.setZoom(1);
    }

    fitToScreen() {
        const canvas = this.canvasRef?.nativeElement;
        if (!canvas || this.nodes.length === 0) {
            this.resetZoom();
            return;
        }

        const minX = this.nodes.reduce((acc, node) => Math.min(acc, node.x), this.nodes[0].x);
        const minY = this.nodes.reduce((acc, node) => Math.min(acc, node.y), this.nodes[0].y);
        const maxX = this.nodes.reduce((acc, node) => Math.max(acc, node.x + this.nodeWidth), this.nodes[0].x + this.nodeWidth);
        const maxY = this.nodes.reduce((acc, node) => Math.max(acc, node.y + this.nodeHeight), this.nodes[0].y + this.nodeHeight);

        const boundsWidth = Math.max(1, maxX - minX + 120);
        const boundsHeight = Math.max(1, maxY - minY + 120);

        const availableWidth = Math.max(1, canvas.clientWidth - 40);
        const availableHeight = Math.max(1, canvas.clientHeight - 40);

        const nextZoom = Math.min(availableWidth / boundsWidth, availableHeight / boundsHeight);
        this.setZoom(nextZoom);

        // Llevar el inicio al área visible tras ajustar.
        canvas.scrollLeft = Math.max(0, (minX - 40) * this.zoom);
        canvas.scrollTop = Math.max(0, (minY - 40) * this.zoom);
    }

    private setZoom(next: number) {
        const clamped = Math.min(this.maxZoom, Math.max(this.minZoom, next));
        this.zoom = Number(clamped.toFixed(2));
    }
}
