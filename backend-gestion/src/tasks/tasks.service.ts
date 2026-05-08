import {
  // common
  Injectable,
} from '@nestjs/common';
import { Inngest } from 'inngest';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Task } from './domain/task';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskRepository } from './infrastructure/persistence/task.repository';

@Injectable()
export class TasksService {
  private inngest = new Inngest({ id: 'backend-gestion' });

  constructor(
    // Dependencies here
    private readonly taskRepository: TaskRepository,
  ) {}

  async create(createTaskDto: CreateTaskDto) {
    // Do not remove comment below.
    // <creating-property />

    const task = await this.taskRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      status: createTaskDto.status,

      description: createTaskDto.description,

      title: createTaskDto.title,

      projectId: createTaskDto.projectId,
    });

    // Fase 3: Emitir evento task.created para auto-triggers
    try {
      await this.inngest.send({
        name: 'task.created',
        data: {
          taskId: task.id,
          projectId: task.projectId,
          title: task.title,
          status: task.status,
        },
      });
    } catch (e) {
      // No bloquear la creación si Inngest falla
      console.warn('Failed to emit task.created event:', e);
    }

    return task;
  }

  findAllWithPagination({
    paginationOptions,
    projectId,
  }: {
    paginationOptions: IPaginationOptions;
    projectId?: string;
  }) {
    return this.taskRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
      projectId,
    });
  }

  findById(id: Task['id']) {
    return this.taskRepository.findById(id);
  }

  findByIds(ids: Task['id'][]) {
    return this.taskRepository.findByIds(ids);
  }

  async update(
    id: Task['id'],

    updateTaskDto: UpdateTaskDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    const updated = await this.taskRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      status: updateTaskDto.status,

      description: updateTaskDto.description,

      title: updateTaskDto.title,

      projectId: updateTaskDto.projectId,
    });

    // Fase 3: Emitir evento task.completed si se cambia a COMPLETADA
    if (updateTaskDto.status === 'COMPLETADA' && updated) {
      try {
        await this.inngest.send({
          name: 'task.completed',
          data: {
            taskId: id,
            projectId: updated.projectId,
            title: updated.title,
            status: updated.status,
          },
        });
      } catch (e) {
        console.warn('Failed to emit task.completed event:', e);
      }
    }

    return updated;
  }

  remove(id: Task['id']) {
    return this.taskRepository.remove(id);
  }
}
