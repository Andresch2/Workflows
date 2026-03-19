import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    inject,
    signal,
} from '@angular/core';
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

        <div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.5rem; padding: 0.4rem 0.6rem; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px;">
            <i class="pi pi-info-circle" style="color: #38bdf8; margin-right: 0.25rem;"></i>
            Use variables del Data Explorer: <code style="background: #e0f2fe; color: #0369a1; padding: 0.1rem 0.3rem; border-radius: 3px; font-weight: 600;">$json.campo</code>
        </div>

        <div class="flex flex-col gap-1 w-full mb-3">
            <label>Destinatario</label>
            <input
                pInputText
                [ngModel]="notifRecipient()"
                (ngModelChange)="notifRecipient.set($event || ''); onFieldChange()"
                [placeholder]="'Ej: admin@empresa.com o {{ $json.email }}'"
                class="w-full"
            />
        </div>

        <div class="flex flex-col gap-1 w-full mb-3">
            <label>Mensaje</label>
            <textarea
                pTextarea
                [ngModel]="notifMessage()"
                (ngModelChange)="notifMessage.set($event || ''); onFieldChange()"
                [placeholder]="'Ej: Hola {{ $json.name }}, proceso completado'"
                rows="3"
                class="w-full"
            ></textarea>
        </div>

        <div class="flex flex-col gap-1 w-full mb-3">
            <label>
                URL
            </label>
            <input
                pInputText
                [ngModel]="notifUrl()"
                (ngModelChange)="notifUrl.set($event || ''); onFieldChange()"
                placeholder="https://hooks.slack.com/services/..."
                class="w-full"
            />
        </div>

        @if (!notifUrl()) {
            <small style="color: #f59e0b; display: block; margin-bottom: 0.5rem;">
                Sin URL, la notificación solo se registra en el log del servidor.
            </small>
        }

        <div class="flex flex-col gap-1 w-full mb-3 mt-3">
            <p-button
                label="Probar Notificación"
                icon="pi pi-play"
                size="small"
                severity="secondary"
                [loading]="testing()"
                (onClick)="testNotificationNode()"
            />
        </div>

        @if (testResult()) {
            <div
                class="form-group mt-2"
                style="padding: 0.75rem; border-radius: 8px; font-size: 0.85rem;"
                [style.background]="
                    testResult()?.status === 'sent'
                        ? '#f0fdf4'
                        : testResult()?.status === 'simulated'
                            ? '#fffbeb'
                            : '#fef2f2'
                "
            >
                <strong>
                    {{
                        testResult()?.status === 'sent'
                            ? 'Enviado'
                            : testResult()?.status === 'simulated'
                                ? 'Simulado (sin URL)'
                                : 'Error'
                    }}
                </strong>

                @if (testResult()?.note) {
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.8rem; color: #92400e;">
                        {{ testResult()?.note }}
                    </p>
                }

                @if (testResult()?.error) {
                    <p style="margin: 0.5rem 0 0 0; color: #dc2626;">
                        {{ testResult()?.error }}
                    </p>
                }
            </div>
        }
    </div>
  `,
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

    private buildNotificationSchema() {
        return {
            status: '',
            recipient: '',
            message: '',
            url: '',
            timestamp: '',
            note: '',
            error: '',
        };
    }

    private inferSchemaFromResult(value: any): any {
        if (Array.isArray(value)) {
            if (!value.length) return [];
            return [this.inferSchemaFromResult(value[0])];
        }

        if (value && typeof value === 'object') {
            const result: Record<string, any> = {};
            for (const key of Object.keys(value)) {
                result[key] = this.inferSchemaFromResult(value[key]);
            }
            return result;
        }

        if (typeof value === 'number') return 0;
        if (typeof value === 'boolean') return false;
        return '';
    }

    private emitConfigWithSchema(schema?: Record<string, any>) {
        this.configChange.emit({
            recipient: this.notifRecipient(),
            message: this.notifMessage(),
            url: this.notifUrl(),
            __dataSchema: schema || this.buildNotificationSchema(),
        });
    }

    onFieldChange() {
        this.emitConfigWithSchema();
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

        this.workflowService
            .testNotification({
                url: this.notifUrl() || undefined,
                recipient: this.notifRecipient(),
                message: this.notifMessage(),
            })
            .subscribe({
                next: (result) => {
                    this.testing.set(false);
                    this.testResult.set(result);

                    const inferredSchema = this.inferSchemaFromResult(result || {});
                    this.emitConfigWithSchema(inferredSchema);

                    this.messageService.add({
                        severity:
                            result.status === 'sent'
                                ? 'success'
                                : result.status === 'simulated'
                                    ? 'info'
                                    : 'error',
                        summary:
                            result.status === 'sent'
                                ? 'Notificación enviada'
                                : result.status === 'simulated'
                                    ? 'Simulación completada'
                                    : 'Error',
                        detail:
                            result.status === 'sent'
                                ? `Enviado a ${this.notifRecipient()}`
                                : result.status === 'simulated'
                                    ? 'Agrega una URL para enviar notificaciones reales'
                                    : result.error || 'Error desconocido',
                    });
                },
                error: (err) => {
                    this.testing.set(false);

                    const failedResult = {
                        status: 'failed',
                        error: err?.error?.message || err?.message || 'No se pudo conectar al backend',
                    };

                    this.testResult.set(failedResult);
                    this.emitConfigWithSchema(this.inferSchemaFromResult(failedResult));

                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error de conexión',
                        detail:
                            err?.error?.message ||
                            err?.message ||
                            'No se pudo conectar al backend',
                    });
                },
            });
    }
}