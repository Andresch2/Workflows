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
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
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
import { NotificationPropertiesComponent } from './node-types/notification-properties.component';
import { WebhookPropertiesComponent } from './node-types/webhook-properties.component';
import { IfPropertiesComponent } from './node-types/if-properties.component';

type AncestorPanel = {
    node: EditorNode;
    treeNodes: TreeNode[];
    isJsonShortcut: boolean;
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
        DragDropModule,
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

    private readonly handleFocusIn = (event: Event) => {
        const target = event.target as HTMLElement | null;
        if (!target) return;

        // Skip adding class to the inputs inside the data explorer itself (like search if we had one)
        // Only target inputs inside the config/properties left section.
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

    ngOnInit() {
        document.addEventListener('focusin', this.handleFocusIn, true);
    }

    ngOnDestroy() {
        document.removeEventListener('focusin', this.handleFocusIn, true);
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
            const basePath = ''; // Se usa ruta directa que mapea a $json
            const treeNodes = this.buildTreeWithBase(schema, '', basePath);

            panels.push({
                node: this.parentNode,
                treeNodes,
                isJsonShortcut: true,
            });
        }

        for (const ancestor of this.getUniqueAncestors()) {
            const schema = this.resolveNodeSchema(ancestor);
            const basePath = ''; // Se usa ruta directa que mapea a resolucion profunda  
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
            return node.dataSchema;
        }

        return {};
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

    onCdkDragEnd(event: CdkDragEnd, path: string, label?: string) {
        const dropPoint = event.dropPoint;
        // Find the element at the drop coordinates
        const el = document.elementFromPoint(dropPoint.x, dropPoint.y) as HTMLElement;
        
        if (!el) return;
        
        // Find the closest input or textarea
        const inputOrTextarea = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ? el : el.querySelector('input, textarea');
        
        if (inputOrTextarea && (inputOrTextarea instanceof HTMLInputElement || inputOrTextarea instanceof HTMLTextAreaElement)) {
            // Check if it's inside the properties column so we don't drop in random places
            if (!inputOrTextarea.closest('.properties-column')) return;

            const insertText = label ? `{{ ${label} }}` : `{{ ${path} }}`;
            
            inputOrTextarea.focus();
            const start = inputOrTextarea.selectionStart ?? inputOrTextarea.value.length;
            const end = inputOrTextarea.selectionEnd ?? inputOrTextarea.value.length;
            const currentValue = inputOrTextarea.value ?? '';
            
            inputOrTextarea.value = currentValue.slice(0, start) + insertText + currentValue.slice(end);
            
            const nextCursor = start + insertText.length;
            inputOrTextarea.selectionStart = nextCursor;
            inputOrTextarea.selectionEnd = nextCursor;
            
            inputOrTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            inputOrTextarea.dispatchEvent(new Event('change', { bubbles: true }));
            
            this.messageService.add({
                severity: 'success',
                summary: 'Insertado',
                detail: 'Variable insertada exitosamente',
                life: 2000,
            });
        }
    }

    private insertExpressionIntoFocusedField(expression: string): boolean {
        const el = this.lastFocusedInput;

        if (!el || !document.body.contains(el)) {
            return false;
        }

        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        const currentValue = el.value ?? '';

        el.value = currentValue.slice(0, start) + expression + currentValue.slice(end);

        const nextCursor = start + expression.length;
        el.selectionStart = nextCursor;
        el.selectionEnd = nextCursor;

        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.focus();

        return true;
    }

    copyPath(path: string, label?: string) {
        if (!path) return;

        const text = label ? `{{ ${label} }}` : `{{ ${path} }}`;
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
}