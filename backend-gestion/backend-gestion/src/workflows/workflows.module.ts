import { Module } from '@nestjs/common';
import { DatabaseHandler } from './engine/handlers/database.handler';
import { DelayHandler } from './engine/handlers/delay.handler';
import { FormHandler } from './engine/handlers/form.handler';
import { HttpHandler } from './engine/handlers/http.handler';
import { NotificationHandler } from './engine/handlers/notification.handler';
import { IfHandler } from './engine/handlers/if.handler';
import { TemplateUtil } from './engine/utils/template.util';
import { WorkflowEngineService } from './engine/workflow-engine.service';
import { RelationalWorkflowPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { WebhookController } from './webhook.controller';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowDatabaseConfig } from './infrastructure/persistence/relational/entities/workflow-database-config.entity';

@Module({
  imports: [
    RelationalWorkflowPersistenceModule,
    TypeOrmModule.forFeature([WorkflowDatabaseConfig]),
  ],
  controllers: [WorkflowsController, WebhookController],
  providers: [
    WorkflowsService,
    WorkflowEngineService,
    HttpHandler,
    DatabaseHandler,
    DelayHandler,
    NotificationHandler,
    FormHandler,
    IfHandler,
    TemplateUtil,
  ],
  exports: [WorkflowsService, WorkflowEngineService, TemplateUtil],
})
export class WorkflowsModule { }
