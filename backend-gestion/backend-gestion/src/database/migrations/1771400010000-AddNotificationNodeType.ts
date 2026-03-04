import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationNodeType1771400010000
  implements MigrationInterface
{
  name = 'AddNotificationNodeType1771400010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."workflow_node_type_enum" ADD VALUE 'NOTIFICATION'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres does not support removing values from enums easily without dropping and recreating the type.
    // For simplicity, we will leave it as is in down migration or recreate the type if strictly needed.
    // However, since this is a forward-only change for a new feature, a no-op down is acceptable for now
    // or we'd have to create a new type, migrate data, drop old type, rename new type.
  }
}
