import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { TaskStatus } from '../infrastructure/persistence/relational/entities/task.entity';

export class CreateTaskDto {
  @ApiProperty({
    required: true,
    type: String,
    example: 'Implementar login',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    required: false,
    type: String,
    example: 'Crear el formulario de login con validaciones',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    required: true,
    enum: TaskStatus,
    example: TaskStatus.PENDIENTE,
    description: 'Estado de la tarea: PENDIENTE, EN_PROGRESO, COMPLETADA',
  })
  @IsEnum(TaskStatus)
  @IsNotEmpty()
  status: TaskStatus; // ← Debe ser TaskStatus, NO string

  @ApiProperty({
    required: true,
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del proyecto al que pertenece la tarea',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;
}
