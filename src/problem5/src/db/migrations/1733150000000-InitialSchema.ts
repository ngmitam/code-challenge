import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class InitialSchema1733150000000 implements MigrationInterface {
	name = "InitialSchema1733150000000";

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Create users table
		await queryRunner.createTable(
			new Table({
				name: "user",
				columns: [
					{
						name: "id",
						type: "integer",
						isPrimary: true,
						isGenerated: true,
						generationStrategy: "increment",
					},
					{
						name: "username",
						type: "varchar",
						length: "255",
						isUnique: true,
					},
					{
						name: "passwordHash",
						type: "varchar",
						length: "255",
					},
				],
			}),
			true
		);

		// Create items table
		await queryRunner.createTable(
			new Table({
				name: "item",
				columns: [
					{
						name: "id",
						type: "integer",
						isPrimary: true,
						isGenerated: true,
						generationStrategy: "increment",
					},
					{
						name: "name",
						type: "varchar",
						length: "100",
					},
					{
						name: "description",
						type: "text",
						isNullable: true,
					},
					{
						name: "userId",
						type: "integer",
					},
					{
						name: "deletedAt",
						type: "datetime",
						isNullable: true,
					},
				],
				foreignKeys: [
					{
						columnNames: ["userId"],
						referencedTableName: "user",
						referencedColumnNames: ["id"],
						onDelete: "CASCADE",
					},
				],
				indices: [
					{
						columnNames: ["userId"],
						name: "IDX_item_user_id",
					},
					{
						columnNames: ["deletedAt"],
						name: "IDX_item_deleted_at",
					},
				],
			}),
			true
		);

		// Create index for username
		await queryRunner.query(`
            CREATE INDEX "IDX_user_username" ON "user" ("username")
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Drop tables (foreign keys will be dropped automatically)
		await queryRunner.dropTable("item");
		await queryRunner.dropTable("user");
	}
}
