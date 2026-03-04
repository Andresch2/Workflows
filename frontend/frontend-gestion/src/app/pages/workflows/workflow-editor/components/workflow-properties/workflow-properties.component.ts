import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';

import { EditorNode, WorkflowNodeType } from '../../../../../core/models/workflow.model';
import { getNodeColor as sharedGetNodeColor, getNodeLabel as sharedGetNodeLabel } from '../../utils/workflow-node.utils';

// Subcomponentes standalone de Propiedades (Fase 3)
import { DatabasePropertiesComponent } from './node-types/database-properties.component';
import { DelayPropertiesComponent } from './node-types/delay-properties.component';
import { FormPropertiesComponent } from './node-types/form-properties.component';
import { HttpPropertiesComponent } from './node-types/http-properties.component';
import { NotificationPropertiesComponent } from './node-types/notification-properties.component';
import { SetPropertiesComponent } from './node-types/set-properties.component';
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
        // Nodos hijos
        HttpPropertiesComponent,
        DatabasePropertiesComponent,
        DelayPropertiesComponent,
        NotificationPropertiesComponent,
        FormPropertiesComponent,
        WebhookPropertiesComponent,
        SetPropertiesComponent
    ],
    templateUrl: './workflow-properties.component.html',
    styleUrls: []
})
export class WorkflowPropertiesComponent implements OnChanges, OnInit {
    @Input({ required: true }) node!: EditorNode;
    @Input() parentNode: EditorNode | null = null;

    // Lista de ancestros (Fase 4). Provisionalmente un arreglo vacío hasta conectar el canvas.
    @Input() availableAncestors: EditorNode[] = [];

    @Output() configChange = new EventEmitter<Record<string, any>>();
    @Output() connectNode = new EventEmitter<EditorNode>();
    @Output() deleteNode = new EventEmitter<EditorNode>();
    @Output() disconnectNode = new EventEmitter<EditorNode>();

    // Advanced JSON
    configJson = signal('{}');
    configValid = signal(true);
    showAdvancedJson = signal(false);

    // Parent Node Data
    ancestorPanels = signal<Array<{
        node: EditorNode,
        expanded: boolean,
        fields: { key: string; value: string; icon: string; dragText: string }[]
    }>>([]);

    ngOnInit() { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['node'] || changes['parentNode'] || changes['availableAncestors']) {
            const currentConfig = this.node?.config || {};
            this.configJson.set(JSON.stringify(currentConfig, null, 2));
            this.configValid.set(true);
            this.updateAncestorPanels();
        }
    }

    private updateAncestorPanels() {
        const panels = [];
        const ancestors = this.availableAncestors && this.availableAncestors.length > 0
            ? this.availableAncestors
            : (this.parentNode ? [this.parentNode] : []);

        for (const ancestor of ancestors) {
            const config = ancestor.config || {};
            const fields: { key: string; value: string; icon: string; dragText: string }[] = [];

            const addField = (k: string, v: string, i: string) => {
                fields.push({
                    key: k, value: v, icon: i,
                    // Fase 4: Mapeo {{ nodes.ID_NODO.data.campo }} para interpolacion del backend!
                    dragText: `{{ nodes.${ancestor.id}.data.${k} }}`
                });
            };

            switch (ancestor.type) {
                case WorkflowNodeType.HTTP:
                    if (config['url']) addField('url', String(config['url']), 'pi-link');
                    break;
                case WorkflowNodeType.DATABASE:
                    if (config['nombre']) addField('nombre', String(config['nombre']), 'pi-table');
                    if (config['endpoint']) addField('endpoint', String(config['endpoint']), 'pi-link');
                    break;
                case WorkflowNodeType.FORM:
                    if (config['title']) addField('title', String(config['title']), 'pi-align-left');
                    if (Array.isArray(config['fields'])) {
                        config['fields'].forEach((f: any) => {
                            addField(f.name, `(tipo: ${f.type})`, 'pi-id-card');
                        });
                    }
                    break;
                default:
                    for (const [key, value] of Object.entries(config)) {
                        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                            addField(key, String(value), 'pi-hashtag');
                        }
                    }
                    break;
            }


            fields.push({ key: 'Objeto Completo', value: 'Data Resultante', icon: 'pi-box', dragText: `{{ nodes.${ancestor.id} }}` });

            panels.push({
                node: ancestor,
                // Expandir default el padre inmediato
                expanded: ancestor.id === this.parentNode?.id,
                fields
            });
        }

        this.ancestorPanels.set(panels.reverse()); // mostrar los más recientes (más cercanos) arriba
    }

    togglePanel(panel: any) {
        panel.expanded = !panel.expanded;
        this.ancestorPanels.set([...this.ancestorPanels()]);
    }

    /** Emisión desde los subcomponentes */
    onConfigChangeFromChild(config: Record<string, any>) {
        this.configJson.set(JSON.stringify(config, null, 2));
        this.configValid.set(true);
        this.configChange.emit(config);
    }

    /** Edición directa del JSON avanzado */
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

    getNodeLabel(type: WorkflowNodeType): string {
        return sharedGetNodeLabel(type);
    }

    getNodeColor(type: WorkflowNodeType): string {
        return sharedGetNodeColor(type);
    }

    onFieldDragStart(event: DragEvent, fieldKey: string) {
        if (event.dataTransfer) {
            event.dataTransfer.setData('text/plain', `{{ '{' + '{ ' + fieldKey + ' }' + '}' }}`);
            event.dataTransfer.effectAllowed = 'copy';
        }
    }
}
