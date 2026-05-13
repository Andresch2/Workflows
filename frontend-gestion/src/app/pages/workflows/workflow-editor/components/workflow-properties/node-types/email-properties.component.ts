import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { EditorNode } from '../../../../../../core/models/workflow.model';

@Component({
    selector: 'app-email-properties',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, TextareaModule],
    template: `
    <div class="form-section email-node-properties">
        <h5><i class="pi pi-envelope"></i> Configuración Email</h5>

        <div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.5rem; padding: 0.4rem 0.6rem; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px;">
            <i class="pi pi-info-circle" style="color: #38bdf8; margin-right: 0.25rem;"></i>
            Use variables del Data Explorer: <code style="background: #e0f2fe; color: #0369a1; padding: 0.1rem 0.3rem; border-radius: 3px; font-weight: 600;">$json.campo</code>
        </div>

        <div class="flex flex-col gap-1 w-full mb-3">
            <label>Destinatario (To)</label>
            <input
                pInputText
                [ngModel]="emailTo()"
                (ngModelChange)="emailTo.set($event || ''); onFieldChange()"
                [placeholder]="'Ej: admin@empresa.com o {{ $json.email }}'"
                class="w-full"
            />
        </div>

        <div class="flex flex-col gap-1 w-full mb-3">
            <label>Asunto (Subject)</label>
            <input
                pInputText
                [ngModel]="emailSubject()"
                (ngModelChange)="emailSubject.set($event || ''); onFieldChange()"
                [placeholder]="'Ej: Notificación de proceso completado'"
                class="w-full"
            />
        </div>

        <div class="flex flex-col gap-1 w-full mb-3">
            <label>Mensaje (Message)</label>
            <textarea
                pTextarea
                [ngModel]="emailMessage()"
                (ngModelChange)="emailMessage.set($event || ''); onFieldChange()"
                [placeholder]="'Ej: Hola {{ $json.name }}, tu proceso ha sido completado.'"
                rows="4"
                class="w-full"
            ></textarea>
        </div>
    </div>
  `,
    styles: [
        `
            .email-node-properties {
                background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
                border: 1px solid #fed7aa;
                border-radius: 14px;
                padding: 0.85rem;
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
            }
        `,
    ],
})
export class EmailPropertiesComponent implements OnChanges {
    @Input({ required: true }) node!: EditorNode;
    @Input() availableAncestors: EditorNode[] = [];
    @Output() configChange = new EventEmitter<Record<string, any>>();

    emailTo = signal('');
    emailSubject = signal('');
    emailMessage = signal('');

    ngOnChanges(changes: SimpleChanges) {
        if (changes['node'] && this.node) {
            const config = this.node.config || {};
            this.emailTo.set(config['to'] || '');
            this.emailSubject.set(config['subject'] || '');
            this.emailMessage.set(config['message'] || '');
        }
    }

    private buildEmailSchema() {
        return {
            to: '',
            subject: '',
            message: '',
        };
    }

    private emitConfigWithSchema() {
        this.configChange.emit({
            to: this.emailTo(),
            subject: this.emailSubject(),
            message: this.emailMessage(),
            __dataSchema: this.buildEmailSchema(),
        });
    }

    onFieldChange() {
        this.emitConfigWithSchema();
    }
}
