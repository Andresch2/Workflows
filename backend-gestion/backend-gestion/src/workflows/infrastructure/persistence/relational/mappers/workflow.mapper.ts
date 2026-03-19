import { Workflow } from '../../../../domain/workflow';
import { WorkflowEntity } from '../entities/workflow.entity';

export class WorkflowMapper {
  static toDomain(entity: WorkflowEntity): Workflow {
    const domain = new Workflow();
    domain.id = entity.id;
    domain.title = entity.title;
    domain.description = entity.description;
    domain.triggerType = entity.triggerType;
    domain.eventName = entity.eventName;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;

    if (entity.user) {
      domain.user = {
        id: Number(entity.user.id),
        email: entity.user.email,
        firstName: entity.user.firstName,
        lastName: entity.user.lastName,
      } as any;
    }

    if (entity.project) {
      domain.project = {
        id: entity.project.id,
        name: entity.project.name,
      } as any;
    }

    return domain;
  }

  static toPersistence(domain: Partial<Workflow>): Partial<WorkflowEntity> {
    const entity: Partial<WorkflowEntity> = {};
    if (domain.title !== undefined) entity.title = domain.title;
    if (domain.description !== undefined)
      entity.description = domain.description;
    if (domain.triggerType !== undefined)
      entity.triggerType = domain.triggerType;
    if (domain.eventName !== undefined)
      entity.eventName = domain.eventName;
    if (domain.user !== undefined) entity.user = domain.user as any;
    if (domain.project !== undefined) entity.project = domain.project as any;
    return entity;
  }
}
