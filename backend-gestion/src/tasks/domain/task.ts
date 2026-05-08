import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../infrastructure/persistence/relational/entities/task.entity';

export class Task {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'Implementar login',
  })
  title: string;

  @ApiProperty({
    type: String,
    example: 'Crear el formulario de login con validaciones',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    enum: TaskStatus,
    example: TaskStatus.PENDIENTE,
  })
  status: TaskStatus;

  @ApiProperty({
    type: String,
    description: 'ID del proyecto asociado',
  })
  projectId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
