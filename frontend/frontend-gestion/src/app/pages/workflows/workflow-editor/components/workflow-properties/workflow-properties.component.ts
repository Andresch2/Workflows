import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';
import { TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TreeModule } from 'primeng/tree';
import { EditorNode, WorkflowNodeType } from '../../../../../core/models/workflow.model';
import { getNodeColor as sharedGetNodeColor, getNodeLabel as sharedGetNodeLabel } from '../../utils/workflow-node.utils';
import { DatabasePropertiesComponent } from './node-types/database-properties.component';
import { DelayPropertiesComponent } from './node-types/delay-properties.component';
import { FormPropertiesComponent } from './node-types/form-properties.component';
import { HttpPropertiesComponent } from './node-types/http-properties.component';
import { NotificationPropertiesComponent } from './node-types/notification-properties.component';
import { WebhookPropertiesComponent } from './node-types/webhook-properties.component';

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
        CardModule,
        AccordionModule,
    ],
    templateUrl: './workflow-properties.component.html',
    styleUrls: [],
})
export class WorkflowPropertiesComponent implements OnChanges {
    @Input({ required: true }) node!: EditorNode;
    @Input() parentNode: EditorNode | null = null;
    @Input() availableAncestors: EditorNode[] = [];

    @Output() configChange = new EventEmitter<Record<string, any>>();
    @Output() connectNode = new EventEmitter<EditorNode>();
    @Output() deleteNode = new EventEmitter<EditorNode>();
    @Output() disconnectNode = new EventEmitter<EditorNode>();

    configJson = signal('{}');
    configValid = signal(true);
    showAdvancedJson = signal(false);
    ancestorPanels = signal<Array<{ node: EditorNode; treeNodes: TreeNode[] }>>([]);
    globalTreeNodes = signal<TreeNode[]>([]);
    expandedPanels = computed(() => ['globals', ...this.ancestorPanels().map((p) => p.node.id)]);

    ngOnChanges(changes: SimpleChanges) {
        if (changes['node'] || changes['parentNode'] || changes['availableAncestors']) {
            const currentConfig = this.node?.config || {};
            this.configJson.set(JSON.stringify(currentConfig, null, 2));
            this.configValid.set(true);
            this.updateAncestorPanels();
            this.updateGlobalVars();
        }
    }

    private updateAncestorPanels() {
        const panels = [];
        for (const ancestor of this.availableAncestors || []) {
            const schema = this.resolveNodeSchema(ancestor);
            const children = this.buildTreeWithBase(schema, '', `nodes.${ancestor.id}.data`);
            const treeNodes: TreeNode[] = [{
                label: 'data',
                icon: 'pi pi-database',
                expanded: true,
                children,
                data: { path: `nodes.${ancestor.id}.data`, type: 'OBJECT' },
            }];

            panels.push({ node: ancestor, treeNodes });
        }
        this.ancestorPanels.set(panels.reverse());
    }

    private updateGlobalVars() {
        const globalNodes: TreeNode[] = [
            { label: '$now', data: { path: '$now', type: 'STRING' }, leaf: true, icon: 'pi pi-clock' },
            { label: '$execution_id', data: { path: '$execution_id', type: 'STRING' }, leaf: true, icon: 'pi pi-hashtag' },
            { label: 'globals.now', data: { path: 'globals.now', type: 'STRING' }, leaf: true, icon: 'pi pi-globe' },
            { label: 'globals.today', data: { path: 'globals.today', type: 'STRING' }, leaf: true, icon: 'pi pi-calendar' },
            { label: 'globals.execution_id', data: { path: 'globals.execution_id', type: 'STRING' }, leaf: true, icon: 'pi pi-key' },
        ];
        this.globalTreeNodes.set(globalNodes);
    }

    private resolveNodeSchema(node: EditorNode): Record<string, any> {
        if (node.dataSchema && typeof node.dataSchema === 'object') return node.dataSchema;
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

    onFieldDragStart(event: DragEvent, path: string) {
        if (!event.dataTransfer || !path) return;
        event.dataTransfer.setData('text/plain', `{{ ${path} }}`);
        event.dataTransfer.effectAllowed = 'copy';
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
                const fullPath = `${basePath}.${currentPath}`;
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
                const fullPath = `${basePath}.${currentPath}`;
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
            case 'STRING': return 'pi pi-fw pi-language';
            case 'NUMBER': return 'pi pi-fw pi-hashtag';
            case 'BOOLEAN': return 'pi pi-fw pi-check-circle';
            default: return 'pi pi-fw pi-circle-fill';
        }
    }

    getTypeBadgeStyle(type: string): any {
        switch (type) {
            case 'STRING': return { backgroundColor: '#166534', color: '#bbf7d0' };
            case 'NUMBER': return { backgroundColor: '#1e3a8a', color: '#bfdbfe' };
            case 'BOOLEAN': return { backgroundColor: '#701a75', color: '#fbcfe8' };
            case 'ARRAY': return { backgroundColor: '#9a3412', color: '#fed7aa' };
            case 'OBJECT': return { backgroundColor: '#374151', color: '#e5e7eb' };
            default: return { backgroundColor: '#475569', color: '#f1f5f9' };
        }
    }
}
