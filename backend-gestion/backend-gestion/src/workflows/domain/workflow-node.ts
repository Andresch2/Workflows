import { ApiProperty } from '@nestjs/swagger';
import { WorkflowNodeType } from './workflow-node-type.enum';

export class WorkflowNode {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({
    enum: WorkflowNodeType,
    description: 'Tipo de nodo del workflow',
  })
  type: WorkflowNodeType;

  @ApiProperty({
    type: Object,
    nullable: true,
    description: 'Configuracion JSON del nodo',
  })
  config?: Record<string, any> | null;

  @ApiProperty({
    type: Object,
    nullable: true,
    description: 'Schema JSON de datos de entrada/salida del nodo',
  })
  dataSchema?: Record<string, any> | null;

  @ApiProperty({ type: Number, description: 'Posicion X en el canvas' })
  x: number;

  @ApiProperty({ type: Number, description: 'Posicion Y en el canvas' })
  y: number;

  @ApiProperty({ type: String, description: 'ID del workflow asociado' })
  workflowId: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'ID del nodo padre (null = nodo raiz)',
  })
  parentId?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
