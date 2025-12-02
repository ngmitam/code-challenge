import { DataSource } from "typeorm";
import { Item } from "./Item";
import { User } from "./User";
import logger from "../utils/logger";
import config from "../config";
import bcrypt from "bcrypt";

const isPostgres = config.databaseUrl.startsWith("postgresql://");

export const AppDataSource = new DataSource(
	isPostgres
		? {
				type: "postgres" as const,
				url: config.databaseUrl,
				entities: [Item, User],
				migrations:
					config.nodeEnv === "production"
						? ["src/db/migrations/*.ts"]
						: [],
				synchronize: config.nodeEnv === "test", // Use synchronize for tests
				migrationsRun: config.nodeEnv === "production",
				logging: config.nodeEnv === "development",
				ssl:
					config.nodeEnv === "production"
						? { rejectUnauthorized: false }
						: false,
				extra: {
					max: 20, // Connection pool size
					min: 5,
					acquireTimeoutMillis: 60000,
					createTimeoutMillis: 30000,
					idleTimeoutMillis: 600000,
				},
		  }
		: {
				type: "sqlite" as const,
				database: config.databaseUrl,
				entities: [Item, User],
				migrations:
					config.nodeEnv === "production"
						? ["src/db/migrations/*.ts"]
						: [],
				synchronize: config.nodeEnv === "test", // Use synchronize for tests
				migrationsRun: config.nodeEnv === "production",
				logging: config.nodeEnv === "development",
		  }
);

export class Database {
	private initialized: boolean = false;

	public async initialize(maxRetries: number = 3): Promise<void> {
		if (this.initialized) return;

		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				await AppDataSource.initialize();
				this.initialized = true;
				logger.info("Database initialized with TypeORM");
				await this.createDefaultUser();
				return;
			} catch (err) {
				lastError = err as Error;
				logger.warn(
					`Database initialization attempt ${attempt}/${maxRetries} failed`,
					err
				);
				if (attempt < maxRetries) {
					const delay = Math.min(
						1000 * Math.pow(2, attempt - 1),
						10000
					); // Exponential backoff, max 10s
					logger.info(
						`Retrying database connection in ${delay}ms...`
					);
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		logger.error(
			"Database initialization failed after all retries",
			lastError
		);
		throw lastError;
	}

	private async createDefaultUser(): Promise<void> {
		// Only create default user in development, test, or if explicitly enabled
		const shouldCreateDefaultUser =
			config.nodeEnv === "development" ||
			config.nodeEnv === "test" ||
			config.development.createDefaultUser;

		if (!shouldCreateDefaultUser) {
			logger.info(
				"Skipping default user creation (not in development/test or CREATE_DEFAULT_USER not set)"
			);
			return;
		}

		const defaultUsername = config.development.defaultUsername;
		const defaultPassword = config.development.defaultPassword;

		try {
			const userRepository = AppDataSource.getRepository(User);
			const existingUser = await userRepository.findOneBy({
				username: defaultUsername,
			});
			if (!existingUser) {
				const hashedPassword = await bcrypt.hash(
					defaultPassword,
					config.bcryptRounds
				);
				const user = userRepository.create({
					username: defaultUsername,
					passwordHash: hashedPassword,
				});
				await userRepository.save(user);
				logger.warn(
					`Default user '${defaultUsername}' created with password '${defaultPassword}'. Please change the password in production!`
				);
			}
		} catch (err: unknown) {
			const error = err as Error;
			// Ignore unique constraint errors - user might already exist from previous test runs
			if (
				!error.message?.includes("UNIQUE constraint") &&
				!error.message?.includes("duplicate key")
			) {
				logger.error("Failed to create default user", error);
				throw error;
			}
		}
	}

	public async close(): Promise<void> {
		try {
			if (AppDataSource.isInitialized) {
				await AppDataSource.destroy();
				logger.info("Database connection closed");
			} else {
				logger.info(
					"Database connection already closed or not initialized"
				);
			}
		} catch (err) {
			logger.warn("Error closing database connection", err);
		}
	}
}

export const database = new Database();
