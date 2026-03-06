import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { inngest } from '../inngest/client';
import { WorkflowsService } from './workflows.service';

@ApiTags('Webhooks')
@Controller({
  path: 'workflows/webhook',
  version: '1',
})
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private static payloadCache = new Map<string, any>();

  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post(':workflowId')
  @ApiParam({ name: 'workflowId', type: String })
  async receiveWebhook(
    @Param('workflowId') workflowId: string,
    @Body() payload: Record<string, any>,
    @Headers() headers: Record<string, string>,
    @Query() query: Record<string, string>,
  ) {
    this.logger.log(`Webhook recibido para workflow: ${workflowId}`);

    const workflow = await this.workflowsService.findById(workflowId);
    if (!workflow) {
      this.logger.warn(`Workflow ${workflowId} no encontrado`);
      return { status: 'error', message: `Workflow ${workflowId} no encontrado` };
    }

    await inngest.send({
      name: 'webhook.received',
      data: {
        workflowId,
        payload: payload || {},
        headers: headers || {},
        query: query || {},
      },
    });

    WebhookController.payloadCache.set(workflowId, {
      body: payload || {},
      headers: headers || {},
      query: query || {},
    });

    this.logger.log(`Evento webhook.received enviado a Inngest para workflow ${workflowId}`);
    return { status: 'received', workflowId };
  }

  @Get(':workflowId/latest')
  @ApiParam({ name: 'workflowId', type: String })
  async getLatestWebhookPayload(@Param('workflowId') workflowId: string) {
    const payload = WebhookController.payloadCache.get(workflowId);
    if (payload) {
      WebhookController.payloadCache.delete(workflowId);
      return payload;
    }
    return null;
  }
}
