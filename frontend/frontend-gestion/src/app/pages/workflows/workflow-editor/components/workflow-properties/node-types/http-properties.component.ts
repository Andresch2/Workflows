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
      <h5><i class="pi pi-globe"></i> Configuración HTTP</h5>
      <div class="form-group">
          <label>Método</label>
          <p-select [options]="httpMethods" [ngModel]="httpMethod()"
              (ngModelChange)="httpMethod.set($event); onFieldChange()" placeholder="Método"
              styleClass="w-full" appendTo="body" />
      </div>
      <div class="form-group">
          <label>URL</label>
          <input pInputText [ngModel]="httpUrl()" (ngModelChange)="httpUrl.set($event); onFieldChange()"
              placeholder="https://api.example.com/data" class="w-full" />
      </div>
      @if (httpMethod() !== 'GET') {
      <div class="form-group">
          <label>Body (JSON)</label>
          <textarea pTextarea [ngModel]="httpBody()" (ngModelChange)="httpBody.set($event); onFieldChange()"
              placeholder='{ "key": "value" }' rows="4" class="w-full"></textarea>
          <small style="display: block; margin-top: 0.5rem; color: #6b7280; font-size: 0.75rem; line-height: 1.2;">
              <i>Tip:</i> Usa <code ngNonBindable>&#123;&#123; variable &#125;&#125;</code> para inyectar datos del disparador.<br>
              Envía <code ngNonBindable>"&#123;&#123; __FULL_PAYLOAD__ &#125;&#125;"</code> para retransmitir todo.
          </small>
      </div>
      }
      <div class="form-group">
          <label>Headers (JSON) <small class="optional">opcional</small></label>
          <textarea pTextarea [ngModel]="httpHeaders()"
              (ngModelChange)="httpHeaders.set($event); onFieldChange()"
              placeholder='{ "Authorization": "Bearer ..." }' rows="3" class="w-full"></textarea>
      </div>

      <div class="form-group mt-3">
          <p-button label="Probar Petición" icon="pi pi-play" size="small" severity="secondary"
              (onClick)="testHttpNode()" [loading]="testingHttp()" />
      </div>

      @if (httpTestResult()) {
      <div class="form-group mt-3">
          <label>Respuesta (JSON)</label>
          <textarea pTextarea [value]="httpTestResult()" readonly rows="8" class="w-full"
              style="background-color: #1e293b; color: #e2e8f0; font-family: monospace; font-size: 0.85rem; border-radius: 6px;"></textarea>
      </div>
      }
    </div>
  `
})
export class HttpPropertiesComponent implements OnChanges {
    @Input({ required: true }) node!: EditorNode;
    @Input() availableAncestors: EditorNode[] = [];
    @Output() configChange = new EventEmitter<Record<string, any>>();

    workflowService = inject(WorkflowService);
    messageService = inject(MessageService);

    httpMethod = signal('POST');
    httpUrl = signal('');
    httpBody = signal('');
    httpHeaders = signal('');

    testingHttp = signal(false);
    httpTestResult = signal('');

    httpMethods = [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' },
    ];

    ngOnChanges(changes: SimpleChanges) {
        if (changes['node'] && this.node) {
            const config = this.node.config || {};
            this.httpMethod.set((config['method'] || 'POST').toUpperCase());
            this.httpUrl.set(config['url'] || '');
            this.httpBody.set(config['body'] ? (typeof config['body'] === 'string' ? config['body'] : JSON.stringify(config['body'], null, 2)) : '');
            this.httpHeaders.set(config['headers'] ? (typeof config['headers'] === 'string' ? config['headers'] : JSON.stringify(config['headers'], null, 2)) : '');
            this.httpTestResult.set('');
        }
    }

    onFieldChange() {
        const config = {
            method: this.httpMethod(),
            url: this.httpUrl(),
            ...(this.httpMethod() !== 'GET' && this.httpBody() ? { body: this.safeParseJson(this.httpBody()) } : {}),
            ...(this.httpHeaders() ? { headers: this.safeParseJson(this.httpHeaders()) } : {}),
        };
        this.configChange.emit(config);
    }

    private safeParseJson(value: string): any {
        try { return JSON.parse(value); } catch { return value; }
    }

    testHttpNode() {
        if (!this.httpUrl()) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe especificar una URL' });
            return;
        }
        this.testingHttp.set(true);
        const config = {
            method: this.httpMethod(),
            url: this.httpUrl(),
            ...(this.httpBody() && this.httpMethod() !== 'GET' ? { body: this.safeParseJson(this.httpBody()) } : {}),
            ...(this.httpHeaders() ? { headers: this.safeParseJson(this.httpHeaders()) } : {}),
        };

        this.workflowService.testHttpNode(config).subscribe({
            next: (res) => {
                this.httpTestResult.set(JSON.stringify(res.data, null, 2));
                this.testingHttp.set(false);
            },
            error: (err) => {
                const errMsg = err.error?.error || err.message || 'Error en la petición';
                this.httpTestResult.set(JSON.stringify({ error: errMsg }, null, 2));
                this.testingHttp.set(false);
            }
        });
    }
}
