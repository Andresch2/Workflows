import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWorkflowDatabaseConfig1773300000000 implements MigrationInterface {
    name = 'CreateWorkflowDatabaseConfig1773300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "workflow_database_config" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "label" character varying NOT NULL,
                "tableName" character varying NOT NULL,
                "endpoint" character varying NOT NULL,
                "editableFields" jsonb NOT NULL DEFAULT '[]',
                "jsonConfig" jsonb NOT NULL DEFAULT '{}',
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_tableName" UNIQUE ("tableName"),
                CONSTRAINT "PK_workflow_database_config" PRIMARY KEY ("id")
            )
        `);

        // Seed initial data
        await queryRunner.query(`
            INSERT INTO "workflow_database_config" ("label", "tableName", "endpoint", "editableFields", "jsonConfig") VALUES
            (
                'Proyectos', 
                'project', 
                '/api/v1/projects', 
                '[
                    {"key": "name", "label": "Nombre del proyecto", "type": "text", "placeholder": "Mi Proyecto"},
                    {"key": "description", "label": "Descripción", "type": "textarea", "placeholder": "Descripción del proyecto..."},
                    {"key": "startDate", "label": "Fecha de inicio", "type": "date"},
                    {"key": "endDate", "label": "Fecha de fin", "type": "date"}
                ]',
                '{"table": "project", "fields": ["id", "name", "description", "startDate", "endDate", "createdAt"]}'
            ),
            (
                'Tareas', 
                'task', 
                '/api/v1/tasks', 
                '[
                    {"key": "title", "label": "Título", "type": "text", "placeholder": "Nueva tarea"},
                    {"key": "description", "label": "Descripción", "type": "textarea", "placeholder": "Descripción de la tarea..."},
                    {"key": "status", "label": "Estado", "type": "select", "options": ["PENDIENTE", "EN_PROGRESO", "COMPLETADA"]},
                    {"key": "projectId", "label": "ID del Proyecto", "type": "text", "placeholder": "uuid del proyecto"}
                ]',
                '{"table": "task", "fields": ["id", "title", "description", "status", "projectId", "createdAt"]}'
            ),
            (
                'Workflows', 
                'workflow', 
                '/api/v1/workflows', 
                '[
                    {"key": "title", "label": "Título", "type": "text", "placeholder": "Mi Workflow"},
                    {"key": "description", "label": "Descripción", "type": "textarea", "placeholder": "Descripción..."},
                    {"key": "triggerType", "label": "Tipo de trigger", "type": "select", "options": ["http", "webhook", "event"]},
                    {"key": "eventName", "label": "Nombre del evento", "type": "text", "placeholder": "task.created"}
                ]',
                '{"table": "workflow", "fields": ["id", "title", "description", "triggerType", "eventName", "createdAt"]}'
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "workflow_database_config"`);
    }
}
