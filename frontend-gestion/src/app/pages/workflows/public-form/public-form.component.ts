import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TextareaModule } from 'primeng/textarea';
import { WorkflowService } from '../../../core/services/workflow.service';

@Component({
  selector: 'app-public-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    ProgressSpinnerModule,
    MessageModule,
  ],
  template: `
    <div class="public-form-container" [class.modal-mode]="nodeId">
      <div *ngIf="!nodeId" class="glass-background"></div>

      <div class="form-wrapper" [class.w-full]="nodeId">
        <p-card *ngIf="!submitted(); else successState" styleClass="premium-card">
          <ng-template pTemplate="header">
            <div class="header-banner">
              <i class="pi pi-list-check icon-float"></i>
            </div>
          </ng-template>

          <div class="form-header text-center mb-5">
            <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
              {{ formConfig()?.config?.title || 'Formulario' }}
            </h1>
            <p class="text-slate-500 mt-2">{{ formConfig()?.config?.description }}</p>
          </div>

          <form #f="ngForm" novalidate (ngSubmit)="onSubmit(f)" class="flex flex-col gap-4">
            <ng-container *ngFor="let field of formConfig()?.config?.fields">
              <div *ngIf="!['title', 'description', 'successMsg'].includes(field.type)" class="field-group">
                <label [for]="field.name" class="block text-sm font-semibold text-slate-700 mb-1 ml-1">
                  {{ field.name | titlecase }}
                  <span *ngIf="field.required" class="text-red-500">*</span>
                </label>

                <ng-container [ngSwitch]="field.type">
                  <ng-container *ngSwitchCase="'textarea'">
                    <textarea
                      #fieldModel="ngModel"
                      pTextarea
                      [(ngModel)]="formData[field.name]"
                      [name]="field.name"
                      [required]="field.required"
                      rows="4"
                      class="w-full premium-input"
                      [class.input-invalid]="showError(fieldModel)"
                      placeholder="Escribe aqui..."
                    ></textarea>
                    <small *ngIf="showError(fieldModel)" class="field-error">Este campo es obligatorio.</small>
                  </ng-container>

                  <ng-container *ngSwitchCase="'email'">
                    <input
                      #fieldModel="ngModel"
                      id="{{ field.name }}"
                      type="email"
                      pInputText
                      [(ngModel)]="formData[field.name]"
                      [name]="field.name"
                      [required]="field.required"
                      email
                      class="w-full premium-input"
                      [class.input-invalid]="showError(fieldModel)"
                      placeholder="correo@ejemplo.com"
                    />
                    <small *ngIf="showError(fieldModel)" class="field-error">
                      <span *ngIf="fieldModel.errors?.['required']">El correo es obligatorio.</span>
                      <span *ngIf="fieldModel.errors?.['email']">Ingresa un correo valido.</span>
                    </small>
                  </ng-container>

                  <ng-container *ngSwitchDefault>
                    <input
                      #fieldModel="ngModel"
                      [id]="field.name"
                      [type]="getInputType(field.type)"
                      pInputText
                      [(ngModel)]="formData[field.name]"
                      [name]="field.name"
                      [required]="field.required"
                      class="w-full premium-input"
                      [class.input-invalid]="showError(fieldModel)"
                      placeholder="Tu respuesta"
                    />
                    <small *ngIf="showError(fieldModel)" class="field-error">Este campo es obligatorio.</small>
                  </ng-container>
                </ng-container>
              </div>
            </ng-container>

            <div class="mt-6">
              <p-button
                type="submit"
                label="Enviar Respuesta"
                icon="pi pi-send"
                [loading]="submitting()"
                styleClass="w-full premium-button"
                [disabled]="!f.valid || submitting()"
              >
              </p-button>
            </div>
          </form>

          <div *ngIf="loading()" class="loading-overlay">
            <p-progressSpinner styleClass="w-3rem h-3rem" strokeWidth="4"></p-progressSpinner>
          </div>
        </p-card>

        <ng-template #successState>
          <div class="success-card glass-morphism animate-fade-in text-center p-8 rounded-3xl shadow-2xl">
            <div class="success-icon mb-4">
              <i class="pi pi-check-circle text-6xl text-green-500"></i>
            </div>
            <h2 class="text-2xl font-bold text-slate-800 mb-2">Enviado con exito</h2>
            <p class="text-slate-600">{{ formConfig()?.config?.successMsg || 'Gracias por tu respuesta.' }}</p>
            <p-button label="Volver a empezar" (click)="resetForm()" [text]="true" class="mt-4"></p-button>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .public-form-container {
      position: relative;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      background: #f8fafc;
      overflow: hidden;
    }

    .public-form-container.modal-mode {
      min-height: auto;
      background: transparent;
      padding: 0;
    }

    .glass-background {
      position: absolute;
      top: -10%;
      right: -5%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(255, 255, 255, 0) 70%);
      border-radius: 50%;
      z-index: 0;
    }

    .form-wrapper {
      position: relative;
      width: 100%;
      max-width: 500px;
      z-index: 10;
    }

    :host ::ng-deep .premium-card {
      border: none;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
    }

    .header-banner {
      height: 120px;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .icon-float {
      font-size: 3rem;
      color: white;
      opacity: 0.8;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .premium-input {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.75rem 1rem;
      transition: all 0.2s;
      background: #ffffff;
    }

    .premium-input:focus {
      border-color: #8b5cf6;
      box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
    }

    .input-invalid {
      border-color: #ef4444 !important;
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.08);
    }

    .field-error {
      display: block;
      margin-top: 0.35rem;
      margin-left: 0.3rem;
      color: #dc2626;
      font-size: 0.78rem;
      font-weight: 500;
    }

    :host ::ng-deep .premium-button {
      background: linear-gradient(to right, #6366f1, #8b5cf6);
      border: none;
      border-radius: 12px;
      height: 48px;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    :host ::ng-deep .premium-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.3);
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 24px;
    }

    .glass-morphism {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.5);
    }

    @keyframes fade-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-fade-in {
      animation: fade-in 0.5s ease-out forwards;
    }
  `]
})
export class PublicFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private workflowService = inject(WorkflowService);
  private messageService = inject(MessageService);

  @Input() nodeId?: string;
  @Input() previewConfig?: any;

  formConfig = signal<any>(null);
  loading = signal(true);
  submitting = signal(false);
  submitted = signal(false);
  submitAttempted = signal(false);
  formData: Record<string, any> = {};

  ngOnInit() {
    console.log('previewConfig', this.previewConfig);
    if (this.previewConfig) {
      this.formConfig.set({
        id: this.nodeId,
        config: this.previewConfig
      });
      this.initializeFields(this.previewConfig);
      this.loading.set(false);
      return;
    }

    const id = this.nodeId || this.route.snapshot.paramMap.get('nodeId');
    if (id) {
      this.loadFormConfig(id);
    }
  }

  private initializeFields(config: any) {
    console.log('config', config);
    if (!config || !config.fields) return;

    config.fields.forEach((f: any) => {
      if (f.name && this.formData[f.name] === undefined) {
        this.formData[f.name] = '';
      }
    });
  }

  loadFormConfig(nodeId: string) {
    console.log('nodeId', nodeId);
    this.workflowService.getFormConfig(nodeId).subscribe({
      next: (config: any) => {
        console.log('config', config);
        this.formConfig.set(config);
        this.loading.set(false);
        this.initializeFields(config.config);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el formulario' });
        this.loading.set(false);
      }
    });
  }

  getInputType(fieldType: string): string {
    if (fieldType === 'number' || fieldType === 'date') {
      return fieldType;
    }
    return 'text';
  }

  showError(model: any): boolean {
    return !!model && model.invalid && (model.touched || model.dirty || this.submitAttempted());
  }

  private markFormControlsAsTouched(form: NgForm) {
    Object.values(form.controls).forEach(control => {
      control.markAsTouched();
      control.markAsDirty();
    });
  }

  onSubmit(form: NgForm) {
    const nodeId = this.formConfig()?.id;
    if (!nodeId) return;

    this.submitAttempted.set(true);

    if (form.invalid) {
      this.markFormControlsAsTouched(form);
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario invalido',
        detail: 'Revisa los campos antes de enviar. El correo debe tener un formato valido.'
      });
      return;
    }

    const executionId = this.route.snapshot.queryParamMap.get('executionId') || undefined;

    this.submitting.set(true);
    this.workflowService.submitForm(nodeId, this.formData, executionId).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Error al enviar el formulario'
        });
        this.submitting.set(false);
      }
    });
  }

  resetForm() {
    this.submitted.set(false);
    this.submitAttempted.set(false);
    for (const key in this.formData) {
      this.formData[key] = '';
    }
  }
}
