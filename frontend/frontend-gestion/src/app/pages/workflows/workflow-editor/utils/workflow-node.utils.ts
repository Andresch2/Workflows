import { WorkflowNodeType } from '../../../../core/models/workflow.model';

/**
 * Constantes y utilidades compartidas para nodos de workflow.
 * Centraliza labels, colores e iconos para evitar duplicación.
 */

export const NODE_LABELS: Record<WorkflowNodeType, string> = {
    [WorkflowNodeType.TRIGGER]: 'Trigger',
    [WorkflowNodeType.HTTP]: 'HTTP',
    [WorkflowNodeType.WEBHOOK]: 'Webhook',
    [WorkflowNodeType.DATABASE]: 'Database',
    [WorkflowNodeType.SET]: 'Set Variable',
    [WorkflowNodeType.NOTIFICATION]: 'Notificación',
    [WorkflowNodeType.DELAY]: 'Delay',
    [WorkflowNodeType.FORM]: 'Formulario',
};

export const NODE_COLORS: Record<WorkflowNodeType, string> = {
    [WorkflowNodeType.TRIGGER]: '#6366f1',
    [WorkflowNodeType.HTTP]: '#22c55e',
    [WorkflowNodeType.WEBHOOK]: '#f59e0b',
    [WorkflowNodeType.DATABASE]: '#3b82f6',
    [WorkflowNodeType.SET]: '#f43f5e',
    [WorkflowNodeType.NOTIFICATION]: '#10b981',
    [WorkflowNodeType.DELAY]: '#ef4444',
    [WorkflowNodeType.FORM]: '#8b5cf6',
};

export const NODE_ICONS: Record<WorkflowNodeType, string> = {
    [WorkflowNodeType.TRIGGER]: 'pi-bolt',
    [WorkflowNodeType.HTTP]: 'pi-globe',
    [WorkflowNodeType.WEBHOOK]: 'pi-link',
    [WorkflowNodeType.DATABASE]: 'pi-database',
    [WorkflowNodeType.SET]: 'pi-tags',
    [WorkflowNodeType.NOTIFICATION]: 'pi-bell',
    [WorkflowNodeType.DELAY]: 'pi-clock',
    [WorkflowNodeType.FORM]: 'pi-list',
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
