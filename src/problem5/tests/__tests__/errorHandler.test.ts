import {
	errorHandler,
	asyncHandler,
	ApiResponse,
	ApiError,
} from "../../src/middleware/errorHandler";
import {
	ValidationError,
	NotFoundError,
	UnauthorizedError,
	ForbiddenError,
} from "../../src/utils/result";
import { Request, Response, NextFunction } from "express";

// Mock logger
jest.mock("../../src/utils/logger", () => ({
	error: jest.fn(),
}));
import logger from "../../src/utils/logger";

describe("ApiResponse", () => {
	describe("success", () => {
		it("should return success response with data", () => {
			const result = ApiResponse.success({ id: 1, name: "test" });
			expect(result).toEqual({
				data: { id: 1, name: "test" },
			});
		});

		it("should return success response with data and message", () => {
			const result = ApiResponse.success({ id: 1 }, "Item created");
			expect(result).toEqual({
				data: { id: 1 },
				message: "Item created",
			});
		});
	});

	describe("error", () => {
		it("should return error response from string", () => {
			const result = ApiResponse.error("Something went wrong");
			expect(result).toEqual({
				error: { message: "Something went wrong" },
			});
		});

		it("should return error response from ApiError object", () => {
			const apiError: ApiError = {
				message: "Validation failed",
				code: "VALIDATION_ERROR",
				field: "name",
				details: { minLength: 3 },
			};
			const result = ApiResponse.error(apiError);
			expect(result).toEqual({ error: apiError });
		});
	});
});

describe("errorHandler", () => {
	let mockReq: Partial<Request & { user?: { id: string } }>;
	let mockRes: Partial<Response>;
	let mockNext: NextFunction;

	beforeEach(() => {
		mockReq = {
			url: "/api/test",
			method: "GET",
			ip: "127.0.0.1",
			user: { id: "user123" },
		};
		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		mockNext = jest.fn();
		jest.clearAllMocks();
	});

	it("should handle ValidationError", () => {
		const error = new ValidationError(
			"Name is required",
			"name",
			"REQUIRED"
		);

		errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

		expect(mockRes.status).toHaveBeenCalledWith(400);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: {
				message: "Name is required",
				field: "name",
				code: "REQUIRED",
			},
		});
	});

	it("should handle NotFoundError", () => {
		const error = new NotFoundError("Item");

		errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

		expect(mockRes.status).toHaveBeenCalledWith(404);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: {
				message: "Item not found",
				code: "NOT_FOUND",
			},
		});
	});

	it("should handle UnauthorizedError", () => {
		const error = new UnauthorizedError("Invalid credentials");

		errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: {
				message: "Invalid credentials",
				code: "UNAUTHORIZED",
			},
		});
	});

	it("should handle ForbiddenError", () => {
		const error = new ForbiddenError("Access denied");

		errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

		expect(mockRes.status).toHaveBeenCalledWith(403);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: {
				message: "Access denied",
				code: "FORBIDDEN",
			},
		});
	});

	it("should handle JsonWebTokenError", () => {
		const error = new Error("Invalid token");
		error.name = "JsonWebTokenError";

		errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: {
				message: "Invalid token",
				code: "INVALID_TOKEN",
			},
		});
	});

	it("should handle TokenExpiredError", () => {
		const error = new Error("Token expired");
		error.name = "TokenExpiredError";

		errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

		expect(mockRes.status).toHaveBeenCalledWith(401);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: {
				message: "Token expired",
				code: "TOKEN_EXPIRED",
			},
		});
	});

	it("should handle database constraint errors", () => {
		const error = new Error("SQLITE_CONSTRAINT: UNIQUE constraint failed");

		errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

		expect(mockRes.status).toHaveBeenCalledWith(409);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: {
				message: "Resource already exists",
				code: "CONFLICT",
			},
		});
	});

	it("should handle generic errors with 500 status", () => {
		const error = new Error("Something went wrong");

		errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

		expect(mockRes.status).toHaveBeenCalledWith(500);
		expect(mockRes.json).toHaveBeenCalledWith({
			error: {
				message: "Internal server error",
				code: "INTERNAL_ERROR",
			},
		});
	});

	it("should log error details", () => {
		const error = new Error("Test error");
		error.stack = "Error stack trace";

		errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

		expect(logger.error).toHaveBeenCalledWith("Unhandled error", {
			error: "Test error",
			stack: "Error stack trace",
			url: "/api/test",
			method: "GET",
			ip: "127.0.0.1",
			userId: "user123",
		});
	});

	it("should handle requests without user", () => {
		mockReq.user = undefined;
		const error = new Error("Test error");

		errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

		expect(logger.error).toHaveBeenCalledWith("Unhandled error", {
			error: "Test error",
			stack: error.stack,
			url: "/api/test",
			method: "GET",
			ip: "127.0.0.1",
			userId: undefined,
		});
	});
});

describe("asyncHandler", () => {
	let mockReq: Partial<Request>;
	let mockRes: Partial<Response>;
	let mockNext: NextFunction;

	beforeEach(() => {
		mockReq = {};
		mockRes = {};
		mockNext = jest.fn();
	});

	it("should call the function and pass through successful results", async () => {
		const mockFn = jest.fn().mockResolvedValue(undefined);
		const handler = asyncHandler(mockFn);

		await handler(mockReq as Request, mockRes as Response, mockNext);

		expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
		expect(mockNext).not.toHaveBeenCalled();
	});

	it("should catch and pass errors to next middleware", async () => {
		const error = new Error("Async error");
		const mockFn = jest.fn().mockRejectedValue(error);
		const handler = asyncHandler(mockFn);

		handler(mockReq as Request, mockRes as Response, mockNext);

		await new Promise(setImmediate);

		expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
		expect(mockNext).toHaveBeenCalledWith(error);
	});

	it("should handle synchronous errors", async () => {
		const error = new Error("Sync error");
		const mockFn = jest.fn(() => {
			throw error;
		});
		const handler = asyncHandler(mockFn);

		handler(mockReq as Request, mockRes as Response, mockNext);

		await new Promise(setImmediate);

		expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
		expect(mockNext).toHaveBeenCalledWith(error);
	});
});
