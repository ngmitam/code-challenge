import request from "supertest";
import {
	createTestApp,
	DatabaseTestHelper,
	ItemsTestHelper,
} from "../../utils/test-helpers";

const app = createTestApp();
const itemsHelper = new ItemsTestHelper(app);

describe("Items API", () => {
	let token: string;

	beforeAll(async () => {
		await DatabaseTestHelper.setup();
	});

	beforeEach(async () => {
		await DatabaseTestHelper.clear();
		// Get authentication token for tests
		const { token: authToken } = await itemsHelper.getAuthenticatedUser();
		token = authToken;
	});

	afterAll(async () => {
		await DatabaseTestHelper.teardown();
	});

	describe("POST /api/v1/items", () => {
		it("should create a new item successfully", async () => {
			const response = await itemsHelper.createItem(
				token,
				"Test Item",
				"Test Description"
			);

			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty("id");
			expect(response.body.name).toBe("Test Item");
			expect(response.body.description).toBe("Test Description");
			expect(response.body).toHaveProperty("userId");
			expect(response.body).toHaveProperty("createdAt");
			expect(response.body).toHaveProperty("updatedAt");
		});

		it("should reject creation without authentication", async () => {
			const response = await request(app)
				.post("/api/v1/items")
				.send({ name: "Test Item", description: "Test Description" });

			expect(response.status).toBe(401);
		});

		it("should reject creation with missing name", async () => {
			const response = await request(app)
				.post("/api/v1/items")
				.set("Authorization", `Bearer ${token}`)
				.send({ description: "Test Description" });

			expect(response.status).toBe(400);
		});

		it("should reject creation with empty name", async () => {
			const response = await request(app)
				.post("/api/v1/items")
				.set("Authorization", `Bearer ${token}`)
				.send({ name: "", description: "Test Description" });

			expect(response.status).toBe(400);
		});

		it("should reject creation with name too long", async () => {
			const longName = "a".repeat(101); // 101 characters
			const response = await request(app)
				.post("/api/v1/items")
				.set("Authorization", `Bearer ${token}`)
				.send({ name: longName, description: "Test Description" });

			expect(response.status).toBe(400);
		});

		it("should handle creation with missing description", async () => {
			const response = await request(app)
				.post("/api/v1/items")
				.set("Authorization", `Bearer ${token}`)
				.send({ name: "Test Item" });

			expect(response.status).toBe(201);
			expect(response.body.name).toBe("Test Item");
			expect(response.body.description).toBe("");
		});
	});

	describe("GET /api/v1/items", () => {
		beforeEach(async () => {
			// Create test items
			await itemsHelper.createItem(token, "Item 1", "Description 1");
			await itemsHelper.createItem(token, "Item 2", "Description 2");
		});

		it("should retrieve all items for authenticated user", async () => {
			const response = await itemsHelper.getItems(token);

			expect(response.status).toBe(200);
			expect(Array.isArray(response.body)).toBe(true);
			expect(response.body.length).toBe(2);

			// Check item structure
			const item = response.body[0];
			expect(item).toHaveProperty("id");
			expect(item).toHaveProperty("name");
			expect(item).toHaveProperty("description");
			expect(item).toHaveProperty("userId");
			expect(item).toHaveProperty("createdAt");
			expect(item).toHaveProperty("updatedAt");
		});

		it("should reject retrieval without authentication", async () => {
			const response = await request(app).get("/api/v1/items");

			expect(response.status).toBe(401);
		});

		it("should return empty array when user has no items", async () => {
			// Clear items and test
			await DatabaseTestHelper.clear();
			const response = await itemsHelper.getItems(token);

			expect(response.status).toBe(200);
			expect(Array.isArray(response.body)).toBe(true);
			expect(response.body.length).toBe(0);
		});
	});

	describe("GET /api/v1/items/:id", () => {
		let itemId: number;

		beforeEach(async () => {
			const createResponse = await itemsHelper.createItem(
				token,
				"Test Item",
				"Test Description"
			);
			itemId = createResponse.body.id;
		});

		it("should retrieve specific item by id", async () => {
			const response = await itemsHelper.getItem(token, itemId);

			expect(response.status).toBe(200);
			expect(response.body.id).toBe(itemId);
			expect(response.body.name).toBe("Test Item");
			expect(response.body.description).toBe("Test Description");
		});

		it("should reject retrieval without authentication", async () => {
			const response = await request(app).get(`/api/v1/items/${itemId}`);

			expect(response.status).toBe(401);
		});

		it("should return 404 for non-existent item", async () => {
			const response = await itemsHelper.getItem(token, 99999);

			expect(response.status).toBe(404);
		});

		it("should return 400 for invalid id format", async () => {
			const response = await request(app)
				.get("/api/v1/items/invalid")
				.set("Authorization", `Bearer ${token}`);

			expect(response.status).toBe(400);
		});
	});

	describe("PUT /api/v1/items/:id", () => {
		let itemId: number;

		beforeEach(async () => {
			const createResponse = await itemsHelper.createItem(
				token,
				"Original Item",
				"Original Description"
			);
			itemId = createResponse.body.id;
		});

		it("should update item successfully", async () => {
			const response = await itemsHelper.updateItem(
				token,
				itemId,
				"Updated Item",
				"Updated Description"
			);

			expect(response.status).toBe(200);
			expect(response.body.id).toBe(itemId);
			expect(response.body.name).toBe("Updated Item");
			expect(response.body.description).toBe("Updated Description");
			expect(
				new Date(response.body.updatedAt).getTime()
			).toBeGreaterThanOrEqual(
				new Date(response.body.createdAt).getTime()
			);
		});

		it("should reject update without authentication", async () => {
			const response = await request(app)
				.put(`/api/v1/items/${itemId}`)
				.send({
					name: "Updated Item",
					description: "Updated Description",
				});

			expect(response.status).toBe(401);
		});

		it("should reject update of non-existent item", async () => {
			const response = await itemsHelper.updateItem(
				token,
				99999,
				"Updated Item",
				"Updated Description"
			);

			expect(response.status).toBe(404);
		});

		it("should reject update with invalid data", async () => {
			const response = await request(app)
				.put(`/api/v1/items/${itemId}`)
				.set("Authorization", `Bearer ${token}`)
				.send({ name: "", description: "Updated Description" });

			expect(response.status).toBe(400);
		});

		it("should handle partial updates", async () => {
			const response = await request(app)
				.put(`/api/v1/items/${itemId}`)
				.set("Authorization", `Bearer ${token}`)
				.send({ name: "Updated Name Only" });

			expect(response.status).toBe(200);
			expect(response.body.name).toBe("Updated Name Only");
			expect(response.body.description).toBe("Original Description");
		});
	});

	describe("DELETE /api/v1/items/:id", () => {
		let itemId: number;

		beforeEach(async () => {
			const createResponse = await itemsHelper.createItem(
				token,
				"Test Item",
				"Test Description"
			);
			itemId = createResponse.body.id;
		});

		it("should delete item successfully", async () => {
			const response = await itemsHelper.deleteItem(token, itemId);

			expect(response.status).toBe(204);

			// Verify item is deleted
			const getResponse = await itemsHelper.getItem(token, itemId);
			expect(getResponse.status).toBe(404);
		});

		it("should reject deletion without authentication", async () => {
			const response = await request(app).delete(
				`/api/v1/items/${itemId}`
			);

			expect(response.status).toBe(401);
		});

		it("should return 404 when deleting non-existent item", async () => {
			const response = await itemsHelper.deleteItem(token, 99999);

			expect(response.status).toBe(404);
		});

		it("should handle deletion of already deleted item", async () => {
			// Delete item first
			await itemsHelper.deleteItem(token, itemId);

			// Try to delete again
			const response = await itemsHelper.deleteItem(token, itemId);

			expect(response.status).toBe(404);
		});
	});
});
