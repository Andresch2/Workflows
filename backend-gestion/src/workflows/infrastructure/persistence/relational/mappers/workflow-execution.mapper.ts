import { WorkflowExecution } from '../../../../domain/workflow-execution';
import { WorkflowExecutionEntity } from '../entities/workflow-execution.entity';
import { WorkflowMapper } from './workflow.mapper';

export class WorkflowExecutionMapper {
  static toDomain(raw: WorkflowExecutionEntity): WorkflowExecution {
    const domain = new WorkflowExecution();
    domain.id = raw.id;
    domain.workflowId = raw.workflowId;
    domain.status = raw.status;
    domain.triggerType = raw.triggerType;
    domain.payload = raw.payload;
    domain.results = raw.results;
    domain.error = raw.error;
    domain.startedAt = raw.startedAt;
    domain.finishedAt = raw.finishedAt;

    if (raw.workflow) {
      domain.workflow = WorkflowMapper.toDomain(raw.workflow);
    }

    return domain;
  }

  static toPersistence(domain: WorkflowExecution): WorkflowExecutionEntity {
    const entity = new WorkflowExecutionEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.workflowId = domain.workflowId;
    entity.status = domain.status;
    entity.triggerType = domain.triggerType;
    entity.payload = domain.payload;
    entity.results = domain.results;
    entity.error = domain.error ?? null;
    entity.startedAt = domain.startedAt;
    entity.finishedAt = domain.finishedAt ?? null;

    return entity;
  }
}
