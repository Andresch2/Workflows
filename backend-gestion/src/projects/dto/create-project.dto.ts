import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    required: true,
    type: String,
    example: 'Sistema de Gestión de Tareas',
    description: 'Nombre del proyecto',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    required: false,
    type: String,
    example: 'Plataforma web para gestionar proyectos y tareas del equipo',
    description: 'Descripción detallada del proyecto',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    required: false,
    type: String,
    example: '2024-02-01',
    description: 'Fecha de inicio del proyecto',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  startDate?: string | null;

  @ApiProperty({
    required: false,
    type: String,
    example: '2024-06-30',
    description: 'Fecha de finalización del proyecto',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  endDate?: string | null;
}
