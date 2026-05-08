import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToProject1770915500000 implements MigrationInterface {
  name = 'AddUserIdToProject1770915500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" ADD "userId" integer`);
    await queryRunner.query(
      `ALTER TABLE "project" ADD CONSTRAINT "FK_user_project" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" DROP CONSTRAINT "FK_user_project"`,
    );
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "userId"`);
  }
}
