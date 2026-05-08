import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateWorkflowConnectionDto {
    @ApiProperty({ type: String })
    @IsUUID()
    @IsNotEmpty()
    workflowId: string;

    @ApiProperty({ type: String })
    @IsUUID()
    @IsNotEmpty()
    sourceNodeId: string;

    @ApiProperty({ type: String })
    @IsUUID()
    @IsNotEmpty()
    targetNodeId: string;

    @ApiPropertyOptional({ type: String, nullable: true })
    @IsString()
    @IsOptional()
    sourceHandle?: string | null;

    @ApiPropertyOptional({ type: String, nullable: true })
    @IsString()
    @IsOptional()
    targetHandle?: string | null;
}
