import { MigrationInterface, QueryRunner } from 'typeorm';

// Duplicate migration — already applied by 1771357404538. This is a no-op.
export class RebuildWorkflowTables1771357615166 implements MigrationInterface {
  name = 'RebuildWorkflowTables1771357615166';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async up(_queryRunner: QueryRunner): Promise<void> {
    // No-op: changes already applied by RebuildWorkflowTables1771357404538
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op
  }
}
