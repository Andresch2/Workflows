import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowConnectionRepository } from '../workflow-connection.repository';
import { WorkflowNodeRepository } from '../workflow-node.repository';
import { WorkflowRepository } from '../workflow.repository';
import { WorkflowConnectionEntity } from './entities/workflow-connection.entity';
import { WorkflowNodeEntity } from './entities/workflow-node.entity';
import { WorkflowEntity } from './entities/workflow.entity';
import { RelationalWorkflowConnectionRepository } from './repositories/workflow-connection.repository';
import { RelationalWorkflowNodeRepository } from './repositories/workflow-node.repository';
import { RelationalWorkflowRepository } from './repositories/workflow.repository';
import { WorkflowDatabaseConfig } from './entities/workflow-database-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowEntity,
      WorkflowNodeEntity,
      WorkflowConnectionEntity,
      WorkflowDatabaseConfig,
    ]),
  ],
  providers: [
    {
      provide: WorkflowRepository,
      useClass: RelationalWorkflowRepository,
    },
    {
      provide: WorkflowNodeRepository,
      useClass: RelationalWorkflowNodeRepository,
    },
    {
      provide: WorkflowConnectionRepository,
      useClass: RelationalWorkflowConnectionRepository,
    },
  ],
  exports: [WorkflowRepository, WorkflowNodeRepository, WorkflowConnectionRepository],
})
export class RelationalWorkflowPersistenceModule { }
