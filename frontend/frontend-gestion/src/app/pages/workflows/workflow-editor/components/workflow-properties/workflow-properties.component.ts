import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    computed,
    inject,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';
import { MessageService, TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TreeModule } from 'primeng/tree';
import {
    EditorNode,
    WorkflowNodeType,
} from '../../../../../core/models/workflow.model';
import {
    getNodeColor as sharedGetNodeColor,
    getNodeLabel as sharedGetNodeLabel,
} from '../../utils/workflow-node.utils';
import { DatabasePropertiesComponent } from './node-types/database-properties.component';
import { DelayPropertiesComponent } from './node-types/delay-properties.component';
import { FormPropertiesComponent } from './node-types/form-properties.component';
import { HttpPropertiesComponent } from './node-types/http-properties.component';
import { IfPropertiesComponent } from './node-types/if-properties.component';
import { NotificationPropertiesComponent } from './node-types/notification-properties.component';
import { WebhookPropertiesComponent } from './node-types/webhook-properties.component';

type AncestorPanel = {
    node: EditorNode;
    treeNodes: TreeNode[];
    isJsonShortcut: boolean;
};

type PointerPosition = {
    x: number;
    y: number;
};

@Component({
    selector: 'app-workflow-properties',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        TagModule,
        TextareaModule,
        TreeModule,
        HttpPropertiesComponent,
        DatabasePropertiesComponent,
        DelayPropertiesComponent,
        NotificationPropertiesComponent,
        FormPropertiesComponent,
        WebhookPropertiesComponent,
        IfPropertiesComponent,
        CardModule,
        AccordionModule,
    ],
    templateUrl: './workflow-properties.component.html',
    styleUrls: ['./workflow-properties.component.css'],
})
export class WorkflowPropertiesComponent implements OnChanges, OnInit, OnDestroy {
    @Input({ required: true }) node!: EditorNode;
    @Input() parentNode: EditorNode | null = null;
    @Input() availableAncestors: EditorNode[] = [];

    @Output() configChange = new EventEmitter<Record<string, any>>();
    @Output() connectNode = new EventEmitter<EditorNode>();
    @Output() deleteNode = new EventEmitter<EditorNode>();
    @Output() disconnectNode = new EventEmitter<EditorNode>();
    @Output() nameChange = new EventEmitter<string>();

    private messageService = inject(MessageService);

    configJson = signal('{}');
    configValid = signal(true);
    isExpandedInput = signal(true);
    showAdvancedJson = signal(false);

    currentInputTab = signal<'schema' | 'json'>('schema');
    ancestorPanels = signal<AncestorPanel[]>([]);
    expandedPanels = computed(() => this.ancestorPanels().map((p) => p.node.id));

    ancestorsJsonData = computed(() => {
        const data: Record<string, any> = {};
        const nodes = this.getUniqueAncestors();

        for (const ancestor of nodes) {
            const nodeName = this.getNodeReferenceName(ancestor);
            data[nodeName] = this.resolveNodeSchema(ancestor);
        }

        return data;
    });

    private lastFocusedInput: HTMLInputElement | HTMLTextAreaElement | null = null;
    private currentDragTarget: HTMLInputElement | HTMLTextAreaElement | null = null;
    private isDraggingVariable = false;
    private draggingExpression: string | null = null;
    private dragPointerId: number | null = null;
    private dragStartPosition: PointerPosition | null = null;
    private dragPreviewElement: HTMLDivElement | null = null;

