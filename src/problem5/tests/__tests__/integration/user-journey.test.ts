import request from "supertest";
import {
	createTestApp,
	DatabaseTestHelper,
	AuthTestHelper,
	ItemsTestHelper,
} from "../../utils/test-helpers";

const app = createTestApp();
const authHelper = new AuthTestHelper(app);
const itemsHelper = new ItemsTestHelper(app);

describe("Integration Tests - Complete User Journey", () => {
	beforeAll(async () => {
		await DatabaseTestHelper.setup();
	});

	beforeEach(async () => {
		await DatabaseTestHelper.clear();
	});

	afterAll(async () => {
		await DatabaseTestHelper.teardown();
	});

	it("should complete full user registration and item management workflow", async () => {
		const testUsername = `integration_user_${Date.now()}`;

		// 1. Register user
		const registerResponse = await authHelper.register(
			testUsername,
			"securepassword123"
		);
		expect(registerResponse.status).toBe(201);
		expect(registerResponse.body).toHaveProperty("token");
		expect(registerResponse.body.user.username).toBe(testUsername);

		const token = registerResponse.body.token;

		// 2. Login user
		const loginResponse = await authHelper.login(
			testUsername,
			"securepassword123"
		);
		expect(loginResponse.status).toBe(200);
		expect(loginResponse.body).toHaveProperty("token");
		expect(loginResponse.body.user.username).toBe(testUsername);

		// 3. Create item
		const createResponse = await itemsHelper.createItem(
			token,
			"Integration Test Item",
			"Created during integration testing"
		);
		expect(createResponse.status).toBe(201);
		expect(createResponse.body).toHaveProperty("id");
		expect(createResponse.body.name).toBe("Integration Test Item");

		const itemId = createResponse.body.id;

		// 4. List items
		const listResponse = await itemsHelper.getItems(token);
		expect(listResponse.status).toBe(200);
		expect(Array.isArray(listResponse.body)).toBe(true);
		expect(listResponse.body.length).toBe(1);
		expect(listResponse.body[0].id).toBe(itemId);

		// 5. Get specific item
		const getResponse = await itemsHelper.getItem(token, itemId);
		expect(getResponse.status).toBe(200);
		expect(getResponse.body.id).toBe(itemId);
		expect(getResponse.body.name).toBe("Integration Test Item");

		// 6. Update item
		const updateResponse = await itemsHelper.updateItem(
			token,
			itemId,
			"Updated Integration Test Item",
			"Updated during integration testing"
		);
		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body.id).toBe(itemId);
		expect(updateResponse.body.name).toBe("Updated Integration Test Item");

		// 7. Delete item
		const deleteResponse = await itemsHelper.deleteItem(token, itemId);
		expect(deleteResponse.status).toBe(204);

		// 8. Verify item deletion
		const verifyDeleteResponse = await itemsHelper.getItem(token, itemId);
		expect(verifyDeleteResponse.status).toBe(404);
	});

	it("should handle security scenarios correctly", async () => {
		const user1 = `security_user1_${Date.now()}`;
		const user2 = `security_user2_${Date.now()}`;

		// Register two users
		const user1Register = await authHelper.register(user1, "password123");
		const user2Register = await authHelper.register(user2, "password123");

		const user1Token = user1Register.body.token;
		const user2Token = user2Register.body.token;

		// User 1 creates an item
		const createResponse = await itemsHelper.createItem(
			user1Token,
			"User1 Item",
			"Belongs to user 1"
		);
		const itemId = createResponse.body.id;

		// User 2 tries to access User 1's item
		const user2GetResponse = await itemsHelper.getItem(user2Token, itemId);
		expect(user2GetResponse.status).toBe(404); // Should not find the item

		// User 2 tries to update User 1's item
		const user2UpdateResponse = await itemsHelper.updateItem(
			user2Token,
			itemId,
			"Hacked Item",
			"This should fail"
		);
		expect(user2UpdateResponse.status).toBe(404);

		// User 2 tries to delete User 1's item
		const user2DeleteResponse = await itemsHelper.deleteItem(
			user2Token,
			itemId
		);
		expect(user2DeleteResponse.status).toBe(404);

		// Verify User 1 can still access their item
		const user1GetResponse = await itemsHelper.getItem(user1Token, itemId);
		expect(user1GetResponse.status).toBe(200);
		expect(user1GetResponse.body.name).toBe("User1 Item");
	});

	it("should handle concurrent operations correctly", async () => {
		const testUsername = `concurrent_user_${Date.now()}`;

		// Register user
		const registerResponse = await authHelper.register(
			testUsername,
			"password123"
		);
		const token = registerResponse.body.token;

		// Create multiple items concurrently
		const createPromises = Array.from({ length: 5 }, (_, i) =>
			itemsHelper.createItem(
				token,
				`Concurrent Item ${i + 1}`,
				`Description ${i + 1}`
			)
		);

		const createResponses = await Promise.all(createPromises);

		// Verify all items were created
		createResponses.forEach(
			(
				response: { status: number; body: { name: string } },
				i: number
			) => {
				expect(response.status).toBe(201);
				expect(response.body.name).toBe(`Concurrent Item ${i + 1}`);
			}
		);

		// List all items
		const listResponse = await itemsHelper.getItems(token);
		expect(listResponse.status).toBe(200);
		expect(listResponse.body.length).toBe(5);

		// Verify all items are present
		const itemNames = listResponse.body
			.map((item: { name: string }) => item.name)
			.sort();
		const expectedNames = Array.from(
			{ length: 5 },
			(_, i) => `Concurrent Item ${i + 1}`
		).sort();
		expect(itemNames).toEqual(expectedNames);
	});

	it("should handle rate limiting correctly", async () => {
		const testUsername = `ratelimit_user_${Date.now()}`;

		// Register user
		const registerResponse = await authHelper.register(
			testUsername,
			"password123"
		);
		const token = registerResponse.body.token;

		// Make a few requests to ensure rate limiting middleware is working
		const responses = [];
		for (let i = 0; i < 3; i++) {
			const response = await request(app)
				.get("/api/v1/items")
				.set("Authorization", `Bearer ${token}`);
			responses.push(response);
		}

		// All requests should succeed (rate limiting should not trigger for such few requests)
		const successResponses = responses.filter((r) => r.status === 200);
		expect(successResponses.length).toBe(3);

		// Check that rate limit headers are present
		const lastResponse = responses[responses.length - 1];
		expect(lastResponse.headers).toHaveProperty("ratelimit-remaining");
		expect(lastResponse.headers).toHaveProperty("ratelimit-reset");
	});
});
