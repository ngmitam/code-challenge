import {
	tracer,
	tracingMiddleware,
	traced,
	createChildSpan,
	endSpan,
} from "../../src/middleware/tracing";
import { Request, Response } from "express";

// Import TraceContext for typing
interface TraceContext {
	traceId: string;
	spanId: string;
	parentSpanId?: string;
	startTime: number;
	tags: Record<string, string>;
}
jest.mock("../../src/utils/logger", () => ({
	info: jest.fn(),
}));

const mockLogger = require("../../src/utils/logger");

describe("Tracer", () => {
	beforeEach(() => {
		tracer.reset();
		jest.clearAllMocks();
	});

	it("should create a span", () => {
		const context = tracer.startSpan("test");
		expect(context).toHaveProperty("traceId");
		expect(context.tags.name).toBe("test");
	});

	it("should end a span", () => {
		const context = {
			traceId: "test-trace",
			spanId: "test-span",
			startTime: Date.now() - 100,
			tags: { name: "test-span" },
		};

		tracer.endSpan(context);

		expect(mockLogger.info).toHaveBeenCalledWith(
			"Span completed",
			expect.objectContaining({
				traceId: "test-trace",
				spanId: "test-span",
				duration: expect.any(Number),
			})
		);
	});

	it("should return null when no span is active", () => {
		expect(tracer.getCurrentContext()).toBeNull();
	});

	it("should return current span context", () => {
		const context = tracer.startSpan("test-span");
		expect(tracer.getCurrentContext()).toBe(context);
	});
});

describe("Tracing Middleware", () => {
	beforeEach(() => {
		tracer.reset();
		jest.clearAllMocks();
	});

	it("should create trace headers and context", () => {
		const mockReq = {
			method: "GET",
			url: "/test",
			ip: "127.0.0.1",
			get: jest.fn(() => "test-agent"),
			headers: {},
		} as unknown as Request & { traceContext?: TraceContext };
		const mockRes = {
			setHeader: jest.fn(),
			statusCode: 200,
			on: jest.fn(),
		} as unknown as Response;
		const mockNext = jest.fn();

		tracingMiddleware(mockReq, mockRes, mockNext);

		expect(mockRes.setHeader).toHaveBeenCalledWith(
			"x-trace-id",
			expect.any(String)
		);
		expect(mockRes.setHeader).toHaveBeenCalledWith(
			"x-span-id",
			expect.any(String)
		);
		expect(mockReq.traceContext).toBeDefined();
		expect(mockNext).toHaveBeenCalled();
	});

	it("should use existing trace id from headers", () => {
		const mockReq = {
			method: "GET",
			url: "/test",
			ip: "127.0.0.1",
			get: jest.fn(() => "test-agent"),
			headers: { "x-trace-id": "existing-trace" },
		} as unknown as Request;
		const mockRes = {
			setHeader: jest.fn(),
			statusCode: 200,
			on: jest.fn(),
		} as unknown as Response;
		const mockNext = jest.fn();

		tracingMiddleware(mockReq, mockRes, mockNext);

		expect(mockRes.setHeader).toHaveBeenCalledWith(
			"x-trace-id",
			"existing-trace"
		);
	});
});

describe("Traced Decorator", () => {
	beforeEach(() => {
		tracer.reset();
		jest.clearAllMocks();
	});

	it("should trace successful async function", async () => {
		class TestClass {
			@traced("test-method")
			async testMethod() {
				return "success";
			}
		}

		const instance = new TestClass();
		const result = await instance.testMethod();

		expect(result).toBe("success");
		expect(mockLogger.info).toHaveBeenCalledWith(
			"Span completed",
			expect.objectContaining({
				success: "true",
			})
		);
	});

	it("should trace failed async function", async () => {
		class TestClass {
			@traced("test-method")
			async testMethod() {
				throw new Error("test error");
			}
		}

		const instance = new TestClass();

		await expect(instance.testMethod()).rejects.toThrow("test error");
		expect(mockLogger.info).toHaveBeenCalledWith(
			"Span completed",
			expect.objectContaining({
				success: "false",
				error: "test error",
			})
		);
	});
});

describe("Helper Functions", () => {
	beforeEach(() => {
		tracer.reset();
		jest.clearAllMocks();
	});

	it("should create and end child span", () => {
		const context = createChildSpan("child-span", { key: "value" });
		expect(context).toHaveProperty("traceId");
		expect(context.tags.name).toBe("child-span");
		expect(context.tags.key).toBe("value");

		endSpan(context);
		expect(mockLogger.info).toHaveBeenCalledWith(
			"Span completed",
			expect.objectContaining({
				spanId: context.spanId,
			})
		);
	});
});
