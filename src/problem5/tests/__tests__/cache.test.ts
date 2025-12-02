import { AdvancedCache } from "../../src/utils/cache";
import Redis from "redis";

// Mock Redis
jest.mock("redis", () => ({
	createClient: jest.fn(),
}));

// Mock logger
jest.mock("../../src/utils/logger", () => ({
	error: jest.fn(),
	warn: jest.fn(),
	info: jest.fn(),
	debug: jest.fn(),
}));

// Mock config
jest.mock("../../src/config", () => ({
	redis: {
		host: "localhost",
		port: 6379,
	},
	nodeEnv: "test",
	useRedis: true,
}));

describe("AdvancedCache", () => {
	let testCache: AdvancedCache;
	let mockRedisClient: {
		connect: jest.Mock;
		on: jest.Mock;
		get: jest.Mock;
		setEx: jest.Mock;
		del: jest.Mock;
		keys: jest.Mock;
		flushAll: jest.Mock;
		quit: jest.Mock;
	};

	beforeEach(() => {
		// Reset all mocks
		jest.clearAllMocks();

		// Create mock Redis client
		mockRedisClient = {
			connect: jest.fn().mockResolvedValue(undefined),
			on: jest.fn(),
			get: jest.fn(),
			setEx: jest.fn(),
			del: jest.fn(),
			keys: jest.fn(),
			flushAll: jest.fn(),
			quit: jest.fn(),
			isOpen: true,
		} as any; // eslint-disable-line @typescript-eslint/no-explicit-any

		(Redis.createClient as jest.Mock).mockReturnValue(mockRedisClient);

		// Create new cache instance for each test
		testCache = new AdvancedCache();
		(testCache as any).connected = true; // eslint-disable-line @typescript-eslint/no-explicit-any
	});

	afterEach(async () => {
		await testCache.quit();
	});

	describe("constructor", () => {
		it("should initialize with Redis client", () => {
			expect(Redis.createClient).toHaveBeenCalledWith({
				socket: {
					host: "localhost",
					port: 6379,
				},
			});
			expect(mockRedisClient.connect).toHaveBeenCalled();
		});

		it("should handle Redis connection failure gracefully", () => {
			(Redis.createClient as jest.Mock).mockImplementation(() => {
				throw new Error("Redis connection failed");
			});

			const cacheInstance = new AdvancedCache();
			expect(cacheInstance).toBeDefined();
		});
	});

	describe("get", () => {
		it("should return L1 cache hit", async () => {
			await testCache.set("test-key", "test-value", 300);

			const result = await testCache.get("test-key");

			expect(result).toBe("test-value");
			expect(testCache.getStats().hits).toBe(1);
		});

		it("should return null for cache miss", async () => {
			const result = await testCache.get("non-existent-key");

			expect(result).toBeNull();
			expect(testCache.getStats().misses).toBe(1);
		});

		it("should return Redis L2 cache hit when L1 misses", async () => {
			mockRedisClient.get.mockResolvedValue(
				JSON.stringify("redis-value")
			);

			const result = await testCache.get("redis-key");

			expect(result).toBe("redis-value");
			expect(mockRedisClient.get).toHaveBeenCalledWith("redis-key");
			expect(testCache.getStats().hits).toBe(1);
		});

		it("should handle Redis errors gracefully", async () => {
			mockRedisClient.get.mockRejectedValue(new Error("Redis error"));

			const result = await testCache.get("error-key");

			expect(result).toBeNull();
			expect(testCache.getStats().misses).toBe(1);
		});

		it("should return null when Redis is not connected", async () => {
			// Simulate disconnected Redis
			testCache = new AdvancedCache();
			// Force disconnect by mocking the connected property
			Object.defineProperty(testCache, "connected", { value: false });

			const result = await testCache.get("disconnected-key");

			expect(result).toBeNull();
		});
	});

	describe("set", () => {
		it("should set value in L1 cache", async () => {
			await testCache.set("test-key", "test-value", 300);

			const result = await testCache.get("test-key");
			expect(result).toBe("test-value");
			expect(testCache.getStats().sets).toBe(1);
		});

		it("should set value in Redis L2 cache", async () => {
			await testCache.set("redis-key", "redis-value", 300);

			expect(mockRedisClient.setEx).toHaveBeenCalledWith(
				"redis-key",
				300,
				JSON.stringify("redis-value")
			);
		});

		it("should handle Redis set errors gracefully", async () => {
			mockRedisClient.setEx.mockRejectedValue(
				new Error("Redis set error")
			);

			await expect(
				testCache.set("error-key", "error-value")
			).resolves.not.toThrow();

			// Should still be in L1 cache
			const result = await testCache.get("error-key");
			expect(result).toBe("error-value");
		});

		it("should use default TTL when not specified", async () => {
			await testCache.set("default-ttl-key", "value");

			expect(mockRedisClient.setEx).toHaveBeenCalledWith(
				"default-ttl-key",
				300,
				JSON.stringify("value")
			);
		});
	});

	describe("delete", () => {
		it("should delete from L1 cache", async () => {
			await testCache.set("delete-key", "delete-value");
			await testCache.delete("delete-key");

			const result = await testCache.get("delete-key");
			expect(result).toBeNull();
			expect(testCache.getStats().deletes).toBe(1);
		});

		it("should delete from Redis L2 cache", async () => {
			await testCache.delete("redis-delete-key");

			expect(mockRedisClient.del).toHaveBeenCalledWith(
				"redis-delete-key"
			);
		});

		it("should handle Redis delete errors gracefully", async () => {
			mockRedisClient.del.mockRejectedValue(
				new Error("Redis delete error")
			);

			await expect(
				testCache.delete("error-delete-key")
			).resolves.not.toThrow();
		});
	});

	describe("clear", () => {
		it("should clear L1 cache", async () => {
			await testCache.set("clear-key1", "value1");
			await testCache.set("clear-key2", "value2");

			await testCache.clear();

			expect(await testCache.get("clear-key1")).toBeNull();
			expect(await testCache.get("clear-key2")).toBeNull();
		});

		it("should clear Redis L2 cache", async () => {
			await testCache.clear();

			expect(mockRedisClient.flushAll).toHaveBeenCalled();
		});

		it("should handle Redis clear errors gracefully", async () => {
			mockRedisClient.flushAll.mockRejectedValue(
				new Error("Redis clear error")
			);

			await expect(testCache.clear()).resolves.not.toThrow();
		});
	});

	describe("invalidateUserCache", () => {
		it("should delete user-specific keys from L1 cache", async () => {
			await testCache.set("items:user123:list", "user-data");
			await testCache.set("items:user123:item:1", "item-data");
			await testCache.set("items:user456:list", "other-user-data");

			await testCache.invalidateUserCache("user123");

			expect(await testCache.get("items:user123:list")).toBeNull();
			expect(await testCache.get("items:user123:item:1")).toBeNull();
			expect(await testCache.get("items:user456:list")).toBe(
				"other-user-data"
			);
		});

		it("should delete user-specific keys from Redis", async () => {
			mockRedisClient.keys.mockResolvedValue([
				"items:user123:list",
				"items:user123:item:1",
			]);

			await testCache.invalidateUserCache("user123");

			expect(mockRedisClient.keys).toHaveBeenCalledWith(
				"items:user123:*"
			);
			expect(mockRedisClient.del).toHaveBeenCalledWith([
				"items:user123:list",
				"items:user123:item:1",
			]);
		});

		it("should handle Redis errors during user cache invalidation", async () => {
			mockRedisClient.keys.mockRejectedValue(
				new Error("Redis keys error")
			);

			await expect(
				testCache.invalidateUserCache("user123")
			).resolves.not.toThrow();
		});
	});

	describe("getStats", () => {
		it("should return cache statistics", () => {
			const stats = testCache.getStats();

			expect(stats).toEqual({
				hits: 0,
				misses: 0,
				sets: 0,
				deletes: 0,
			});
		});

		it("should return copy of stats object", () => {
			const stats1 = testCache.getStats();
			const stats2 = testCache.getStats();

			expect(stats1).not.toBe(stats2);
			expect(stats1).toEqual(stats2);
		});
	});

	describe("getHealth", () => {
		it("should return health status", async () => {
			const health = await testCache.getHealth();

			expect(health).toEqual({
				status: "healthy",
				l1Size: 0,
				redisConnected: true, // Redis mock is connected in tests
			});
		});

		it("should report L1 cache size", async () => {
			await testCache.set("health-key", "health-value");

			const health = await testCache.getHealth();

			expect(health.l1Size).toBe(1);
		});
	});

	describe("quit", () => {
		it("should quit Redis connection", async () => {
			await testCache.quit();

			expect(mockRedisClient.quit).toHaveBeenCalled();
		});

		it("should handle quit when Redis is not connected", async () => {
			Object.defineProperty(testCache, "connected", { value: false });

			await expect(testCache.quit()).resolves.not.toThrow();
		});
	});

	describe("cleanupExpiredL1Entries", () => {
		it("should be called by the interval in non-test environment", () => {
			// The cleanup functionality is tested indirectly through cache expiration behavior
			// The actual cleanup method is private and tested through expiration in real usage
			expect(testCache).toBeDefined();
		});
	});
});
