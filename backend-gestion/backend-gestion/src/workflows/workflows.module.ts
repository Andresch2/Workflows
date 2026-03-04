import { Module } from '@nestjs/common';
import { DatabaseHandler } from './engine/handlers/database.handler';
import { DelayHandler } from './engine/handlers/delay.handler';
import { FormHandler } from './engine/handlers/form.handler';
import { HttpHandler } from './engine/handlers/http.handler';
import { NotificationHandler } from './engine/handlers/notification.handler';
import { SetHandler } from './engine/handlers/set.handler';
import { WebhookHandler } from './engine/handlers/webhook.handler';
import { TemplateUtil } from './engine/utils/template.util';
import { WorkflowEngineService } from './engine/workflow-engine.service';
import { RelationalWorkflowPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';

@Module({
  imports: [RelationalWorkflowPersistenceModule],
  controllers: [WorkflowsController],
  providers: [
    WorkflowsService,
    WorkflowEngineService,
    HttpHandler,
    WebhookHandler,
    DatabaseHandler,
    SetHandler,
    DelayHandler,
    NotificationHandler,
    FormHandler,
    TemplateUtil,
  ],
  exports: [WorkflowsService, WorkflowEngineService, TemplateUtil],
})
export class WorkflowsModule {}
