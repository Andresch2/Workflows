import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { WorkflowNodeType } from '../../../../../core/models/workflow.model';
import { NODE_COLORS, NODE_ICONS, NODE_LABELS } from '../../utils/workflow-node.utils';

export interface ToolboxItem {
    type: WorkflowNodeType;
    label: string;
    description: string;
    icon: string;
    color: string;
}

const TOOLBOX_DESCRIPTIONS: Record<WorkflowNodeType, string> = {
    [WorkflowNodeType.TRIGGER]: 'Punto de entrada',
    [WorkflowNodeType.HTTP]: 'Llamada API',
    [WorkflowNodeType.WEBHOOK]: 'Enviar datos',
    [WorkflowNodeType.DATABASE]: 'Operaciones DB',
    [WorkflowNodeType.NOTIFICATION]: 'Enviar mensaje',
    [WorkflowNodeType.DELAY]: 'Esperar tiempo',
    [WorkflowNodeType.FORM]: 'Pedir información',
    [WorkflowNodeType.IF]: 'Condicion IF/ELSE',
};

@Component({
    selector: 'app-workflow-toolbox',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './workflow-toolbox.component.html',
    styleUrls: []
})
export class WorkflowToolboxComponent {
    @Output() dragStart = new EventEmitter<{ event: DragEvent, item: ToolboxItem }>();

    toolboxItems: ToolboxItem[] = Object.values(WorkflowNodeType).map(type => ({
        type,
        label: NODE_LABELS[type],
        description: TOOLBOX_DESCRIPTIONS[type] || '',
        icon: NODE_ICONS[type],
        color: NODE_COLORS[type],
    }));

    onDragStart(event: DragEvent, item: ToolboxItem) {
        if (event.dataTransfer) {
            event.dataTransfer.setData('node-type', item.type);
        }
        this.dragStart.emit({ event, item });
    }
}

