import request from "supertest";

// Set test environment variables before any other imports
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-for-e2e-testing";
process.env.DATABASE_URL = "/tmp/test-e2e.db";
process.env.USE_REDIS = "false";

// Clear config cache to reload with new env
delete require.cache[require.resolve("../src/config")];

import { createTestApp } from "./utils/test-helpers";
import { DatabaseTestHelper } from "./utils/test-helpers";

interface Item {
	id: number;
	name: string;
	description: string;
	userId: number;
	createdAt: string;
	updatedAt: string;
}

/* eslint-disable no-console */

// Helper function to wait for the application to be ready
async function waitForAppReady(
	baseURL: string,
	maxRetries = 30
): Promise<void> {
	for (let i = 0; i < maxRetries; i++) {
		try {
			const response = await fetch(`${baseURL}/health`);
			if (response.ok) {
				console.log("✅ Application is ready!");
				return;
			}
		} catch {
			console.log(
				`⏳ Waiting for application... (${i + 1}/${maxRetries})`
			);
		}
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}
	throw new Error("Application failed to start within the expected time");
}

// End-to-End Test Suite
describe("End-to-End API Tests", () => {
	let app: any;
	let server: any;
	let baseURL: string;
	let testUsername: string;

	beforeAll(async () => {
		// Delete test database file
		const fs = await import("fs");
		try {
			fs.unlinkSync("./test.db");
		} catch {
			// Ignore if file doesn't exist
		}

		// Check if running in Docker with external app
		const testBaseUrl = process.env.TEST_BASE_URL;
		if (testBaseUrl) {
			// Use external app for Docker testing
			baseURL = testBaseUrl;
			testUsername = `e2euser_${Date.now()}`;
			console.log(
				`🧪 Running E2E tests against external app: ${baseURL}`
			);
			console.log(`🧪 Using test username: ${testUsername}`);
			// Wait for external app
			await waitForAppReady(baseURL);
			return;
		}

		// Local testing with in-memory database
		// process.env.NODE_ENV = 'test';
		// process.env.JWT_SECRET = 'test-jwt-secret-for-e2e-testing';
		// process.env.DATABASE_URL = 'sqlite::memory:';
		// process.env.USE_REDIS = 'false';

		// Load env
		const dotenv = await import("dotenv");
		dotenv.config();

		// Initialize database
		await DatabaseTestHelper.setup();

		// Clear database module cache to reload with new config
		delete require.cache[require.resolve("../src/db/database")];

		// Sync database schema
		const { AppDataSource } = require("../src/db/database");
		await AppDataSource.synchronize(true);

		// Create test app
		app = createTestApp();

		// Start server on random port
		server = app.listen(0);
		const port = server.address().port;
		baseURL = `http://localhost:${port}`;

		// Generate unique username for this test run
		testUsername = `e2euser_${Date.now()}`;

		console.log(`🧪 Running E2E tests against: ${baseURL}`);
		console.log(`🧪 Using test username: ${testUsername}`);
	}, 60000);

	afterAll(async () => {
		// Close server
		if (server) {
			server.close();
		}
		// Close database (skip in Docker mode)
		if (!process.env.TEST_BASE_URL) {
			await DatabaseTestHelper.teardown();
		}
	});

	describe("Complete User Journey", () => {
		let userToken: string;
		let itemId: number;

		beforeAll(async () => {
			// Clear database once for the suite (skip in Docker mode)
			if (!process.env.TEST_BASE_URL) {
				await DatabaseTestHelper.clear();
			}
		});

		test("User Registration", async () => {
			const response = await request(baseURL)
				.post("/api/v1/auth/register")
				.send({
					username: testUsername,
					password: "securepassword123",
				});

			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty("token");
			expect(response.body).toHaveProperty("user");
			expect(response.body.user.username).toBe(testUsername);

			userToken = response.body.token;
		});

		test("User Login", async () => {
			const response = await request(baseURL)
				.post("/api/v1/auth/login")
				.send({
					username: testUsername,
					password: "securepassword123",
				});

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("token");
			expect(response.body).toHaveProperty("user");

			// Update token if different
			userToken = response.body.token;
		});

		test("Create Item", async () => {
			const response = await request(baseURL)
				.post("/api/v1/items")
				.set("Authorization", `Bearer ${userToken}`)
				.send({
					name: "E2E Test Item",
					description: "Created during end-to-end testing",
				});

			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty("id");
			expect(response.body.name).toBe("E2E Test Item");
			expect(response.body.description).toBe(
				"Created during end-to-end testing"
			);

			itemId = response.body.id;
		});

		test("List Items", async () => {
			const response = await request(baseURL)
				.get("/api/v1/items")
				.set("Authorization", `Bearer ${userToken}`);

			expect(response.status).toBe(200);
			expect(Array.isArray(response.body)).toBe(true);
			expect(response.body.length).toBeGreaterThan(0);

			// Verify our item is in the list
			const ourItem = response.body.find(
				(item: Item) => item.id === itemId
			);
			expect(ourItem).toBeDefined();
			expect(ourItem.name).toBe("E2E Test Item");
		});

		test("Get Specific Item", async () => {
			const response = await request(baseURL)
				.get(`/api/v1/items/${itemId}`)
				.set("Authorization", `Bearer ${userToken}`);

			expect(response.status).toBe(200);
			expect(response.body.id).toBe(itemId);
			expect(response.body.name).toBe("E2E Test Item");
		});

		test("Update Item", async () => {
			const response = await request(baseURL)
				.put(`/api/v1/items/${itemId}`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({
					name: "Updated E2E Test Item",
					description: "Updated during end-to-end testing",
				});

			expect(response.status).toBe(200);
			expect(response.body.id).toBe(itemId);
			expect(response.body.name).toBe("Updated E2E Test Item");
			expect(response.body.description).toBe(
				"Updated during end-to-end testing"
			);
		});

		test("Delete Item", async () => {
			const response = await request(baseURL)
				.delete(`/api/v1/items/${itemId}`)
				.set("Authorization", `Bearer ${userToken}`);

			expect(response.status).toBe(204);
		});

		test("Verify Item Deletion", async () => {
			const response = await request(baseURL)
				.get(`/api/v1/items/${itemId}`)
				.set("Authorization", `Bearer ${userToken}`);

			expect(response.status).toBe(404);
		});
	});

	describe("Security and Error Handling", () => {
		let testUserToken: string;

		beforeEach(async () => {
			// Clear database for each test (skip in Docker mode)
			if (!process.env.TEST_BASE_URL) {
				await DatabaseTestHelper.clear();
			}
			// Register a test user
			const uniqueUsername = `e2euser_${Date.now()}_${Math.random()
				.toString(36)
				.substr(2, 9)}`;
			const registerResponse = await request(baseURL)
				.post("/api/v1/auth/register")
				.send({
					username: uniqueUsername,
					password: "securepassword123",
				});
			testUserToken = registerResponse.body.token;
		});

		test("Access without authentication should fail", async () => {
			const response = await request(baseURL).get("/api/v1/items");

			expect(response.status).toBe(401);
		});

		test("Invalid credentials should fail", async () => {
			const response = await request(baseURL)
				.post("/api/v1/auth/login")
				.send({
					username: "nonexistent",
					password: "wrongpassword",
				});

			expect(response.status).toBe(401);
		});

		test("Access non-existent item should return 404", async () => {
			const response = await request(baseURL)
				.get("/api/v1/items/99999")
				.set("Authorization", `Bearer ${testUserToken}`);

			expect(response.status).toBe(404);
		});

		test("Create item with invalid data should fail", async () => {
			const response = await request(baseURL)
				.post("/api/v1/items")
				.set("Authorization", `Bearer ${testUserToken}`)
				.send({
					// Missing required 'name' field
					description: "Missing name field",
				});

			expect(response.status).toBe(400);
		});
	});

	describe("Health Check", () => {
		test("Health endpoint should return OK", async () => {
			const response = await request(baseURL).get("/health");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("status");
			expect(response.body.status).toBe("OK");
		});
	});
});
