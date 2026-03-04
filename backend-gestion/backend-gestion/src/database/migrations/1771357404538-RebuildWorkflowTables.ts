import { MigrationInterface, QueryRunner } from 'typeorm';

export class RebuildWorkflowTables1771357404538 implements MigrationInterface {
  name = 'RebuildWorkflowTables1771357404538';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Clear old workflow data — existing rows lack the new NOT NULL columns (title, triggerType)
    await queryRunner.query(`DELETE FROM "workflow_node"`);
    await queryRunner.query(`DELETE FROM "workflow"`);

    await queryRunner.query(
      `ALTER TABLE "project" DROP CONSTRAINT "FK_user_project"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" DROP CONSTRAINT "FK_workflow_node_parent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" DROP CONSTRAINT "FK_workflow_project"`,
    );
    await queryRunner.query(`ALTER TABLE "workflow_node" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "workflow_node" DROP COLUMN "position"`,
    );
    await queryRunner.query(`ALTER TABLE "workflow_node" DROP COLUMN "branch"`);
    await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "workflow" DROP COLUMN "inngestEventName"`,
    );
    await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "isActive"`);
    await queryRunner.query(
      `ALTER TABLE "workflow" DROP COLUMN "triggerEvent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ADD "x" double precision NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ADD "y" double precision NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD "title" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD "triggerType" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" DROP CONSTRAINT "FK_3797a20ef5553ae87af126bc2fe"`,
    );
    // Delete orphaned tasks (NULL projectId) before making column NOT NULL
    await queryRunner.query(`DELETE FROM "task" WHERE "projectId" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "projectId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."workflow_node_type_enum" RENAME TO "workflow_node_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workflow_node_type_enum" AS ENUM('TRIGGER', 'HTTP', 'WEBHOOK', 'ACTION', 'DELAY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" TYPE "public"."workflow_node_type_enum" USING "type"::"text"::"public"."workflow_node_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" SET DEFAULT 'ACTION'`,
    );
    await queryRunner.query(`DROP TYPE "public"."workflow_node_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "task" ADD CONSTRAINT "FK_3797a20ef5553ae87af126bc2fe" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD CONSTRAINT "FK_7c4b0d3b77eaf26f8b4da879e63" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ADD CONSTRAINT "FK_f578da76b2efd2fbcb707adfa38" FOREIGN KEY ("parentId") REFERENCES "workflow_node"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD CONSTRAINT "FK_b77c7678b1ec41b60d48a7e3978" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workflow" DROP CONSTRAINT "FK_b77c7678b1ec41b60d48a7e3978"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" DROP CONSTRAINT "FK_f578da76b2efd2fbcb707adfa38"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" DROP CONSTRAINT "FK_7c4b0d3b77eaf26f8b4da879e63"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" DROP CONSTRAINT "FK_3797a20ef5553ae87af126bc2fe"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workflow_node_type_enum_old" AS ENUM('ACTION', 'CONDITION', 'DELAY', 'NOTIFICATION')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" TYPE "public"."workflow_node_type_enum_old" USING "type"::"text"::"public"."workflow_node_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" SET DEFAULT 'ACTION'`,
    );
    await queryRunner.query(`DROP TYPE "public"."workflow_node_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."workflow_node_type_enum_old" RENAME TO "workflow_node_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" ALTER COLUMN "projectId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "task" ADD CONSTRAINT "FK_3797a20ef5553ae87af126bc2fe" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "triggerType"`);
    await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "title"`);
    await queryRunner.query(`ALTER TABLE "workflow_node" DROP COLUMN "y"`);
    await queryRunner.query(`ALTER TABLE "workflow_node" DROP COLUMN "x"`);
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD "triggerEvent" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD "isActive" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD "inngestEventName" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD "name" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ADD "branch" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ADD "position" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ADD "name" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD CONSTRAINT "FK_workflow_project" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ADD CONSTRAINT "FK_workflow_node_parent" FOREIGN KEY ("parentId") REFERENCES "workflow_node"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD CONSTRAINT "FK_user_project" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
