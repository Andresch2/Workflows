import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { WorkflowNodeType } from '../domain/workflow-node-type.enum';

export class CreateWorkflowNodeDto {
  @ApiProperty({ enum: WorkflowNodeType, example: WorkflowNodeType.DATABASE })
  @IsEnum(WorkflowNodeType)
  @IsNotEmpty()
  type: WorkflowNodeType;

  @ApiPropertyOptional({
    type: Object,
    example: { url: 'https://example.com' },
  })
  @IsObject()
  @IsOptional()
  config?: Record<string, any> | null;

  @ApiProperty({ type: Number, example: 100 })
  @IsNumber()
  x: number;

  @ApiProperty({ type: Number, example: 200 })
  @IsNumber()
  y: number;

  @ApiProperty({ type: String })
  @IsUUID()
  @IsNotEmpty()
  workflowId: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @ValidateIf((o) => o.parentId !== null)
  @IsUUID()
  @IsOptional()
  parentId?: string | null;
}
