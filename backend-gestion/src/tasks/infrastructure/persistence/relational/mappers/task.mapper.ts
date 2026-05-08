import { ProjectEntity } from '../../../../../projects/infrastructure/persistence/relational/entities/project.entity';
import { Task } from '../../../../domain/task';

import { TaskEntity } from '../entities/task.entity';

export class TaskMapper {
  static toDomain(raw: TaskEntity): Task {
    const domainEntity = new Task();
    domainEntity.status = raw.status;

    domainEntity.description = raw.description;

    domainEntity.title = raw.title;

    domainEntity.id = raw.id;
    domainEntity.projectId = raw.projectId;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Task): TaskEntity {
    const persistenceEntity = new TaskEntity();
    persistenceEntity.status = domainEntity.status;

    persistenceEntity.description = domainEntity.description;

    persistenceEntity.title = domainEntity.title;

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.projectId) {
      persistenceEntity.projectId = domainEntity.projectId;
      const project = new ProjectEntity();
      project.id = domainEntity.projectId;
      persistenceEntity.project = project;
    }

    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
