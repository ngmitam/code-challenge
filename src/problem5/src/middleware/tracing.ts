import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

// Simple distributed tracing implementation
interface TraceContext {
	traceId: string;
	spanId: string;
	parentSpanId?: string;
	startTime: number;
	tags: Record<string, string>;
}

class Tracer {
	private currentContext: TraceContext | null = null;

	startSpan(name: string, tags: Record<string, string> = {}): TraceContext {
		const spanId = this.generateId();
		const traceId = this.currentContext?.traceId || this.generateId();

		const context: TraceContext = {
			traceId,
			spanId,
			parentSpanId: this.currentContext?.spanId,
			startTime: Date.now(),
			tags: { ...tags, name },
		};

		this.currentContext = context;
		return context;
	}

	endSpan(context: TraceContext): void {
		const duration = Date.now() - context.startTime;
		logger.info("Span completed", {
			traceId: context.traceId,
			spanId: context.spanId,
			parentSpanId: context.parentSpanId,
			duration,
			...context.tags,
		});

		// Restore parent context
		if (context.parentSpanId) {
			// In a real implementation, you'd maintain a stack
			this.currentContext = null;
		}
	}

	getCurrentContext(): TraceContext | null {
		return this.currentContext;
	}

	public generateId(): string {
		return Math.random().toString(36).substring(2, 15);
	}

	// Method for testing - reset tracer state
	public reset(): void {
		this.currentContext = null;
	}
}

export const tracer = new Tracer();

// Express middleware for automatic tracing
export const tracingMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const traceId =
		(req.headers["x-trace-id"] as string) || tracer.generateId();
	const spanId = tracer.generateId();
	const requestId =
		(req.headers["x-request-id"] as string) || tracer.generateId();

	const context = tracer.startSpan("http_request", {
		method: req.method,
		url: req.url,
		userAgent: req.get("User-Agent") || "",
		ip: req.ip || "",
		requestId,
	});

	// Add trace headers to response
	res.setHeader("x-trace-id", traceId);
	res.setHeader("x-span-id", spanId);
	res.setHeader("x-request-id", requestId);

	// Store context in request for use in handlers
	(req as Request & { traceContext: TraceContext }).traceContext = context;

	res.on("finish", () => {
		const context = (req as Request & { traceContext?: TraceContext })
			.traceContext;
		if (context) {
			tracer.endSpan({
				...context,
				tags: {
					...context.tags,
					statusCode: res.statusCode.toString(),
				},
			});
		}
	});

	next();
};

// Helper function to create child spans
export const createChildSpan = (
	name: string,
	tags: Record<string, string> = {}
): TraceContext => {
	return tracer.startSpan(name, tags);
};

export const endSpan = (context: TraceContext): void => {
	tracer.endSpan(context);
};

// Decorator for tracing async functions
export const traced = (spanName: string, tags: Record<string, string> = {}) => {
	return (
		target: unknown,
		propertyKey: string,
		descriptor: PropertyDescriptor
	) => {
		const originalMethod = descriptor.value as (
			...args: unknown[]
		) => Promise<unknown>;

		descriptor.value = async function (...args: unknown[]) {
			const context = tracer.startSpan(spanName, tags);
			try {
				const result = await originalMethod.apply(this, args);
				tracer.endSpan({
					...context,
					tags: { ...context.tags, success: "true" },
				});
				return result;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";
				tracer.endSpan({
					...context,
					tags: {
						...context.tags,
						success: "false",
						error: errorMessage,
					},
				});
				throw error;
			}
		};

		return descriptor;
	};
};
