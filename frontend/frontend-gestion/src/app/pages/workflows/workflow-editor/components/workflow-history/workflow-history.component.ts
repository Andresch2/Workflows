import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowService } from '../../../../../core/services/workflow.service';
import { WorkflowExecution } from '../../../../../core/models/workflow.model';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Accordion, AccordionPanel, AccordionHeader, AccordionContent } from 'primeng/accordion';

@Component({
  selector: 'app-workflow-history',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, ButtonModule, TooltipModule, Accordion, AccordionPanel, AccordionHeader, AccordionContent],
  templateUrl: './workflow-history.component.html',
  styles: [`
    :host {
      display: block;
      width: 100% !important;
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow-x: hidden !important;
      box-sizing: border-box !important;
      background: var(--surface-section);
      color: var(--text-color);
    }
    .history-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100%;
      background: var(--surface-section);
      box-sizing: border-box;
    }
    .execution-list {
      display: flex;
      flex-direction: column !important;
      gap: 1rem !important;
      width: 100%;
      box-sizing: border-box;
    }
    .execution-card {
      transition: all 0.2s ease;
      border: 1px solid var(--surface-border);
      background: var(--surface-card);
      width: 100% !important;
      box-sizing: border-box;
      padding: 1.25rem !important;
      border-radius: 12px;
    }
    .execution-card:hover {
      background: var(--surface-hover) !important;
      border-color: var(--primary-color);
      transform: translateX(-4px);
    }
    .active-execution {
      background: var(--surface-hover) !important;
      border-left: 4px solid var(--primary-color) !important;
    }
    pre {
      margin: 0;
      padding: 0.75rem;
      background: #1e293b;
      color: #e2e8f0;
      border-radius: 8px;
      font-size: 0.75rem;
      max-height: 250px;
      overflow-y: auto;
      overflow-x: hidden;
      white-space: pre-wrap;
      word-break: break-all;
      border: 1px solid #334155;
    }
    /* Scrollbar elegante para el código */
    pre::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    pre::-webkit-scrollbar-thumb {
      background: #475569;
      border-radius: 10px;
    }
    .copy-btn {
      position: absolute;
      right: 0.5rem;
      top: 0.5rem;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .json-container:hover .copy-btn {
      opacity: 1;
    }
  `]
})
export class WorkflowHistoryComponent implements OnInit {
  @Input() workflowId!: string;
  @Output() onSelectExecution = new EventEmitter<WorkflowExecution>();
  @Output() onClose = new EventEmitter<void>();

  private workflowService = inject(WorkflowService);
  
  executions = signal<WorkflowExecution[]>([]);
  selectedId = signal<string | null>(null);
  loading = signal(false);

  ngOnInit() {
    this.loadExecutions();
  }

  loadExecutions() {
    if (!this.workflowId) return;
    
    this.loading.set(true);
    this.workflowService.getExecutions(this.workflowId).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.executions.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getStatusSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'running': return 'info';
      default: return 'info';
    }
  }

  selectExecution(execution: WorkflowExecution) {
    this.selectedId.set(execution.id);
    this.onSelectExecution.emit(execution);
  }

  getTriggerIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'webhook': return 'pi pi-globe';
      case 'manual': return 'pi pi-user';
      case 'event': return 'pi pi-bolt';
      default: return 'pi pi-cog';
    }
  }

  formatJson(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    // Podríamos añadir un toast aquí si fuera necesario
  }

  getNodeResults(results: any): any[] {
    if (!results) return [];
    return Object.entries(results)
      .map(([id, res]: [string, any]) => ({
        id,
        ...res
      }))
      .sort((a, b) => {
        // Prioridad al índice de orden numérico
        if (a.executionOrder !== undefined && b.executionOrder !== undefined) {
          return a.executionOrder - b.executionOrder;
        }
        // Fallback a la fecha si es un registro viejo
        return new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime();
      });
  }

  clearHistory() {
    if (confirm('¿Estás seguro de que deseas limpiar todo el historial de este workflow? Esta acción no se puede deshacer.')) {
      this.loading.set(true);
      this.workflowService.clearExecutions(this.workflowId).subscribe({
        next: () => {
          this.executions.set([]);
          this.loading.set(false);
          this.selectedId.set(null);
        },
        error: () => {
          this.loading.set(false);
        }
      });
    }
  }
}
