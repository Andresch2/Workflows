import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { EditorNode, WorkflowNodeType } from '../../../../../core/models/workflow.model';
import { getNodeLabel } from '../../utils/workflow-node.utils';

@Component({
    selector: 'app-workflow-canvas',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './workflow-canvas.component.html',
    styleUrls: []
})
export class WorkflowCanvasComponent {
    @Input() nodes: EditorNode[] = [];
    @Input() connecting = false;
    @Input() connectingFromId: string | null = null;
    @Input() selectedNodeId: string | undefined;

    @Output() canvasDragOver = new EventEmitter<DragEvent>();
    @Output() canvasDrop = new EventEmitter<DragEvent>();
    @Output() nodeSelected = new EventEmitter<EditorNode>();
    @Output() canvasClicked = new EventEmitter<void>();
    @Output() connectionStarted = new EventEmitter<EditorNode>();
    @Output() nodeMoved = new EventEmitter<{ id: string, x: number, y: number }>();

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

    onConnectorClick(event: MouseEvent, node: EditorNode) {
        event.stopPropagation();
        this.connectionStarted.emit(node);
    }

    getConnections(): Array<{ from: EditorNode; to: EditorNode }> {
        const connections: Array<{ from: EditorNode; to: EditorNode }> = [];
        for (const node of this.nodes) {
            if (node.parentId) {
                const parent = this.nodes.find(n => n.id === node.parentId);
                if (parent) {
                    connections.push({ from: parent, to: node });
                }
            }
        }
        return connections;
    }

    getArrowPoints(from: EditorNode, to: EditorNode): string {
        const x = to.x + 90;
        const y = to.y;
        const size = 8;

        const dx = to.x + 90 - (from.x + 90);
        const dy = to.y - (from.y + 50);
        const angle = Math.atan2(dy, dx);

        const x1 = x - size * Math.cos(angle - Math.PI / 6);
        const y1 = y - size * Math.sin(angle - Math.PI / 6);
        const x2 = x - size * Math.cos(angle + Math.PI / 6);
        const y2 = y - size * Math.sin(angle + Math.PI / 6);

        return `${x},${y} ${x1},${y1} ${x2},${y2}`;
    }

    getNodeLabel(type: WorkflowNodeType): string {
        return getNodeLabel(type);
    }
}
