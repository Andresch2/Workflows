import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { WorkflowNodeType } from '../domain/workflow-node-type.enum';

export class UpdateWorkflowNodeDto {
  @ApiPropertyOptional({ enum: WorkflowNodeType })
  @IsEnum(WorkflowNodeType)
  @IsOptional()
  type?: WorkflowNodeType;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  name?: string | null;

  @ApiPropertyOptional({ type: Object })
  @IsObject()
  @IsOptional()
  config?: Record<string, any> | null;

  @ApiPropertyOptional({ type: Object })
  @IsObject()
  @IsOptional()
  dataSchema?: Record<string, any> | null;

  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @IsOptional()
  x?: number;

  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @IsOptional()
  y?: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  @ValidateIf((o) => o.parentId !== null)
  @IsUUID()
  @IsOptional()
  parentId?: string | null;
}
