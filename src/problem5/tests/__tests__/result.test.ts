import {
	Result,
	ValidationError,
	NotFoundError,
	UnauthorizedError,
	ForbiddenError,
	tryCatch,
	fromNullable,
} from "../../src/utils/result";

describe("Result", () => {
	describe("success", () => {
		it("should create a success result", () => {
			const result = Result.success("test value");

			expect(result.isSuccess()).toBe(true);
			expect(result.isFailure()).toBe(false);
			expect(result.getValue()).toBe("test value");
		});

		it("should throw error when getting error from success", () => {
			const result = Result.success("test");

			expect(() => result.getError()).toThrow(
				"Cannot get error from success result"
			);
		});
	});

	describe("failure", () => {
		it("should create a failure result", () => {
			const result = Result.failure<string>("error message");

			expect(result.isSuccess()).toBe(false);
			expect(result.isFailure()).toBe(true);
			expect(result.getError()).toBe("error message");
		});

		it("should throw error when getting value from failure", () => {
			const result = Result.failure<string>("error");

			expect(() => result.getValue()).toThrow(
				"Cannot get value from failure result"
			);
		});
	});

	describe("map", () => {
		it("should map success value", () => {
			const result = Result.success(5).map((x) => x * 2);

			expect(result.getValue()).toBe(10);
		});

		it("should not map failure", () => {
			const result = Result.failure<number>("error").map((x) => x * 2);

			expect(result.isFailure()).toBe(true);
			expect(result.getError()).toBe("error");
		});
	});

	describe("getOrElse", () => {
		it("should return value for success", () => {
			const result = Result.success("value");

			expect(result.getOrElse("default")).toBe("value");
		});

		it("should return default for failure", () => {
			const result = Result.failure<string>("error");

			expect(result.getOrElse("default")).toBe("default");
		});
	});

	describe("fold", () => {
		it("should execute onSuccess for success result", () => {
			const result = Result.success(42);
			const folded = result.fold(
				(value) => `Success: ${value}`,
				(error) => `Error: ${error}`
			);

			expect(folded).toBe("Success: 42");
		});

		it("should execute onFailure for failure result", () => {
			const result = Result.failure("something went wrong");
			const folded = result.fold(
				(value) => `Success: ${value}`,
				(error) => `Error: ${error}`
			);

			expect(folded).toBe("Error: something went wrong");
		});
	});
});

describe("Error Classes", () => {
	describe("ValidationError", () => {
		it("should create validation error with message", () => {
			const error = new ValidationError("Invalid input");

			expect(error.message).toBe("Invalid input");
			expect(error.name).toBe("ValidationError");
			expect(error.field).toBeUndefined();
			expect(error.code).toBeUndefined();
		});

		it("should create validation error with field and code", () => {
			const error = new ValidationError(
				"Required field",
				"username",
				"REQUIRED"
			);

			expect(error.message).toBe("Required field");
			expect(error.field).toBe("username");
			expect(error.code).toBe("REQUIRED");
		});
	});

	describe("NotFoundError", () => {
		it("should create not found error with resource", () => {
			const error = new NotFoundError("User");

			expect(error.message).toBe("User not found");
			expect(error.name).toBe("NotFoundError");
		});

		it("should create not found error with resource and identifier", () => {
			const error = new NotFoundError("User", "123");

			expect(error.message).toBe("User not found: 123");
			expect(error.name).toBe("NotFoundError");
		});
	});

	describe("UnauthorizedError", () => {
		it("should create unauthorized error with default message", () => {
			const error = new UnauthorizedError();

			expect(error.message).toBe("Unauthorized");
			expect(error.name).toBe("UnauthorizedError");
		});

		it("should create unauthorized error with custom message", () => {
			const error = new UnauthorizedError("Custom auth error");

			expect(error.message).toBe("Custom auth error");
			expect(error.name).toBe("UnauthorizedError");
		});
	});

	describe("ForbiddenError", () => {
		it("should create forbidden error with default message", () => {
			const error = new ForbiddenError();

			expect(error.message).toBe("Forbidden");
			expect(error.name).toBe("ForbiddenError");
		});

		it("should create forbidden error with custom message", () => {
			const error = new ForbiddenError("Access denied");

			expect(error.message).toBe("Access denied");
			expect(error.name).toBe("ForbiddenError");
		});
	});
});

describe("Utility Functions", () => {
	describe("tryCatch", () => {
		it("should return success result for successful async function", async () => {
			const result = await tryCatch(async () => "success");

			expect(result.isSuccess()).toBe(true);
			expect(result.getValue()).toBe("success");
		});

		it("should return failure result for async function that throws", async () => {
			const result = await tryCatch(async () => {
				throw new Error("async error");
			});

			expect(result.isFailure()).toBe(true);
			expect(result.getError()).toBe("async error");
		});

		it("should return failure result for non-Error throw", async () => {
			const result = await tryCatch(async () => {
				throw "string error";
			});

			expect(result.isFailure()).toBe(true);
			expect(result.getError()).toBe("Unknown error");
		});
	});

	describe("fromNullable", () => {
		it("should return success for non-null value", () => {
			const result = fromNullable("value", "error");

			expect(result.isSuccess()).toBe(true);
			expect(result.getValue()).toBe("value");
		});

		it("should return failure for null value", () => {
			const result = fromNullable(null, "error message");

			expect(result.isFailure()).toBe(true);
			expect(result.getError()).toBe("error message");
		});

		it("should return failure for undefined value", () => {
			const result = fromNullable(undefined, "error message");

			expect(result.isFailure()).toBe(true);
			expect(result.getError()).toBe("error message");
		});
	});
});
