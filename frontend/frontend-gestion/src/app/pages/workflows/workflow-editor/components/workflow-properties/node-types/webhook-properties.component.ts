import { environment } from '@/environments/environment';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { EditorNode } from '../../../../../../core/models/workflow.model';
import { WorkflowService } from '../../../../../../core/services/workflow.service';

@Component({
    selector: 'app-webhook-properties',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, TextareaModule, ButtonModule, TooltipModule],
    template: `
    <div class="form-section">
        <h5><i class="pi pi-inbox"></i> Webhook Trigger</h5>

        <div class="flex flex-col gap-1 w-full mb-3">
            <label>URL del Webhook</label>
            <div style="display:flex; gap:.5rem; align-items:center;">
                <input pInputText [value]="webhookUrl()" readonly class="w-full"
                    style="font-family: monospace; font-size: .85rem;" />
                <p-button icon="pi pi-copy" size="small" severity="secondary" (onClick)="copyUrl()" />
            </div>
        </div>

        <div class="flex flex-col gap-1 w-full mb-3">
            <label>Expected Body (JSON)</label>
            <textarea pTextarea [ngModel]="expectedBodyText()"
                (ngModelChange)="onExpectedBodyChange($event)" rows="8" class="w-full"
                placeholder='{"cliente_id": 1, "nombre": "Juan"}'
                style="font-family: monospace;"></textarea>
            @if (!expectedBodyValid()) {
                <small style="color:#ef4444;">JSON inválido</small>
            }
        </div>

        <div class="flex flex-col gap-1 w-full mb-3">
            <p-button label="Escuchar Payload Real" icon="pi pi-play" size="small" severity="secondary"
                [loading]="isListening()" (onClick)="startListening()" />
        </div>
    </div>
  `
})
export class WebhookPropertiesComponent implements OnChanges, OnDestroy {
    @Input({ required: true }) node!: EditorNode;
    @Input() availableAncestors: EditorNode[] = [];
    @Output() configChange = new EventEmitter<Record<string, any>>();

    private messageService = inject(MessageService);
    private workflowService = inject(WorkflowService);

    webhookUrl = signal('');
    expectedBodyText = signal('{}');
    expectedBodyValid = signal(true);
    isListening = signal(false);
    private pollingInterval: ReturnType<typeof setInterval> | null = null;

    ngOnChanges(changes: SimpleChanges) {
        if (changes['node'] && this.node) {
            this.webhookUrl.set(this.buildWebhookUrl(this.node.workflowId));
            const schemaBody = (this.node.dataSchema as any)?.['body'] || {};
            this.expectedBodyText.set(JSON.stringify(schemaBody, null, 2));
            this.expectedBodyValid.set(true);
        }
    }

    ngOnDestroy() {
        this.stopPolling();
    }

    onExpectedBodyChange(value: string) {
        this.expectedBodyText.set(value);
        try {
            const parsed = JSON.parse(value || '{}');
            this.expectedBodyValid.set(true);
            this.emitWithSchema(parsed);
        } catch {
            this.expectedBodyValid.set(false);
        }
    }

    startListening() {
        if (this.isListening()) return;
        this.isListening.set(true);
        this.stopPolling();

        this.pollingInterval = setInterval(() => {
            this.workflowService.getLatestWebhookPayload(this.node.workflowId).subscribe({
                next: (payload) => {
                    if (payload === null) return;
                    const packet =
                        payload && typeof payload === 'object' && ('body' in payload || 'headers' in payload || 'query' in payload)
                            ? payload
                            : { body: payload || {}, headers: {}, query: {} };

                    this.isListening.set(false);
                    this.stopPolling();

                    this.expectedBodyText.set(JSON.stringify(packet.body || {}, null, 2));
                    this.expectedBodyValid.set(true);
                    this.emitWithSchema(packet.body || {}, packet.headers || {}, packet.query || {});

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Webhook capturado',
                        detail: 'Se actualizó el Expected Body con el payload real',
                    });
                },
            });
        }, 2000);
    }

    private emitWithSchema(body: any, headers: any = {}, query: any = {}) {
        const nextConfig = { ...(this.node.config || {}) };

        this.configChange.emit({
            ...nextConfig,
            __dataSchema: {
                body: body || {},
                headers: headers || {},
                query: query || {},
            },
        });
    }

    private stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    private buildWebhookUrl(workflowId: string): string {
        const base = (environment.apiUrl || '/api/v1').replace(/\/$/, '');
        if (/^https?:\/\//i.test(base)) {
            return `${base}/workflows/webhook/${workflowId}`;
        }
        const normalized = base.startsWith('/') ? base : `/${base}`;
        return `${window.location.origin}${normalized}/workflows/webhook/${workflowId}`;
    }

    async copyUrl() {
        try {
            await navigator.clipboard.writeText(this.webhookUrl());
        } catch { }
    }
}
