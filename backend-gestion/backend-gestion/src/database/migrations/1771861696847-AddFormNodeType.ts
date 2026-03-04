import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFormNodeType1771861696847 implements MigrationInterface {
  name = 'AddFormNodeType1771861696847';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workflow" DROP CONSTRAINT "FK_workflow_project"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" DROP CONSTRAINT "FK_workflow_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" DROP CONSTRAINT "FK_workflow_node_workflow"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" DROP CONSTRAINT "FK_workflow_node_parent"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."workflow_node_type_enum" RENAME TO "workflow_node_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workflow_node_type_enum" AS ENUM('TRIGGER', 'HTTP', 'WEBHOOK', 'ACTION', 'DELAY', 'NOTIFICATION', 'FORM')`,
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
      `ALTER TABLE "workflow" ADD CONSTRAINT "FK_b77c7678b1ec41b60d48a7e3978" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD CONSTRAINT "FK_5c43d4a3144b7c40bcfd7071440" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ADD CONSTRAINT "FK_d3cacae8a001b006c3f7f4bbf81" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ADD CONSTRAINT "FK_f578da76b2efd2fbcb707adfa38" FOREIGN KEY ("parentId") REFERENCES "workflow_node"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workflow_node" DROP CONSTRAINT "FK_f578da76b2efd2fbcb707adfa38"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" DROP CONSTRAINT "FK_d3cacae8a001b006c3f7f4bbf81"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" DROP CONSTRAINT "FK_5c43d4a3144b7c40bcfd7071440"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" DROP CONSTRAINT "FK_b77c7678b1ec41b60d48a7e3978"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workflow_node_type_enum_old" AS ENUM('TRIGGER', 'HTTP', 'WEBHOOK', 'ACTION', 'DELAY', 'NOTIFICATION')`,
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
      `ALTER TABLE "workflow_node" ADD CONSTRAINT "FK_workflow_node_parent" FOREIGN KEY ("parentId") REFERENCES "workflow_node"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ADD CONSTRAINT "FK_workflow_node_workflow" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD CONSTRAINT "FK_workflow_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD CONSTRAINT "FK_workflow_project" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
