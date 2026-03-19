import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIfNodeType1773200000000 implements MigrationInterface {
  name = 'AddIfNodeType1773200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Rename existing enum
    await queryRunner.query(
      `ALTER TYPE "public"."workflow_node_type_enum" RENAME TO "workflow_node_type_enum_old"`,
    );

    // 2. Create new enum with 'IF'
    await queryRunner.query(
      `CREATE TYPE "public"."workflow_node_type_enum" AS ENUM('TRIGGER', 'HTTP', 'WEBHOOK', 'DATABASE', 'DELAY', 'NOTIFICATION', 'FORM', 'IF')`,
    );

    // 3. Update the column to use the new enum
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" TYPE "public"."workflow_node_type_enum" USING "type"::"text"::"public"."workflow_node_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" SET DEFAULT 'TRIGGER'`,
    );

    // 4. Drop the old enum
    await queryRunner.query(`DROP TYPE "public"."workflow_node_type_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Rename existing enum
    await queryRunner.query(
      `ALTER TYPE "public"."workflow_node_type_enum" RENAME TO "workflow_node_type_enum_old"`,
    );

    // 2. Create new enum without 'IF'
    await queryRunner.query(
      `CREATE TYPE "public"."workflow_node_type_enum" AS ENUM('TRIGGER', 'HTTP', 'WEBHOOK', 'DATABASE', 'DELAY', 'NOTIFICATION', 'FORM')`,
    );

    // 3. Update the column (IF nodes will be lost or need to be handled, here we just revert type)
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" TYPE "public"."workflow_node_type_enum" USING "type"::"text"::"public"."workflow_node_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workflow_node" ALTER COLUMN "type" SET DEFAULT 'TRIGGER'`,
    );

    // 4. Drop the old enum
    await queryRunner.query(`DROP TYPE "public"."workflow_node_type_enum_old"`);
  }
}
