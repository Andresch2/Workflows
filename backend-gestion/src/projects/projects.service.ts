import {
  // common
  Injectable,
} from '@nestjs/common';
import { Inngest } from 'inngest';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Project } from './domain/project';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectRepository } from './infrastructure/persistence/project.repository';

@Injectable()
export class ProjectsService {
  private inngest = new Inngest({ id: 'backend-gestion' });

  constructor(
    // Dependencies here
    private readonly projectRepository: ProjectRepository,
  ) {}

  async create(createProjectDto: CreateProjectDto, user: Project['user']) {
    // Do not remove comment below.
    // <creating-property />

    const project = await this.projectRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      endDate: createProjectDto.endDate,

      startDate: createProjectDto.startDate,

      description: createProjectDto.description,

      name: createProjectDto.name,

      user: user,
    });

    // Fase 3: Emitir evento project.created para auto-triggers
    try {
      await this.inngest.send({
        name: 'project.created',
        data: {
          projectId: project.id,
          projectName: project.name,
        },
      });
    } catch (e) {
      console.warn('Failed to emit project.created event:', e);
    }

    return project;
  }

  async findAllWithPagination({
    paginationOptions,
    user,
  }: {
    paginationOptions: IPaginationOptions;
    user: Project['user'];
  }) {
    return this.projectRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
      userId: user?.role?.id === 1 ? undefined : (user?.id as string),
    });
  }

  findById(id: Project['id']) {
    return this.projectRepository.findById(id);
  }

  findByIds(ids: Project['id'][]) {
    return this.projectRepository.findByIds(ids);
  }

  async update(
    id: Project['id'],

    updateProjectDto: UpdateProjectDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    const updated = await this.projectRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      endDate: updateProjectDto.endDate,

      startDate: updateProjectDto.startDate,

      description: updateProjectDto.description,

      name: updateProjectDto.name,
    });

    // Fase 3: Emitir evento project.updated para auto-triggers
    try {
      await this.inngest.send({
        name: 'project.updated',
        data: {
          projectId: id,
          projectName: updated?.name,
        },
      });
    } catch (e) {
      console.warn('Failed to emit project.updated event:', e);
    }

    return updated;
  }

  remove(id: Project['id']) {
    return this.projectRepository.remove(id);
  }
}
