import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { inngest } from '../inngest/client';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { Workflow } from './domain/workflow';
import { WorkflowConnection } from './domain/workflow-connection';
import { WorkflowNode } from './domain/workflow-node';
import { CreateWorkflowConnectionDto } from './dto/create-workflow-connection.dto';
import { CreateWorkflowNodeDto } from './dto/create-workflow-node.dto';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { FindAllWorkflowsDto } from './dto/find-all-workflows.dto';
import { UpdateWorkflowNodeDto } from './dto/update-workflow-node.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { DatabaseHandler } from './engine/handlers/database.handler';
import { WorkflowEngineService } from './engine/workflow-engine.service';
import { WorkflowsService } from './workflows.service';

@ApiTags('Workflows')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'workflows',
  version: '1',
})
export class WorkflowsController {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly databaseHandler: DatabaseHandler,
    private readonly workflowEngineService: WorkflowEngineService,
  ) { }

  // Endpoints de Configuración

  @Get('database/configs')
  @ApiOkResponse({ description: 'Devuelve la configuración dinámica de tablas para nodos Database' })
  getDatabaseConfigs() {
    return this.workflowsService.getDatabaseConfigs();
  }

  // Endpoints de Workflow

  @Post()
  @ApiCreatedResponse({ type: Workflow })
  create(@Body() dto: CreateWorkflowDto, @Request() request) {
    return this.workflowsService.create(dto, request.user);
  }

  @Get()
  @ApiOkResponse({ type: InfinityPaginationResponse(Workflow) })
  async findAll(
    @Request() request,
    @Query() query: FindAllWorkflowsDto,
  ): Promise<InfinityPaginationResponseDto<Workflow>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) limit = 50;

    const result = await this.workflowsService.findAllWithPagination({
      paginationOptions: { page, limit },
      user: request.user,
    });

    return infinityPagination(result.data, { page, limit }, result.total);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: Workflow })
  findById(@Param('id') id: string) {
    return this.workflowsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: Workflow })
  update(@Param('id') id: string, @Body() dto: UpdateWorkflowDto) {
    return this.workflowsService.update(id, dto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: String })
  remove(@Param('id') id: string) {
    return this.workflowsService.remove(id);
  }

  // Endpoints de Ejecución

  @Post(':id/execute')
  @ApiParam({ name: 'id', type: String })
  async execute(@Param('id') id: string, @Body() payload: Record<string, any>) {
    try {
      await inngest.send({
        name: 'workflow/execute',
        data: { workflowId: id, ...payload },
      });
      return { message: 'Workflow execution initiated', workflowId: id };
    } catch (error: any) {
      const msg = error?.message || 'Unknown error';
      if (msg.includes('Event key not found') || msg.includes('401')) {
        return {
          status: 'warning',
          message: 'Inngest event key no configurada. Configura INNGEST_EVENT_KEY en .env para ejecución durable.',
          workflowId: id,
        };
      }
      throw error;
    }
  }

  @Post(':id/execute/sync')
  @ApiParam({ name: 'id', type: String })
  async executeSync(
    @Param('id') id: string,
    @Body() payload: Record<string, any>,
  ) {
    return this.workflowEngineService.executeWorkflow(id, undefined, payload);
  }

  // Endpoints de Nodos de Workflow

  @Post('nodes')
  @ApiCreatedResponse({ type: WorkflowNode })
  createNode(@Body() dto: CreateWorkflowNodeDto) {
    return this.workflowsService.createNode(dto);
  }

  @Get(':workflowId/nodes')
  @ApiParam({ name: 'workflowId', type: String })
  @ApiOkResponse({ type: [WorkflowNode] })
  findNodesByWorkflowId(@Param('workflowId') workflowId: string) {
    return this.workflowsService.findNodesByWorkflowId(workflowId);
  }

  @Get('nodes/:id')
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: WorkflowNode })
  findNodeById(@Param('id') id: string) {
    return this.workflowsService.findNodeById(id);
  }

  @Patch('nodes/:id')
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: WorkflowNode })
  updateNode(@Param('id') id: string, @Body() dto: UpdateWorkflowNodeDto) {
    return this.workflowsService.updateNode(id, dto);
  }

  @Delete('nodes/:id')
  @ApiParam({ name: 'id', type: String })
  removeNode(@Param('id') id: string) {
    return this.workflowsService.removeNode(id);
  }

  // Endpoints de Conexiones de Workflow

  @Post(':workflowId/connections')
  @ApiParam({ name: 'workflowId', type: String })
  @ApiCreatedResponse({ type: WorkflowConnection })
  createConnection(
    @Param('workflowId') workflowId: string,
    @Body() dto: CreateWorkflowConnectionDto,
  ) {
    dto.workflowId = workflowId;
    return this.workflowsService.createConnection(dto);
  }

  @Get(':workflowId/connections')
  @ApiParam({ name: 'workflowId', type: String })
  @ApiOkResponse({ type: [WorkflowConnection] })
  findConnectionsByWorkflowId(@Param('workflowId') workflowId: string) {
    return this.workflowsService.findConnectionsByWorkflowId(workflowId);
  }

  @Delete('connections/:id')
  @ApiParam({ name: 'id', type: String })
  removeConnection(@Param('id') id: string) {
    return this.workflowsService.removeConnection(id);
  }

  // Endpoints de Prueba

  @Post('test/http')
  async testHttpNode(
    @Body() dto: { method: string; url: string; headers?: any; body?: any },
  ) {
    try {
      const { method = 'GET', url, headers = {}, body } = dto;

      const response = await fetch(url, {
        method,
        headers,
        body:
          method !== 'GET' && body
            ? typeof body === 'string'
              ? body
              : JSON.stringify(body)
            : undefined,
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      return {
        statusCode: response.status,
        body: data,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error: any) {
      return { statusCode: 500, error: error.message };
    }
  }

  @Post('test/database')
  async testDatabaseNode(
    @Body() dto: { nombre?: string; json?: any; data?: any },
  ) {
    const fakeNode = {
      id: 'test-node',
      name: dto.nombre || 'test',
      type: 'DATABASE',
      config: {
        nombre: dto.nombre,
        json: dto.json,
        data: dto.data,
      },
    };
    const fakeContext = { workflowId: 'test', executionId: 'test-exec', nodes: {}, $node: {} };
    return this.databaseHandler.execute(fakeNode, fakeContext as any, null);
  }

  @Post('test/notification')
  async testNotificationNode(
    @Body() dto: { url?: string; recipient: string; message: string },
  ) {
    try {
      const { url, recipient, message } = dto;

      if (url) {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient,
            message,
            timestamp: new Date().toISOString(),
            source: 'workflow-notification',
          }),
        });

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }

        return {
          status: 'sent',
          statusCode: response.status,
          recipient,
          message,
          data,
        };
      }

      return {
        status: 'simulated',
        recipient,
        message,
        timestamp: new Date().toISOString(),
        note: 'No hay URL configurada.',
      };
    } catch (error: any) {
      return { status: 'failed', error: error.message };
    }
  }
}
