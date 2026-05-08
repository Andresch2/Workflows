import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixProjectDateTypes1770264429223 implements MigrationInterface {
  name = 'FixProjectDateTypes1770264429223';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "startDate" TYPE DATE USING "startDate"::DATE`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "endDate" TYPE DATE USING "endDate"::DATE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "startDate" TYPE TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "endDate" TYPE TIMESTAMP`,
    );
  }
}
