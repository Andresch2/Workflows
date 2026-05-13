import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, signal } from '@angular/core';
import { WorkflowNodeType } from '../../../../../core/models/workflow.model';
import { NODE_COLORS, NODE_ICONS, NODE_LABELS } from '../../utils/workflow-node.utils';

export interface ToolboxItem {
    type: WorkflowNodeType;
    label: string;
    description: string;
    icon: string;
    color: string;
}

export interface ToolboxCategory {
    key: string;
    label: string;
    items: ToolboxItem[];
}

const TOOLBOX_DESCRIPTIONS: Record<WorkflowNodeType, string> = {
    [WorkflowNodeType.TRIGGER]: 'Punto de entrada',
    [WorkflowNodeType.HTTP]: 'Llamada API',
    [WorkflowNodeType.WEBHOOK]: 'Entrada por webhook',
    [WorkflowNodeType.DATABASE]: 'Operaciones DB',
    [WorkflowNodeType.NOTIFICATION]: 'Enviar mensaje',
    [WorkflowNodeType.EMAIL]: 'Enviar correo electrónico',
    [WorkflowNodeType.DELAY]: 'Esperar tiempo',
    [WorkflowNodeType.FORM]: 'Formulario publico',
    [WorkflowNodeType.IF]: 'Condicion IF/ELSE',
    [WorkflowNodeType.CODE]: 'Transformar datos JS',
};

const TOOLBOX_GROUPS: Array<{ key: string; label: string; types: WorkflowNodeType[] }> = [
    {
        key: 'triggers',
        label: 'Disparadores',
        types: [WorkflowNodeType.TRIGGER, WorkflowNodeType.WEBHOOK, WorkflowNodeType.FORM],
    },
    {
        key: 'logic',
        label: 'Logica',
        types: [WorkflowNodeType.IF, WorkflowNodeType.DELAY, WorkflowNodeType.CODE],
    },
    {
        key: 'actions',
        label: 'Acciones',
        types: [WorkflowNodeType.HTTP, WorkflowNodeType.DATABASE, WorkflowNodeType.NOTIFICATION, WorkflowNodeType.EMAIL],
    },
];

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

    toolboxCategories: ToolboxCategory[] = TOOLBOX_GROUPS.map(group => ({
        key: group.key,
        label: group.label,
        items: this.toolboxItems.filter(item => group.types.includes(item.type)),
    }));

    expandedCategories = signal<Record<string, boolean>>(
        TOOLBOX_GROUPS.reduce<Record<string, boolean>>((acc, group) => {
            acc[group.key] = true;
            return acc;
        }, {}),
    );

    onDragStart(event: DragEvent, item: ToolboxItem) {
        if (event.dataTransfer) {
            event.dataTransfer.setData('node-type', item.type);
        }
        this.dragStart.emit({ event, item });
    }

    isCategoryExpanded(categoryKey: string): boolean {
        return this.expandedCategories()[categoryKey] ?? true;
    }

    toggleCategory(categoryKey: string) {
        this.expandedCategories.update(current => ({
            ...current,
            [categoryKey]: !current[categoryKey],
        }));
    }
}
