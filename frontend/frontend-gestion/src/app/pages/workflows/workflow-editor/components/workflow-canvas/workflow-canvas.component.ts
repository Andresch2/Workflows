import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { EditorNode, WorkflowConnection, WorkflowNodeType } from '../../../../../core/models/workflow.model';
import { getNodeIcon, getNodeLabel } from '../../utils/workflow-node.utils';

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
    @Output() canvasDrop = new EventEmitter<DragEvent>();
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

    onCanvasDragOver(event: DragEvent) {
        event.preventDefault();
        this.canvasDragOver.emit(event);
    }

    onCanvasDrop(event: DragEvent) {
        event.preventDefault();
        this.canvasDrop.emit(event);
    }

    onNodeMouseDown(event: MouseEvent, node: EditorNode) {
        if (this.connecting) return;
        event.stopPropagation();
        this.dragging = true;
        this.dragNodeId = node.id;
        this.dragOffsetX = event.offsetX;
        this.dragOffsetY = event.offsetY;
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (!this.dragging || !this.dragNodeId) return;

        const canvas = this.canvasRef?.nativeElement;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left - this.dragOffsetX + 60;
        const y = event.clientY - rect.top - this.dragOffsetY + 20;

        this.nodeMoved.emit({ id: this.dragNodeId, x: Math.max(0, x), y: Math.max(0, y) });
    }

    @HostListener('document:mouseup')
    onMouseUp() {
        this.dragging = false;
        this.dragNodeId = null;
    }

    onNodeClick(event: MouseEvent, node: EditorNode) {
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

        // Control points for Bézier curve
        const cp1x = start.x;
        const cp1y = start.y + 60;
        const cp2x = end.x;
        const cp2y = end.y - 60;

        return `M ${start.x} ${start.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${end.x} ${end.y}`;
    }

    private getConnectorPosition(node: EditorNode, isSource: boolean, handle?: string): { x: number, y: number } {
        const nodeWidth = 180;

        if (!isSource) {
            return { x: node.x + nodeWidth / 2, y: node.y };
        }

        // Source position depends on handle
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

        const cp1y = start.y + 60;
        const cp2y = end.y - 60;

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
}
