import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateWorkflowDto {
  @ApiProperty({ example: 'Mi Workflow' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Descripción del workflow', required: false })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiProperty({ enum: ['webhook', 'http', 'event'], example: 'webhook' })
  @IsEnum(['webhook', 'http', 'event'], {
    message: 'triggerType debe ser webhook, http o event',
  })
  @IsNotEmpty()
  triggerType: 'webhook' | 'http' | 'event';

  @ApiProperty({ example: 'task.created', required: false })
  @IsString()
  @IsOptional()
  eventName?: string | null;

  @ApiProperty({ example: 'uuid-del-proyecto', required: false })
  @IsUUID()
  @IsOptional()
  projectId?: string;
}
