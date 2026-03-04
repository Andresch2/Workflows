import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { EditorNode } from '../../../../../../core/models/workflow.model';
import { WorkflowService } from '../../../../../../core/services/workflow.service';

@Component({
    selector: 'app-webhook-properties',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, TextareaModule, ButtonModule],
    template: `
    <div class="form-section">
        <h5><i class="pi pi-link"></i> Configuración Webhook</h5>
        <div class="form-group">
            <label>URL destino</label>
            <input pInputText [ngModel]="webhookUrl()" (ngModelChange)="webhookUrl.set($event); onFieldChange()"
                placeholder="https://webhook.site/..." class="w-full" />
        </div>
        <div class="form-group">
            <label>Payload (JSON)</label>
            <textarea pTextarea [ngModel]="webhookPayload()"
                (ngModelChange)="webhookPayload.set($event); onFieldChange()"
                placeholder='{ "evento": "nuevo_registro" }' rows="4" class="w-full"></textarea>
        </div>
        
        <div class="form-group mt-3">
            <p-button label="Probar Webhook" icon="pi pi-play" size="small" severity="secondary"
                [loading]="testing()" (onClick)="testWebhookNode()" />
        </div>

        @if (testResult()) {
            <div class="form-group mt-2" style="padding: 0.75rem; border-radius: 8px; font-size: 0.85rem;"
                 [style.background]="testResult()?.status === 'success' ? '#f0fdf4' : '#fef2f2'">
                <strong>{{ testResult()?.status === 'success' ? '✅ Enviado' : '❌ Error' }}</strong>
                @if (testResult()?.statusCode) {
                    <span> — HTTP {{ testResult()?.statusCode }}</span>
                }
                @if (testResult()?.error) {
                    <p style="margin: 0.5rem 0 0 0; color: #dc2626;">{{ testResult()?.error }}</p>
                }
            </div>
        }
    </div>
  `
})
export class WebhookPropertiesComponent implements OnChanges {
    @Input({ required: true }) node!: EditorNode;
    @Input() availableAncestors: EditorNode[] = [];
    @Output() configChange = new EventEmitter<Record<string, any>>();

    private workflowService = inject(WorkflowService);
    private messageService = inject(MessageService);

    webhookUrl = signal('');
    webhookPayload = signal('');
    testing = signal(false);
    testResult = signal<any>(null);

    ngOnChanges(changes: SimpleChanges) {
        if (changes['node'] && this.node) {
            const config = this.node.config || {};
            this.webhookUrl.set(config['url'] || '');
            this.webhookPayload.set(config['payload'] ? (typeof config['payload'] === 'string' ? config['payload'] : JSON.stringify(config['payload'], null, 2)) : '');
            this.testResult.set(null);
        }
    }

    onFieldChange() {
        this.configChange.emit({
            url: this.webhookUrl(),
            ...(this.webhookPayload() ? { payload: this.safeParseJson(this.webhookPayload()) } : {}),
        });
    }

    testWebhookNode() {
        if (!this.webhookUrl()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Sin URL',
                detail: 'Configura una URL antes de probar',
            });
            return;
        }

        this.testing.set(true);
        this.testResult.set(null);

        const payload = this.webhookPayload() ? this.safeParseJson(this.webhookPayload()) : {};

        this.workflowService.testWebhook({
            url: this.webhookUrl(),
            payload,
        }).subscribe({
            next: (result) => {
                this.testing.set(false);
                this.testResult.set(result);
                this.messageService.add({
                    severity: result.status === 'success' ? 'success' : 'error',
                    summary: result.status === 'success' ? 'Webhook enviado' : 'Error',
                    detail: result.status === 'success'
                        ? `POST exitoso — HTTP ${result.statusCode}`
                        : result.error || 'Error desconocido',
                });
            },
            error: (err) => {
                this.testing.set(false);
                this.testResult.set({ status: 'failed', error: err.message });
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error de conexión',
                    detail: err.error?.message || err.message || 'No se pudo conectar al backend',
                });
            },
        });
    }

    private safeParseJson(value: string): any {
        try { return JSON.parse(value); } catch { return value; }
    }
}
