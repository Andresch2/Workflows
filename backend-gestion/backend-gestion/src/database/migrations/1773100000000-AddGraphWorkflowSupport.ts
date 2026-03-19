import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGraphWorkflowSupport1773100000000 implements MigrationInterface {
    name = 'AddGraphWorkflowSupport1773100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add 'name' column to workflow_node
        await queryRunner.query(`
      ALTER TABLE "workflow_node"
      ADD COLUMN IF NOT EXISTS "name" varchar NULL
    `);

        // 2. Add 'eventName' column to workflow table
        await queryRunner.query(`
      ALTER TABLE "workflow"
      ADD COLUMN IF NOT EXISTS "eventName" varchar NULL
    `);

        // 3. Create workflow_connection table
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "workflow_connection" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workflowId" uuid NOT NULL,
        "sourceNodeId" uuid NOT NULL,
        "targetNodeId" uuid NOT NULL,
        "sourceHandle" varchar NULL,
        "targetHandle" varchar NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workflow_connection" PRIMARY KEY ("id"),
        CONSTRAINT "FK_wc_workflow" FOREIGN KEY ("workflowId")
          REFERENCES "workflow"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_wc_sourceNode" FOREIGN KEY ("sourceNodeId")
          REFERENCES "workflow_node"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_wc_targetNode" FOREIGN KEY ("targetNodeId")
          REFERENCES "workflow_node"("id") ON DELETE CASCADE
      )
    `);

        // 4. Create index on workflowId for performance
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_wc_workflowId"
      ON "workflow_connection" ("workflowId")
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wc_workflowId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "workflow_connection"`);
        await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN IF EXISTS "eventName"`);
        await queryRunner.query(`ALTER TABLE "workflow_node" DROP COLUMN IF EXISTS "name"`);
    }
}
