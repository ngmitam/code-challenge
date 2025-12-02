// Simplified Result pattern for better error handling
export class Result<T> {
	private constructor(
		private readonly _success: boolean,
		private readonly _value?: T,
		private readonly _error?: string
	) {}

	static success<T>(value: T): Result<T> {
		return new Result(true, value, undefined);
	}

	static failure<T>(error: string): Result<T> {
		return new Result(false, undefined, error) as Result<T>;
	}

	isSuccess(): boolean {
		return this._success;
	}

	isFailure(): boolean {
		return !this._success;
	}

	getValue(): T {
		if (!this._success) {
			throw new Error("Cannot get value from failure result");
		}
		return this._value!;
	}

	getError(): string {
		if (this._success) {
			throw new Error("Cannot get error from success result");
		}
		return this._error!;
	}

	// Map over success value
	map<U>(fn: (value: T) => U): Result<U> {
		return this._success
			? Result.success(fn(this._value!))
			: Result.failure(this._error!);
	}

	// Provide default value for failure
	getOrElse(defaultValue: T): T {
		return this._success ? this._value! : defaultValue;
	}

	// Execute side effects based on result
	fold<R>(onSuccess: (value: T) => R, onFailure: (error: string) => R): R {
		return this._success
			? onSuccess(this._value!)
			: onFailure(this._error!);
	}
}

// Common error types
export class ValidationError extends Error {
	constructor(
		message: string,
		public readonly field?: string,
		public readonly code?: string
	) {
		super(message);
		this.name = "ValidationError";
	}
}

export class NotFoundError extends Error {
	constructor(resource: string, identifier?: string) {
		super(`${resource} not found${identifier ? `: ${identifier}` : ""}`);
		this.name = "NotFoundError";
	}
}

export class UnauthorizedError extends Error {
	constructor(message: string = "Unauthorized") {
		super(message);
		this.name = "UnauthorizedError";
	}
}

export class ForbiddenError extends Error {
	constructor(message: string = "Forbidden") {
		super(message);
		this.name = "ForbiddenError";
	}
}

// Utility functions for working with Results
export const tryCatch = async <T>(fn: () => Promise<T>): Promise<Result<T>> => {
	try {
		const value = await fn();
		return Result.success(value);
	} catch (error) {
		return Result.failure(
			error instanceof Error ? error.message : "Unknown error"
		);
	}
};

export const fromNullable = <T>(
	value: T | null | undefined,
	error: string
): Result<T> => {
	return value != null ? Result.success(value) : Result.failure(error);
};
