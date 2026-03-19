import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateWorkflowDto {
  @ApiPropertyOptional({ example: 'Mi Workflow actualizado' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Nueva descripción' })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({ enum: ['webhook', 'http', 'event'] })
  @IsEnum(['webhook', 'http', 'event'], {
    message: 'triggerType debe ser webhook, http o event',
  })
  @IsOptional()
  triggerType?: 'webhook' | 'http' | 'event';

  @ApiPropertyOptional({ example: 'task.created' })
  @IsString()
  @IsOptional()
  eventName?: string | null;
}
