import {
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { inngest } from '../inngest/client';
import { PendingFormStore } from './engine/pending-form.store';
import { WorkflowsService } from './workflows.service';

@ApiTags('Forms')
@Controller({
  path: 'workflows/form',
  version: '1',
})
export class FormController {
  private readonly logger = new Logger(FormController.name);

  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly pendingFormStore: PendingFormStore,
  ) { }

  @Get(':nodeId')
  @ApiParam({ name: 'nodeId', type: String })
  async getFormConfig(@Param('nodeId') nodeId: string) {
    this.logger.log(`Obteniendo configuración para formulario: ${nodeId}`);

    // Si es un ID temporal de la UI, no buscamos en DB
    if (nodeId.startsWith('temp-')) {
      throw new NotFoundException(`Formulario temporal ${nodeId} no disponible en el servidor`);
    }

    const node = await this.workflowsService.findNodeById(nodeId);
    if (!node || node.type !== 'FORM') {
      throw new NotFoundException(`Nodo de formulario ${nodeId} no encontrado`);
    }

    return {
      id: node.id,
      workflowId: node.workflowId,
      config: node.config,
    };
  }

  @Post(':nodeId/submit')
  @ApiParam({ name: 'nodeId', type: String })
  async submitForm(
    @Param('nodeId') nodeId: string,
    @Body() payload: Record<string, any>,
  ) {
    this.logger.log(`Formulario enviado para nodo: ${nodeId}`);

    if (nodeId.startsWith('temp-')) {
      return { status: 'preview_submitted', nodeId, message: 'Envío de prueba exitoso (Vista Previa)' };
    }

    const node = await this.workflowsService.findNodeById(nodeId);
    if (!node) {
      throw new NotFoundException(`Nodo ${nodeId} no encontrado`);
    }

    // Extraer meta-datos si existen (estilo n8n multi-sesión)
    const { executionId: payloadExecutionId, ...data } = payload || {};
    const finalPayload = data.payload || data; // Soporte para { payload: {...} } o directo

    // Auto-resolver executionId: buscar en el store de pendientes si no viene en el payload
    const pending = this.pendingFormStore.resolve(nodeId);
    const executionId = payloadExecutionId || pending?.executionId;

    try {
      if (executionId) {
        // REANUDAR: Evento diferente al trigger para evitar double-trigger.
        // `workflow.form_step_completed` NO está registrado como trigger de ninguna
        // función Inngest → solo lo captura el step.waitForEvent del handler.
        await inngest.send({
          name: 'workflow.form_step_completed',
          data: {
            workflowId: node.workflowId,
            nodeId: node.id,
            executionId,
            payload: finalPayload,
          },
        });
        this.logger.log(
          `Evento "workflow.form_step_completed" enviado para reanudar nodo ${node.id} (execId: ${executionId})`,
        );
      } else {
        // DISPARAR: No hay ejecución pendiente → iniciar nuevo workflow.
        // Este evento SÍ activa la función on-form-submitted en Inngest.
        await inngest.send({
          name: 'workflow.form_submitted',
          data: {
            workflowId: node.workflowId,
            nodeId: node.id,
            payload: finalPayload,
          },
        });
        this.logger.log(
          `Evento "workflow.form_submitted" enviado para iniciar nueva ejecución en nodo ${node.id}`,
        );
      }
    } catch (e) {
      this.logger.warn(
        `No se pudo enviar evento a Inngest: ${(e as any)?.message}`,
      );
    }

    return { status: 'submitted', nodeId };
  }
}
