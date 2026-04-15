import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCodeNodeType1773400000000 implements MigrationInterface {
  name = 'AddCodeNodeType1773400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."workflow_node_type_enum" RENAME TO "workflow_node_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workflow_node_type_enum" AS ENUM('TRIGGER', 'HTTP', 'WEBHOOK', 'DATABASE', 'DELAY', 'NOTIFICATION', 'FORM', 'IF', 'CODE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" TYPE "public"."workflow_node_type_enum" USING "type"::"text"::"public"."workflow_node_type_enum"`,
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
      `CREATE TYPE "public"."workflow_node_type_enum" AS ENUM('TRIGGER', 'HTTP', 'WEBHOOK', 'DATABASE', 'DELAY', 'NOTIFICATION', 'FORM', 'IF')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" TYPE "public"."workflow_node_type_enum" USING (CASE WHEN "type"::text = 'CODE' THEN 'IF' ELSE "type"::text END)::"public"."workflow_node_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" SET DEFAULT 'TRIGGER'`,
    );
    await queryRunner.query(`DROP TYPE "public"."workflow_node_type_enum_old"`);
  }
}
