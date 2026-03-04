import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * This migration originally dropped the old workflow tables.
 * Since it already ran and dropped them, it now RECREATES the tables
 * with the new schema (title, triggerType, x, y, etc.).
 */
export class DropOldWorkflowTables1771400000000 implements MigrationInterface {
  name = 'DropOldWorkflowTables1771400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Recreate the enum type
    await queryRunner.query(
      `CREATE TYPE "public"."workflow_node_type_enum" AS ENUM('TRIGGER', 'HTTP', 'WEBHOOK', 'ACTION', 'DELAY')`,
    );

    // Create workflow table
    await queryRunner.query(`
      CREATE TABLE "workflow" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" character varying,
        "triggerType" character varying NOT NULL,
        "projectId" uuid,
        "userId" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workflow" PRIMARY KEY ("id"),
        CONSTRAINT "FK_workflow_project" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_workflow_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // Create workflow_node table
    await queryRunner.query(`
      CREATE TABLE "workflow_node" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."workflow_node_type_enum" NOT NULL DEFAULT 'ACTION',
        "config" jsonb,
        "x" double precision NOT NULL DEFAULT '0',
        "y" double precision NOT NULL DEFAULT '0',
        "workflowId" uuid NOT NULL,
        "parentId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workflow_node" PRIMARY KEY ("id"),
        CONSTRAINT "FK_workflow_node_workflow" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_workflow_node_parent" FOREIGN KEY ("parentId") REFERENCES "workflow_node"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await _queryRunner.query(`DROP TABLE IF EXISTS "workflow_node" CASCADE`);
    await _queryRunner.query(`DROP TABLE IF EXISTS "workflow" CASCADE`);
    await _queryRunner.query(
      `DROP TYPE IF EXISTS "public"."workflow_node_type_enum"`,
    );
  }
}
