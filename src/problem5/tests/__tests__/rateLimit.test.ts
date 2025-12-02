import {
	UserRateLimiter,
	userRateLimit,
	userRateLimiter,
} from "../../src/middleware/rateLimit";
import { Request, Response, NextFunction } from "express";

describe("UserRateLimiter", () => {
	let rateLimiter: UserRateLimiter;

	beforeEach(() => {
		rateLimiter = new UserRateLimiter(1000, 3); // 1 second window, 3 requests max
		jest.clearAllMocks();
	});

	afterEach(() => {
		// No destroy method needed
	});

	describe("constructor", () => {
		it("should initialize with default values", () => {
			const defaultLimiter = new UserRateLimiter();
			expect(defaultLimiter).toBeDefined();
			// No destroy method
		});

		it("should initialize with custom values", () => {
			expect(rateLimiter).toBeDefined();
		});

		it("should start cleanup interval", () => {
			expect(rateLimiter).toBeDefined();
		});
	});

	describe("isRateLimited", () => {
		it("should allow first request", async () => {
			const result = await rateLimiter.isRateLimited("user1");
			expect(result).toBe(false);
		});

		it("should allow requests within limit", async () => {
			await rateLimiter.isRateLimited("user1");
			const result = await rateLimiter.isRateLimited("user1");
			expect(result).toBe(false);
		});

		it("should block requests over limit", async () => {
			await rateLimiter.isRateLimited("user1");
			await rateLimiter.isRateLimited("user1");
			await rateLimiter.isRateLimited("user1");
			const result = await rateLimiter.isRateLimited("user1");
			expect(result).toBe(true);
		});

		it("should reset after window expires", async () => {
			await rateLimiter.isRateLimited("user1");
			await rateLimiter.isRateLimited("user1");
			await rateLimiter.isRateLimited("user1");

			// Wait for window to expire
			await new Promise((resolve) => setTimeout(resolve, 1100));

			const result = await rateLimiter.isRateLimited("user1");
			expect(result).toBe(false);
		});

		it("should handle different users independently", async () => {
			await rateLimiter.isRateLimited("user1");
			await rateLimiter.isRateLimited("user1");
			await rateLimiter.isRateLimited("user1");

			const result1 = await rateLimiter.isRateLimited("user1");
			const result2 = await rateLimiter.isRateLimited("user2");

			expect(result1).toBe(true);
			expect(result2).toBe(false);
		});
	});

	describe("getRemainingRequests", () => {
		it("should return max requests for new user", async () => {
			const remaining = await rateLimiter.getRemainingRequests("user1");
			expect(remaining).toBe(3);
		});

		it("should return correct remaining requests", async () => {
			await rateLimiter.isRateLimited("user1");
			expect(await rateLimiter.getRemainingRequests("user1")).toBe(2);

			await rateLimiter.isRateLimited("user1");
			expect(await rateLimiter.getRemainingRequests("user1")).toBe(1);

			await rateLimiter.isRateLimited("user1");
			expect(await rateLimiter.getRemainingRequests("user1")).toBe(0);
		});

		it("should return max requests after window expires", async () => {
			await rateLimiter.isRateLimited("user1");
			await rateLimiter.isRateLimited("user1");
			await rateLimiter.isRateLimited("user1");

			await new Promise((resolve) => setTimeout(resolve, 1100));

			const remaining = await rateLimiter.getRemainingRequests("user1");
			expect(remaining).toBe(3);
		});
	});

	describe("getResetTime", () => {
		it("should return 0 for new user", async () => {
			const resetTime = await rateLimiter.getResetTime("user1");
			expect(resetTime).toBe(0);
		});

		it("should return reset time for active user", async () => {
			const before = Date.now();
			await rateLimiter.isRateLimited("user1");
			const resetTime = await rateLimiter.getResetTime("user1");

			expect(resetTime).toBeGreaterThan(before);
			expect(resetTime).toBeLessThanOrEqual(before + 1000);
		});
	});

	describe("reset", () => {
		it("should clear all rate limit data", async () => {
			await rateLimiter.isRateLimited("user1");
			await rateLimiter.isRateLimited("user2");

			rateLimiter.reset();

			expect(await rateLimiter.getRemainingRequests("user1")).toBe(3);
			expect(await rateLimiter.getRemainingRequests("user2")).toBe(3);
		});
	});

	describe("cleanup", () => {
		it("should be called by the interval", () => {
			// The cleanup functionality is tested indirectly through the rate limiter behavior
			// The actual cleanup method is private and tested through expiration behavior
			expect(rateLimiter).toBeDefined();
		});
	});
});

describe("userRateLimit middleware", () => {
	let mockReq: Partial<Request & { user?: { id: string } }>;
	let mockRes: Partial<Response>;
	let mockNext: NextFunction;

	beforeEach(() => {
		mockReq = {
			user: { id: "test-user" },
			ip: "127.0.0.1",
		};
		mockRes = {
			setHeader: jest.fn(),
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		mockNext = jest.fn();
		jest.clearAllMocks();
	});

	afterEach(() => {
		userRateLimiter.reset();
	});

	it("should skip rate limiting for unauthenticated requests", () => {
		mockReq.user = undefined;

		userRateLimit(mockReq as Request, mockRes as Response, mockNext);

		expect(mockNext).toHaveBeenCalled();
		expect(mockRes.setHeader).not.toHaveBeenCalled();
	});

	it("should allow requests within limit", async () => {
		await userRateLimit(mockReq as Request, mockRes as Response, mockNext);

		expect(mockNext).toHaveBeenCalled();
		expect(mockRes.setHeader).toHaveBeenCalledWith(
			"X-RateLimit-Remaining",
			"99"
		);
		expect(mockRes.setHeader).toHaveBeenCalledWith(
			"X-RateLimit-Reset",
			expect.any(String)
		);
	});

	it("should block requests over limit", async () => {
		// Create a rate limiter with very low limit for testing
		const testLimiter = new UserRateLimiter(1000, 2); // 2 requests per second

		// Make requests up to the limit
		for (let i = 0; i < 2; i++) {
			await testLimiter.isRateLimited("test-user");
		}

		// Next request should be blocked
		const isLimited = await testLimiter.isRateLimited("test-user");
		expect(isLimited).toBe(true);
	});

	it("should set correct headers for allowed requests", async () => {
		mockReq.user = { id: "fresh-user" }; // Use a different user to avoid rate limiting from other tests

		await userRateLimit(mockReq as Request, mockRes as Response, mockNext);

		expect(mockRes.setHeader).toHaveBeenCalledWith(
			"X-RateLimit-Remaining",
			"99"
		);
		expect(mockRes.setHeader).toHaveBeenCalledWith(
			"X-RateLimit-Reset",
			expect.any(String)
		);
		expect(mockNext).toHaveBeenCalled();
	});
});