    private readonly handleFocusIn = (event: Event) => {
        const target = event.target as HTMLElement | null;
        if (!target) return;

        const isFromProperties = !!target.closest('.properties-column');

        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
            if (this.lastFocusedInput) {
                this.lastFocusedInput.classList.remove('active-variable-target');
            }

            if (isFromProperties) {
                this.lastFocusedInput = target;
                this.lastFocusedInput.classList.add('active-variable-target');
            } else {
                this.lastFocusedInput = null;
            }
        }
    };

    private readonly handlePointerMove = (event: PointerEvent) => {
        if (this.dragPointerId !== event.pointerId || !this.draggingExpression) {
            return;
        }

        if (!this.isDraggingVariable) {
            if (!this.dragStartPosition) {
                return;
            }

            const deltaX = event.clientX - this.dragStartPosition.x;
            const deltaY = event.clientY - this.dragStartPosition.y;
            if (Math.hypot(deltaX, deltaY) < 5) {
                return;
            }

            this.isDraggingVariable = true;
            this.createDragPreview(this.draggingExpression);
        }

        event.preventDefault();
        this.updateDragPreviewPosition(event.clientX, event.clientY);
        const target = this.getDropTargetFromPoint(event.clientX, event.clientY);
        this.setCurrentDragTarget(target);
    };

    private readonly handlePointerUp = (event: PointerEvent) => {
        if (this.dragPointerId !== event.pointerId || !this.draggingExpression) {
            return;
        }

        if (this.isDraggingVariable) {
            const target = this.getDropTargetFromPoint(event.clientX, event.clientY);
            const inserted = target
                ? this.insertExpressionIntoField(target, this.draggingExpression)
                : false;

            if (inserted) {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Insertado',
                    detail: 'Variable insertada exitosamente',
                    life: 2000,
                });
            }
        }

        this.clearVariableDragState();
    };

    private readonly handlePointerCancel = () => {
        this.clearVariableDragState();
    };

    ngOnInit() {
        document.addEventListener('focusin', this.handleFocusIn, true);
        document.addEventListener('pointermove', this.handlePointerMove, true);
        document.addEventListener('pointerup', this.handlePointerUp, true);
        document.addEventListener('pointercancel', this.handlePointerCancel, true);
    }

    ngOnDestroy() {
        document.removeEventListener('focusin', this.handleFocusIn, true);
        document.removeEventListener('pointermove', this.handlePointerMove, true);
        document.removeEventListener('pointerup', this.handlePointerUp, true);
        document.removeEventListener('pointercancel', this.handlePointerCancel, true);
        this.clearVariableDragState();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['node'] || changes['parentNode'] || changes['availableAncestors']) {
            const currentConfig = this.node?.config || {};
            this.configJson.set(JSON.stringify(currentConfig, null, 2));
            this.configValid.set(true);
            this.updateAncestorPanels();
        }
    }

    public updateAncestorPanels() {
        const panels: AncestorPanel[] = [];

        if (this.parentNode) {
            const schema = this.resolveNodeSchema(this.parentNode);
            const basePath = '$json';
            const treeNodes = this.buildTreeWithBase(schema, '', basePath);

            panels.push({
                node: this.parentNode,
                treeNodes,
                isJsonShortcut: true,
            });
        }

        const ancestors = this.getUniqueAncestors();
        for (const ancestor of ancestors) {
            if (this.parentNode && ancestor.id === this.parentNode.id) continue;

            const schema = this.resolveNodeSchema(ancestor);
            const ancestorRef = this.getNodeReferenceName(ancestor);
            const basePath = `$node.${ancestorRef}.data`;
            const treeNodes = this.buildTreeWithBase(schema, '', basePath);

            panels.push({
                node: ancestor,
                treeNodes,
                isJsonShortcut: false,
            });
        }

        this.ancestorPanels.set(panels);
    }

    private getUniqueAncestors(): EditorNode[] {
        const seen = new Set<string>();
        const result: EditorNode[] = [];

        for (const ancestor of this.availableAncestors || []) {
            if (!ancestor?.id) continue;
            if (seen.has(ancestor.id)) continue;

            seen.add(ancestor.id);
            result.push(ancestor);
        }

        return result;
    }

    private normalizeNodeName(rawName: string): string {
        return String(rawName || '')
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_]/g, '');
    }

    private getNodeReferenceName(node: EditorNode): string {
        const rawName =
            (node as any).name ||
            node.config?.['name'] ||
            node.config?.['nombre'] ||
            node.config?.['title'] ||
            node.type;

        const normalized = this.normalizeNodeName(rawName);
        return normalized || node.type;
    }

    private resolveNodeSchema(node: EditorNode): Record<string, any> {
        if (node.dataSchema && typeof node.dataSchema === 'object') {
            const normalizedSchema = this.normalizeSchemaForExplorer(node);
            if (normalizedSchema && typeof normalizedSchema === 'object' && !Array.isArray(normalizedSchema)) {
                return normalizedSchema;
            }
            if (Array.isArray(normalizedSchema)) {
                return { body: normalizedSchema, statusCode: 200, headers: {} };
            }
        }

        return {};
    }

    private normalizeSchemaForExplorer(node: EditorNode): Record<string, any> | any[] | null {
        const raw = node.dataSchema as any;
        if (!raw || typeof raw !== 'object') return null;
        let schema: any = raw;
        if (!Array.isArray(schema) && this.isNumericKeyObject(schema)) {
            const numericKeys = Object.keys(schema)
                .map((k) => Number(k))
                .filter((n) => !Number.isNaN(n))
                .sort((a, b) => a - b);
            schema = numericKeys.map((idx) => schema[String(idx)]);
        }

        if (node.type === WorkflowNodeType.HTTP) {
            // Alinea el schema del editor con el output real
            if (Array.isArray(schema)) {
                return { statusCode: 200, body: schema, headers: {} };
            }

            const isHttpEnvelope =
                Object.prototype.hasOwnProperty.call(schema, 'body') ||
                Object.prototype.hasOwnProperty.call(schema, 'statusCode');

            if (!isHttpEnvelope) {
                return { statusCode: 200, body: schema, headers: {} };
            }

            if (
                Object.prototype.hasOwnProperty.call(schema, 'data') &&
                !Object.prototype.hasOwnProperty.call(schema, 'body')
            ) {
                return {
                    statusCode: schema.statusCode ?? 200,
                    body: schema.data,
                    headers: schema.headers ?? {},
                };
            }
        }

        return schema;
    }

    private isNumericKeyObject(value: Record<string, any>): boolean {
        const keys = Object.keys(value);
        if (keys.length === 0) return false;
        return keys.every((k) => /^\d+$/.test(k));
    }

    onConfigChangeFromChild(config: Record<string, any>) {
        this.configJson.set(JSON.stringify(config, null, 2));
        this.configValid.set(true);
        this.configChange.emit(config);
    }

    onConfigChange(value: string) {
        this.configJson.set(value);

        try {
            const parsed = JSON.parse(value);
            this.configValid.set(true);
            this.configChange.emit(parsed);
        } catch {
            this.configValid.set(false);
        }
    }

    onVariablePointerDown(event: PointerEvent, path: string, label?: string) {
        if (event.button !== 0) {
            return;
        }

        const expression = this.buildExpression(path, label);
        if (!expression) {
            return;
        }

        event.preventDefault();

        this.clearVariableDragState();
        this.draggingExpression = expression;
        this.dragPointerId = event.pointerId;
        this.dragStartPosition = {
            x: event.clientX,
            y: event.clientY,
        };
    }

    private insertExpressionIntoFocusedField(expression: string): boolean {
        return this.insertExpressionIntoField(this.lastFocusedInput, expression);
    }

    copyPath(path: string, label?: string) {
        if (this.isDraggingVariable) {
            return;
        }

        if (!path) return;

        const text = this.buildExpression(path, label);
        const inserted = this.insertExpressionIntoFocusedField(text);

        if (inserted) {
            this.messageService.add({
                severity: 'success',
                summary: 'Insertado',
                detail: 'Variable insertada en el campo activo',
                life: 2000,
            });
            return;
        }

        navigator.clipboard.writeText(text);
        this.messageService.add({
            severity: 'info',
            summary: 'Copiado',
            detail: `Variable ${text} copiada al portapapeles. Selecciona un campo para insertarla directo.`,
            life: 2500,
        });
    }

    copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
    }

    getNodeLabel(type: WorkflowNodeType): string {
        return sharedGetNodeLabel(type);
    }

    getNodeColor(type: WorkflowNodeType): string {
        return sharedGetNodeColor(type);
    }

    private buildTreeWithBase(obj: any, parentKey: string, basePath: string): TreeNode[] {
        if (obj === null || obj === undefined) return [];

        const nodes: TreeNode[] = [];

        if (Array.isArray(obj)) {
            if (obj.length > 0) {
                const item = obj[0];
                const type = this.getTypeInfo(item);
                const currentPath = parentKey ? `${parentKey}.0` : '0';
                const fullPath = basePath ? `${basePath}.${currentPath}` : currentPath;

                if (type === 'OBJECT' || type === 'ARRAY') {
                    nodes.push({
                        label: '0',
                        key: currentPath,
                        data: { path: fullPath, type },
                        leaf: false,
                        expanded: true,
                        children: this.buildTreeWithBase(item, currentPath, basePath),
                        icon: 'pi pi-fw pi-box',
                    });
                } else {
                    nodes.push({
                        label: '0',
                        key: currentPath,
                        data: { path: fullPath, type },
                        leaf: true,
                        icon: this.getIconForType(type),
                    });
                }
            }
        } else if (typeof obj === 'object') {
            for (const key of Object.keys(obj)) {
                const value = obj[key];
                const type = this.getTypeInfo(value);
                const currentPath = parentKey ? `${parentKey}.${key}` : key;
                const fullPath = basePath ? `${basePath}.${currentPath}` : currentPath;

                if (type === 'OBJECT' || type === 'ARRAY') {
                    nodes.push({
                        label: key,
                        key: currentPath,
                        data: { path: fullPath, type },
                        leaf: false,
                        expanded: true,
                        children: this.buildTreeWithBase(value, currentPath, basePath),
                        icon: type === 'ARRAY' ? 'pi pi-fw pi-list' : 'pi pi-fw pi-box',
                    });
                } else {
                    nodes.push({
                        label: key,
                        key: currentPath,
                        data: { path: fullPath, type },
                        leaf: true,
                        icon: this.getIconForType(type),
                    });
                }
            }
        }

        return nodes;
    }

    getTypeInfo(value: any): string {
        if (value === null) return 'NULL';
        if (Array.isArray(value)) return 'ARRAY';
        if (typeof value === 'object') return 'OBJECT';
        if (typeof value === 'boolean') return 'BOOLEAN';
        if (typeof value === 'number') return 'NUMBER';
        return 'STRING';
    }

    getIconForType(type: string): string {
        switch (type) {
            case 'STRING':
                return 'pi pi-fw pi-align-left';
            case 'NUMBER':
                return 'pi pi-fw pi-hashtag';
            case 'BOOLEAN':
                return 'pi pi-fw pi-check-circle';
            default:
                return 'pi pi-fw pi-circle-fill';
        }
    }

    getTypeBadgeStyle(type: string): any {
        switch (type) {
            case 'STRING':
                return { backgroundColor: '#166534', color: '#bbf7d0' };
            case 'NUMBER':
                return { backgroundColor: '#1e3a8a', color: '#bfdbfe' };
            case 'BOOLEAN':
                return { backgroundColor: '#701a75', color: '#fbcfe8' };
            case 'ARRAY':
                return { backgroundColor: '#9a3412', color: '#fed7aa' };
            case 'OBJECT':
                return { backgroundColor: '#374151', color: '#e5e7eb' };
            default:
                return { backgroundColor: '#475569', color: '#f1f5f9' };
        }
    }

    private buildExpression(path: string, label?: string): string {
        const rawPath = path?.trim();
        if (!rawPath) {
            return label ? `{{ ${label} }}` : '';
        }
        const shortLabel = (label || '').trim();
        const isSimpleIdentifier = /^[A-Za-z_][A-Za-z0-9_]*$/.test(shortLabel);
        if (isSimpleIdentifier) {
            return `{{ ${shortLabel} }}`;
        }

        const expressionPath = rawPath.startsWith('$') ? rawPath : `$json.${rawPath}`;
        return `{{ ${expressionPath} }}`;
    }

    private insertExpressionIntoField(
        field: HTMLInputElement | HTMLTextAreaElement | null,
        expression: string,
    ): boolean {
        if (!field || !document.body.contains(field) || field.disabled || field.readOnly) {
            return false;
        }

        field.focus();

        const start = field.selectionStart ?? field.value.length;
        const end = field.selectionEnd ?? field.value.length;
        const currentValue = field.value ?? '';

        field.value = currentValue.slice(0, start) + expression + currentValue.slice(end);

        const nextCursor = start + expression.length;
        field.selectionStart = nextCursor;
        field.selectionEnd = nextCursor;

        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));

        return true;
    }

    private getDropTargetFromPoint(
        x: number,
        y: number,
    ): HTMLInputElement | HTMLTextAreaElement | null {
        const elements = document.elementsFromPoint(x, y);

        for (const element of elements) {
            const target = this.resolveDropTarget(element);
            if (target) {
                return target;
            }
        }

        return null;
    }

    private resolveDropTarget(
        element: Element | null,
    ): HTMLInputElement | HTMLTextAreaElement | null {
        if (!element) {
            return null;
        }

        if (this.isSupportedDropTarget(element)) {
            return element;
        }

        if (!(element instanceof HTMLElement)) {
            return null;
        }

        const wrapper = element.closest('.p-inputwrapper, .p-inputnumber, .p-select');
        const nestedField =
            wrapper instanceof HTMLElement
                ? wrapper.querySelector('input, textarea')
                : null;

        return this.isSupportedDropTarget(nestedField) ? nestedField : null;
    }

    private isSupportedDropTarget(
        element: Element | null,
    ): element is HTMLInputElement | HTMLTextAreaElement {
        return (
            !!element &&
            (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
            !!element.closest('.properties-column') &&
            !element.disabled &&
            !element.readOnly
        );
    }

    private setCurrentDragTarget(target: HTMLInputElement | HTMLTextAreaElement | null) {
        if (this.currentDragTarget === target) {
            return;
        }

        if (this.currentDragTarget) {
            this.currentDragTarget.classList.remove('drag-over-variable');
        }

        this.currentDragTarget = target;

        if (this.currentDragTarget) {
            this.currentDragTarget.classList.add('drag-over-variable');
        }
    }

    private clearVariableDragState() {
        this.removeDragPreview();
        this.draggingExpression = null;
        this.isDraggingVariable = false;
        this.dragPointerId = null;
        this.dragStartPosition = null;
        this.setCurrentDragTarget(null);
    }

    private createDragPreview(expression: string) {
        this.removeDragPreview();

        const preview = document.createElement('div');
        preview.className = 'workflow-variable-preview';
        preview.textContent = expression;
        preview.style.position = 'fixed';
        preview.style.left = '0';
        preview.style.top = '0';
        preview.style.zIndex = '10000';
        preview.style.pointerEvents = 'none';
        preview.style.padding = '0.45rem 0.7rem';
        preview.style.borderRadius = '8px';
        preview.style.border = '1px solid #93c5fd';
        preview.style.background = 'rgba(255, 255, 255, 0.96)';
        preview.style.boxShadow = '0 10px 25px rgba(15, 23, 42, 0.18)';
        preview.style.color = '#1d4ed8';
        preview.style.fontFamily = "'JetBrains Mono', 'Fira Code', monospace";
        preview.style.fontSize = '0.72rem';
        preview.style.fontWeight = '600';
        preview.style.whiteSpace = 'nowrap';
        preview.style.opacity = '1';
        preview.style.transform = 'translate3d(0, 0, 0)';
        document.body.appendChild(preview);
        this.dragPreviewElement = preview;
    }

    private updateDragPreviewPosition(x: number, y: number) {
        if (!this.dragPreviewElement) {
            return;
        }

        this.dragPreviewElement.style.left = `${x + 14}px`;
        this.dragPreviewElement.style.top = `${y + 14}px`;
    }

    private removeDragPreview() {
        this.dragPreviewElement?.remove();
        this.dragPreviewElement = null;
    }
}
