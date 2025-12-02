import request from "supertest";
import {
	createTestApp,
	DatabaseTestHelper,
	AuthTestHelper,
} from "../../utils/test-helpers";

const app = createTestApp();
const authHelper = new AuthTestHelper(app);

describe("Authentication API", () => {
	beforeAll(async () => {
		await DatabaseTestHelper.setup();
	});

	beforeEach(async () => {
		await DatabaseTestHelper.clear();
	});

	afterAll(async () => {
		await DatabaseTestHelper.teardown();
	});

	describe("POST /api/v1/auth/register", () => {
		it("should register a new user successfully", async () => {
			const response = await authHelper.register(
				"newuser",
				"validpassword123"
			);

			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty("token");
			expect(response.body).toHaveProperty("user");
			expect(response.body.user.username).toBe("newuser");
		});

		it("should reject registration with existing username", async () => {
			// Register first user
			await authHelper.register("existinguser", "password123");

			// Try to register again with same username
			const response = await authHelper.register(
				"existinguser",
				"differentpassword"
			);

			expect(response.status).toBe(409);
		});

		it("should reject registration with short password", async () => {
			const response = await authHelper.register("user", "12345"); // Too short

			expect(response.status).toBe(400);
		});

		it("should reject registration with missing fields", async () => {
			const response1 = await request(app)
				.post("/api/v1/auth/register")
				.send({ username: "user" }); // Missing password

			expect(response1.status).toBe(400);

			const response2 = await request(app)
				.post("/api/v1/auth/register")
				.send({ password: "password123" }); // Missing username

			expect(response2.status).toBe(400);
		});

		it("should handle special characters in username", async () => {
			const response = await authHelper.register(
				"user_with_underscores",
				"password123"
			);

			expect(response.status).toBe(201);
			expect(response.body.user.username).toBe("user_with_underscores");
		});

		it("should reject registration with invalid username format", async () => {
			const response = await authHelper.register("", "password123"); // Empty username

			expect(response.status).toBe(400);
		});

		it("should reject registration with username too long", async () => {
			const longUsername = "a".repeat(51); // 51 characters
			const response = await authHelper.register(
				longUsername,
				"password123"
			);

			expect(response.status).toBe(400);
		});
	});

	describe("POST /api/v1/auth/login", () => {
		beforeEach(async () => {
			// Create a test user for login tests
			await authHelper.register("testuser", "testpass123");
		});

		it("should login successfully with correct credentials", async () => {
			const response = await authHelper.login("testuser", "testpass123");

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("token");
			expect(response.body).toHaveProperty("user");
			expect(response.body.user.username).toBe("testuser");
		});

		it("should reject login with wrong password", async () => {
			const response = await authHelper.login(
				"testuser",
				"wrongpassword"
			);

			expect(response.status).toBe(401);
		});

		it("should reject login with non-existent username", async () => {
			const response = await authHelper.login(
				"nonexistent",
				"password123"
			);

			expect(response.status).toBe(401);
		});

		it("should reject login with missing fields", async () => {
			const response1 = await request(app)
				.post("/api/v1/auth/login")
				.send({ username: "testuser" }); // Missing password

			expect(response1.status).toBe(400);

			const response2 = await request(app)
				.post("/api/v1/auth/login")
				.send({ password: "testpass123" }); // Missing username

			expect(response2.status).toBe(400);
		});

		it("should return valid JWT token on successful login", async () => {
			const response = await authHelper.login("testuser", "testpass123");

			expect(response.status).toBe(200);
			expect(response.body.token).toMatch(
				/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/
			); // JWT format
		});
	});
});
