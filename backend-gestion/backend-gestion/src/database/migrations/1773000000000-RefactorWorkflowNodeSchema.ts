import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorWorkflowNodeSchema1773000000000
  implements MigrationInterface
{
  name = 'RefactorWorkflowNodeSchema1773000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ADD COLUMN IF NOT EXISTS "dataSchema" jsonb`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."workflow_node_type_enum" RENAME TO "workflow_node_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workflow_node_type_enum" AS ENUM('TRIGGER', 'HTTP', 'WEBHOOK', 'DATABASE', 'DELAY', 'NOTIFICATION', 'FORM')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" TYPE "public"."workflow_node_type_enum" USING (CASE WHEN "type"::text = 'SET' THEN 'DATABASE' ELSE "type"::text END)::"public"."workflow_node_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" SET DEFAULT 'TRIGGER'`,
    );
    await queryRunner.query(`DROP TYPE "public"."workflow_node_type_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" TYPE "public"."workflow_node_type_enum" USING "type"::text::"public"."workflow_node_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" SET DEFAULT 'TRIGGER'`,
    );
    await queryRunner.query(`DROP TYPE "public"."workflow_node_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "workflow_node" DROP COLUMN IF EXISTS "dataSchema"`,
    );
  }
}
