import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWorkflowNodeType1772546362710 implements MigrationInterface {
  name = 'UpdateWorkflowNodeType1772546362710';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."workflow_node_type_enum" RENAME TO "workflow_node_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workflow_node_type_enum" AS ENUM('TRIGGER', 'HTTP', 'WEBHOOK', 'DATABASE', 'SET', 'DELAY', 'NOTIFICATION', 'FORM')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" TYPE "public"."workflow_node_type_enum" USING (CASE WHEN "type"::"text" = 'ACTION' THEN 'DATABASE' ELSE "type"::"text" END)::"public"."workflow_node_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" SET DEFAULT 'DATABASE'`,
    );
    await queryRunner.query(`DROP TYPE "public"."workflow_node_type_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."workflow_node_type_enum_old" AS ENUM('TRIGGER', 'HTTP', 'WEBHOOK', 'ACTION', 'DELAY', 'NOTIFICATION', 'FORM')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" TYPE "public"."workflow_node_type_enum_old" USING (CASE WHEN "type"::"text" IN ('DATABASE', 'SET') THEN 'ACTION' ELSE "type"::"text" END)::"public"."workflow_node_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" SET DEFAULT 'ACTION'`,
    );
    await queryRunner.query(`DROP TYPE "public"."workflow_node_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."workflow_node_type_enum_old" RENAME TO "workflow_node_type_enum"`,
    );
  }
}
