import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { EditorNode } from '../../../../../../core/models/workflow.model';
import { WorkflowService } from '../../../../../../core/services/workflow.service';

@Component({
    selector: 'app-http-properties',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, TextareaModule, SelectModule, ButtonModule],
    template: `
    <div class="form-section">
        <h5><i class="pi pi-globe"></i> HTTP (Postman Style)</h5>

        <div class="flex flex-col gap-1 w-full mb-3">
            <label>Método</label>
            <p-select [options]="httpMethods" [ngModel]="httpMethod()"
                (ngModelChange)="httpMethod.set($event); emitConfig()"
                styleClass="w-full" appendTo="body" />
        </div>

        <div class="flex flex-col gap-1 w-full mb-3">
            <label>URL</label>
            <input pInputText [ngModel]="httpUrl()"
                (ngModelChange)="httpUrl.set($event); emitConfig()"
                class="w-full" placeholder="https://api.example.com/resource" />
        </div>

        <div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.5rem; padding: 0.4rem 0.6rem; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px;">
            <i class="pi pi-info-circle" style="color: #38bdf8; margin-right: 0.25rem;"></i>
            Use variables del Data Explorer: <code style="background: #e0f2fe; color: #0369a1; padding: 0.1rem 0.3rem; border-radius: 3px; font-weight: 600;">$json.campo</code>
        </div>

        <div style="display:flex; gap:.5rem; margin-bottom:.75rem;">
            <button pButton type="button" [severity]="activeTab() === 'headers' ? 'primary' : 'secondary'" size="small"
                label="Headers" (click)="activeTab.set('headers')"></button>
            <button pButton type="button" [severity]="activeTab() === 'body' ? 'primary' : 'secondary'" size="small"
                label="Raw JSON Body" (click)="activeTab.set('body')"></button>
            <button pButton type="button" [severity]="activeTab() === 'expected' ? 'primary' : 'secondary'" size="small"
                label="Expected Response" (click)="activeTab.set('expected')"></button>
        </div>

        @if (activeTab() === 'headers') {
            <textarea pTextarea [ngModel]="httpHeadersRaw()"
                (ngModelChange)="httpHeadersRaw.set($event); emitConfig()"
                rows="6" class="w-full" style="font-family: monospace;"
                placeholder='{"Authorization":"Bearer ..."}'></textarea>
        }

        @if (activeTab() === 'body') {
            <textarea pTextarea [ngModel]="httpBodyRaw()"
                (ngModelChange)="httpBodyRaw.set($event); emitConfig()"
                rows="10" class="w-full" style="font-family: monospace;"
                [placeholder]="bodyPlaceholder"></textarea>
        }

        @if (activeTab() === 'expected') {
            <textarea pTextarea [ngModel]="expectedResponseRaw()"
                (ngModelChange)="onExpectedResponseChange($event)"
                rows="10" class="w-full" style="font-family: monospace;"
                placeholder='{"ok": true, "id": 1}'></textarea>
            @if (!expectedResponseValid()) {
                <small style="color:#ef4444;">Expected Response inválido</small>
            }
        }

        <div class="flex flex-col gap-1 w-full mt-3">
            <p-button label="Probar HTTP" icon="pi pi-play" size="small" severity="secondary"
                (onClick)="testHttpNode()" [loading]="testingHttp()" />
        </div>
    </div>
  `,
})
export class HttpPropertiesComponent implements OnChanges {
    @Input({ required: true }) node!: EditorNode;
    @Input() availableAncestors: EditorNode[] = [];
    @Output() configChange = new EventEmitter<Record<string, any>>();

    private workflowService = inject(WorkflowService);
    private messageService = inject(MessageService);

    httpMethod = signal('POST');
    httpUrl = signal('');
    httpBodyRaw = signal('{}');
    httpHeadersRaw = signal('{}');
    expectedResponseRaw = signal('{}');
    expectedResponseValid = signal(true);
    activeTab = signal<'headers' | 'body' | 'expected'>('body');
    testingHttp = signal(false);
    bodyPlaceholder = '{"cliente_id":"{{ $json.body.cliente_id }}"}';

    httpMethods = [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' },
        { label: 'DELETE', value: 'DELETE' },
    ];

    ngOnChanges(changes: SimpleChanges) {
        if (changes['node'] && this.node) {
            const config = this.node.config || {};
            this.httpMethod.set((config['method'] || 'POST').toUpperCase());
            this.httpUrl.set(config['url'] || '');
            this.httpBodyRaw.set(typeof config['bodyRaw'] === 'string' ? config['bodyRaw'] : JSON.stringify(config['bodyRaw'] || {}, null, 2));
            this.httpHeadersRaw.set(typeof config['headersRaw'] === 'string' ? config['headersRaw'] : JSON.stringify(config['headersRaw'] || {}, null, 2));

            const expected = this.node.dataSchema || {};
            this.expectedResponseRaw.set(JSON.stringify(expected, null, 2));
            this.expectedResponseValid.set(true);
        }
    }

    private buildConfig(): Record<string, any> {
        return {
            method: this.httpMethod(),
            url: this.httpUrl(),
            headersRaw: this.httpHeadersRaw(),
            bodyRaw: this.httpBodyRaw(),
        };
    }

    emitConfig() {
        const current = this.buildConfig();
        this.configChange.emit({
            ...current,
            __dataSchema: this.safeParseJson(this.expectedResponseRaw()),
        });
    }

    onExpectedResponseChange(value: string) {
        this.expectedResponseRaw.set(value);
        try {
            JSON.parse(value || '{}');
            this.expectedResponseValid.set(true);
            this.emitConfig();
        } catch {
            this.expectedResponseValid.set(false);
        }
    }

    testHttpNode() {
        if (!this.httpUrl()) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'La URL es obligatoria' });
            return;
        }

        this.testingHttp.set(true);
        const payload = {
            method: this.httpMethod(),
            url: this.httpUrl(),
            headers: this.safeParseJson(this.httpHeadersRaw()),
            body: this.safeParseJson(this.httpBodyRaw()),
        };

        this.workflowService.testHttpNode(payload).subscribe({
            next: (res) => {
                const expected = res?.data ?? {};
                this.expectedResponseRaw.set(JSON.stringify(expected, null, 2));
                this.expectedResponseValid.set(true);
                this.testingHttp.set(false);
                this.emitConfig();
                this.messageService.add({ severity: 'success', summary: 'HTTP OK', detail: 'Expected Response actualizado' });
            },
            error: (err) => {
                this.testingHttp.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error HTTP',
                    detail: err?.error?.message || err?.message || 'No se pudo probar el nodo HTTP',
                });
            },
        });
    }

    private safeParseJson(value: string): any {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }
}
