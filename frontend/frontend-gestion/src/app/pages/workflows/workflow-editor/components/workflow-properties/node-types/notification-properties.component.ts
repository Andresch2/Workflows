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
    selector: 'app-notification-properties',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, TextareaModule, ButtonModule],
    template: `
    <div class="form-section">
        <h5><i class="pi pi-bell"></i> Configuración Notificación</h5>
        <div class="form-group">
            <label>Destinatario</label>
            <input pInputText [ngModel]="notifRecipient()"
                (ngModelChange)="notifRecipient.set($event); onFieldChange()" placeholder="admin@empresa.com o {{ '{' + '{ variable }' + '}' }}"
                class="w-full" />
        </div>
        <div class="form-group">
            <label>Mensaje</label>
            <textarea pTextarea [ngModel]="notifMessage()"
                (ngModelChange)="notifMessage.set($event); onFieldChange()"
                placeholder="Se completó el proceso..." rows="3" class="w-full"></textarea>
        </div>
        <div class="form-group">
            <label>URL de Webhook <small style="color: #9ca3af;">(Slack, Discord, etc. — opcional)</small></label>
            <input pInputText [ngModel]="notifUrl()"
                (ngModelChange)="notifUrl.set($event); onFieldChange()"
                placeholder="https://hooks.slack.com/services/..." class="w-full" />
        </div>

        @if (!notifUrl()) {
            <small style="color: #f59e0b; display: block; margin-bottom: 0.5rem;">
                ⚠️ Sin URL, la notificación solo se registra en el log del servidor.
                Agrega un webhook de Slack/Discord/Teams para enviar notificaciones reales.
            </small>
        }
        
        <div class="form-group mt-3">
            <p-button label="Probar Notificación" icon="pi pi-play" size="small" severity="secondary"
                [loading]="testing()" (onClick)="testNotificationNode()" />
        </div>

        @if (testResult()) {
            <div class="form-group mt-2" style="padding: 0.75rem; border-radius: 8px; font-size: 0.85rem;"
                 [style.background]="testResult()?.status === 'sent' ? '#f0fdf4' : testResult()?.status === 'simulated' ? '#fffbeb' : '#fef2f2'">
                <strong>
                    {{ testResult()?.status === 'sent' ? '✅ Enviado' : 
                       testResult()?.status === 'simulated' ? '📋 Simulado (sin URL)' : '❌ Error' }}
                </strong>
                @if (testResult()?.note) {
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.8rem; color: #92400e;">{{ testResult()?.note }}</p>
                }
                @if (testResult()?.error) {
                    <p style="margin: 0.5rem 0 0 0; color: #dc2626;">{{ testResult()?.error }}</p>
                }
            </div>
        }
    </div>
  `
})
export class NotificationPropertiesComponent implements OnChanges {
    @Input({ required: true }) node!: EditorNode;
    @Input() availableAncestors: EditorNode[] = [];
    @Output() configChange = new EventEmitter<Record<string, any>>();

    private workflowService = inject(WorkflowService);
    private messageService = inject(MessageService);

    notifRecipient = signal('');
    notifMessage = signal('');
    notifUrl = signal('');
    testing = signal(false);
    testResult = signal<any>(null);

    ngOnChanges(changes: SimpleChanges) {
        if (changes['node'] && this.node) {
            const config = this.node.config || {};
            this.notifRecipient.set(config['recipient'] || '');
            this.notifMessage.set(config['message'] || '');
            this.notifUrl.set(config['url'] || '');
            this.testResult.set(null);
        }
    }

    onFieldChange() {
        this.configChange.emit({
            recipient: this.notifRecipient(),
            message: this.notifMessage(),
            url: this.notifUrl(),
        });
    }

    testNotificationNode() {
        if (!this.notifRecipient() && !this.notifMessage()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Sin datos',
                detail: 'Configura un destinatario o mensaje antes de probar',
            });
            return;
        }

        this.testing.set(true);
        this.testResult.set(null);

        this.workflowService.testNotification({
            url: this.notifUrl() || undefined,
            recipient: this.notifRecipient(),
            message: this.notifMessage(),
        }).subscribe({
            next: (result) => {
                this.testing.set(false);
                this.testResult.set(result);
                this.messageService.add({
                    severity: result.status === 'sent' ? 'success' : result.status === 'simulated' ? 'info' : 'error',
                    summary: result.status === 'sent' ? 'Notificación enviada'
                        : result.status === 'simulated' ? 'Simulación completada'
                            : 'Error',
                    detail: result.status === 'sent' ? `Enviado a ${this.notifRecipient()}`
                        : result.status === 'simulated' ? 'Agrega una URL de webhook para enviar notificaciones reales'
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
}
