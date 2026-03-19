import { WorkflowNodeType } from '../../../../core/models/workflow.model';

export const NODE_LABELS: Record<WorkflowNodeType, string> = {
    [WorkflowNodeType.TRIGGER]: 'Trigger',
    [WorkflowNodeType.HTTP]: 'HTTP',
    [WorkflowNodeType.WEBHOOK]: 'Webhook Trigger',
    [WorkflowNodeType.DATABASE]: 'Database',
    [WorkflowNodeType.NOTIFICATION]: 'Notificación',
    [WorkflowNodeType.DELAY]: 'Delay',
    [WorkflowNodeType.FORM]: 'Formulario',
    [WorkflowNodeType.IF]: 'If / Else',
};

export const NODE_COLORS: Record<WorkflowNodeType, string> = {
    [WorkflowNodeType.TRIGGER]: '#6366f1',
    [WorkflowNodeType.HTTP]: '#22c55e',
    [WorkflowNodeType.WEBHOOK]: '#f59e0b',
    [WorkflowNodeType.DATABASE]: '#3b82f6',
    [WorkflowNodeType.NOTIFICATION]: '#10b981',
    [WorkflowNodeType.DELAY]: '#475569',
    [WorkflowNodeType.FORM]: '#8b5cf6',
    [WorkflowNodeType.IF]: '#ec4899',
};

export const NODE_ICONS: Record<WorkflowNodeType, string> = {
    [WorkflowNodeType.TRIGGER]: 'pi-bolt',
    [WorkflowNodeType.HTTP]: 'pi-globe',
    [WorkflowNodeType.WEBHOOK]: 'pi-inbox',
    [WorkflowNodeType.DATABASE]: 'pi-database',
    [WorkflowNodeType.NOTIFICATION]: 'pi-bell',
    [WorkflowNodeType.DELAY]: 'pi-clock',
    [WorkflowNodeType.FORM]: 'pi-list',
    [WorkflowNodeType.IF]: 'pi-code',
};

export function getNodeLabel(type: WorkflowNodeType): string {
    return NODE_LABELS[type] || 'Desconocido';
}

export function getNodeColor(type: WorkflowNodeType): string {
    return NODE_COLORS[type] || '#6b7280';
}

export function getNodeIcon(type: WorkflowNodeType): string {
    return NODE_ICONS[type] || 'pi-question';
}
