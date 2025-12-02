import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import itemRoutes from "../../src/routes/v1/items";
import authRoutes from "../../src/routes/v1/auth";
import { database, AppDataSource } from "../../src/db/database";
import { Item } from "../../src/db/Item";
import { User } from "../../src/db/User";
import { errorHandler } from "../../src/middleware/errorHandler";
import { tracingMiddleware } from "../../src/middleware/tracing";

/**
 * Test application factory
 * Creates a configured Express app for testing
 */
export function createTestApp(
	testConfig?: Partial<typeof import("../../src/config").default>
) {
	const config = testConfig || require("../../src/config").default;
	const app = express();

	// Rate limiting
	const limiter = rateLimit({
		windowMs: config.rateLimit.windowMs,
		max: config.rateLimit.maxRequests,
		message: "Too many requests from this IP, please try again later.",
		standardHeaders: true,
		legacyHeaders: false,
	});

	// Middleware
	app.use(helmet());
	app.use(
		cors(
			config.corsOrigin
				? { origin: config.corsOrigin, credentials: true }
				: {}
		)
	);
	app.use(limiter);
	app.use(tracingMiddleware);
	app.use(express.json());

	// Routes
	app.use("/api/v1/auth", authRoutes);
	// Use a mock rate limiter for tests to avoid timers
	app.use(
		"/api/v1/items",
		(req: Request, res: Response, next: NextFunction) => {
			// Mock rate limiter that always allows requests
			next();
		},
		itemRoutes
	);

	// Health check
	app.get("/health", async (req, res) => {
		try {
			const itemRepository = AppDataSource.getRepository(Item);
			const userRepository = AppDataSource.getRepository(User);
			const itemCount = await itemRepository
				.createQueryBuilder("item")
				.where("item.deletedAt IS NULL")
				.getCount();
			const userCount = await userRepository.count();
			res.json({
				status: "OK",
				timestamp: new Date().toISOString(),
				database: {
					items: itemCount,
					users: userCount,
				},
			});
		} catch (error) {
			res.status(500).json({
				status: "ERROR",
				timestamp: new Date().toISOString(),
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	});

	// Error handling middleware
	app.use(errorHandler);

	return app;
}

/**
 * Database test utilities
 */
export class DatabaseTestHelper {
	static async setup() {
		await database.initialize();
	}

	static async teardown() {
		await database.close();
	}

	static async clear() {
		const itemRepository = AppDataSource.getRepository(Item);
		const userRepository = AppDataSource.getRepository(User);
		await itemRepository.clear();
		await userRepository.clear();
	}

	static async createTestUser(
		username = "testuser",
		password = "testpass123"
	) {
		const userRepository = AppDataSource.getRepository(User);
		const user = userRepository.create({
			username,
			passwordHash: await import("bcrypt").then((bcrypt) =>
				bcrypt.hash(password, 10)
			),
		});
		return await userRepository.save(user);
	}

	static async createTestItem(
		userId: number,
		name = "Test Item",
		description = "Test Description"
	) {
		const itemRepository = AppDataSource.getRepository(Item);
		const item = itemRepository.create({
			name,
			description,
			userId,
		});
		return await itemRepository.save(item);
	}
}

/**
 * Authentication test utilities
 */
export class AuthTestHelper {
	private app: express.Application;

	constructor(app: express.Application) {
		this.app = app;
	}

	async register(username: string, password: string) {
		const response = await request(this.app)
			.post("/api/v1/auth/register")
			.send({ username, password });
		return response;
	}

	async login(username: string, password: string) {
		const response = await request(this.app)
			.post("/api/v1/auth/login")
			.send({ username, password });
		return response;
	}

	async getAuthToken(username = "testuser", password = "testpass123") {
		await this.register(username, password);
		const loginResponse = await this.login(username, password);
		return loginResponse.body.token;
	}
}

/**
 * Items test utilities
 */
export class ItemsTestHelper {
	private app: express.Application;
	private authHelper: AuthTestHelper;

	constructor(app: express.Application) {
		this.app = app;
		this.authHelper = new AuthTestHelper(app);
	}

	async createItem(
		token: string,
		name = "Test Item",
		description = "Test Description"
	) {
		const response = await request(this.app)
			.post("/api/v1/items")
			.set("Authorization", `Bearer ${token}`)
			.send({ name, description });
		return response;
	}

	async getItems(token: string) {
		const response = await request(this.app)
			.get("/api/v1/items")
			.set("Authorization", `Bearer ${token}`);
		return response;
	}

	async getItem(token: string, id: number) {
		const response = await request(this.app)
			.get(`/api/v1/items/${id}`)
			.set("Authorization", `Bearer ${token}`);
		return response;
	}

	async updateItem(
		token: string,
		id: number,
		name: string,
		description: string
	) {
		const response = await request(this.app)
			.put(`/api/v1/items/${id}`)
			.set("Authorization", `Bearer ${token}`)
			.send({ name, description });
		return response;
	}

	async deleteItem(token: string, id: number) {
		const response = await request(this.app)
			.delete(`/api/v1/items/${id}`)
			.set("Authorization", `Bearer ${token}`);
		return response;
	}

	async getAuthenticatedUser() {
		const token = await this.authHelper.getAuthToken();
		return { token };
	}
}
