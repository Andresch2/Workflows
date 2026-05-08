import { ApiProperty } from '@nestjs/swagger';

export class WorkflowConnection {
    @ApiProperty({ type: String })
    id: string;

    @ApiProperty({ type: String })
    workflowId: string;

    @ApiProperty({ type: String })
    sourceNodeId: string;

    @ApiProperty({ type: String })
    targetNodeId: string;

    @ApiProperty({ type: String, nullable: true })
    sourceHandle?: string | null;

    @ApiProperty({ type: String, nullable: true })
    targetHandle?: string | null;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
