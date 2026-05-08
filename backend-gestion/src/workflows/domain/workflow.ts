import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../../projects/domain/project';
import { User } from '../../users/domain/user';

export class Workflow {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  title: string;

  @ApiProperty({ type: String, nullable: true })
  description?: string | null;

  @ApiProperty({
    type: String,
    enum: ['webhook', 'http', 'event'],
    description: 'Tipo de trigger del workflow',
  })
  triggerType: 'webhook' | 'http' | 'event';

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Nombre del evento que dispara el workflow (solo para triggerType=event)',
  })
  eventName?: string | null;

  @ApiProperty({ type: () => User })
  user?: User | null;

  @ApiProperty({ type: () => Project })
  project?: Project | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
