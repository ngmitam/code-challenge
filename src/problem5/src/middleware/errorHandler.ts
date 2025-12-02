import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import {
	ValidationError,
	NotFoundError,
	UnauthorizedError,
	ForbiddenError,
} from "../utils/result";

export interface ApiError {
	message: string;
	code?: string;
	field?: string;
	details?: Record<string, unknown>;
}

export class ApiResponse {
	static success<T>(
		data: T,
		message?: string
	): { data: T; message?: string } {
		return { data, message };
	}

	static error(
		error: ApiError | string,
		_statusCode: number = 500
	): { error: ApiError } {
		const apiError: ApiError =
			typeof error === "string" ? { message: error } : error;

		return { error: apiError };
	}
}

export const errorHandler = (
	err: Error,
	req: Request,
	res: Response,
	_next: NextFunction
) => {
	logger.error("Unhandled error", {
		error: err.message,
		stack: err.stack,
		url: req.url,
		method: req.method,
		ip: req.ip,
		userId: (req as Request & { user?: { id: string } }).user?.id,
	});

	// Handle known error types
	if (err instanceof ValidationError) {
		return res.status(400).json(
			ApiResponse.error({
				message: err.message,
				field: err.field,
				code: err.code,
			})
		);
	}

	if (err instanceof NotFoundError) {
		return res.status(404).json(
			ApiResponse.error({
				message: err.message,
				code: "NOT_FOUND",
			})
		);
	}

	if (err instanceof UnauthorizedError) {
		return res.status(401).json(
			ApiResponse.error({
				message: err.message,
				code: "UNAUTHORIZED",
			})
		);
	}

	if (err instanceof ForbiddenError) {
		return res.status(403).json(
			ApiResponse.error({
				message: err.message,
				code: "FORBIDDEN",
			})
		);
	}

	// Handle JWT errors
	if (err.name === "JsonWebTokenError") {
		return res.status(401).json(
			ApiResponse.error({
				message: "Invalid token",
				code: "INVALID_TOKEN",
			})
		);
	}

	if (err.name === "TokenExpiredError") {
		return res.status(401).json(
			ApiResponse.error({
				message: "Token expired",
				code: "TOKEN_EXPIRED",
			})
		);
	}

	// Handle database errors
	if (
		err.message?.includes("SQLITE_CONSTRAINT") ||
		err.message?.includes("UNIQUE constraint")
	) {
		return res.status(409).json(
			ApiResponse.error({
				message: "Resource already exists",
				code: "CONFLICT",
			})
		);
	}

	// Default error response
	res.status(500).json(
		ApiResponse.error({
			message: "Internal server error",
			code: "INTERNAL_ERROR",
		})
	);
};

export const asyncHandler = (fn: (...args: unknown[]) => Promise<void>) => {
	return (req: Request, res: Response, next: NextFunction) => {
		Promise.resolve()
			.then(() => fn(req, res, next))
			.catch(next);
	};
};
