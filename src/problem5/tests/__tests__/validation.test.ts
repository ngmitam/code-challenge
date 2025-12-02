import {
	validate,
	createItemSchema,
	updateItemSchema,
	getItemSchema,
	deleteItemSchema,
	listItemsSchema,
} from "../../src/middleware/validation";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../../src/utils/result";

// Mock config
jest.mock("../../src/config", () => ({
	performance: {
		maxItemsPerPage: 100,
	},
}));

describe("Validation Middleware", () => {
	let mockReq: Partial<Request>;
	let mockRes: Partial<Response>;
	let mockNext: NextFunction;

	beforeEach(() => {
		mockReq = {};
		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		mockNext = jest.fn();
		jest.clearAllMocks();
	});

	describe("createItemSchema", () => {
		const validator = validate(createItemSchema);

		it("should pass validation for valid create item data", () => {
			mockReq = {
				body: {
					name: "Test Item",
					description: "Test description",
				},
			};

			validator(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalled();
		});

		it("should fail validation for missing name", () => {
			mockReq = {
				body: {
					description: "Test description",
				},
			};

			expect(() => {
				validator(mockReq as Request, mockRes as Response, mockNext);
			}).toThrow(ValidationError);
		});

		it("should fail validation for name too long", () => {
			mockReq = {
				body: {
					name: "a".repeat(101), // 101 characters
					description: "Test description",
				},
			};

			expect(() => {
				validator(mockReq as Request, mockRes as Response, mockNext);
			}).toThrow(ValidationError);
		});

		it("should fail validation for description too long", () => {
			mockReq = {
				body: {
					name: "Test Item",
					description: "a".repeat(501), // 501 characters
				},
			};

			expect(() => {
				validator(mockReq as Request, mockRes as Response, mockNext);
			}).toThrow(ValidationError);
		});
	});

	describe("updateItemSchema", () => {
		const validator = validate(updateItemSchema);

		it("should pass validation for valid update item data", () => {
			mockReq = {
				body: {
					name: "Updated Item",
					description: "Updated description",
				},
				params: {
					id: "123",
				},
			};

			validator(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalled();
		});

		it("should fail validation for missing id", () => {
			mockReq = {
				body: {
					name: "Updated Item",
				},
				params: {},
			};

			expect(() => {
				validator(mockReq as Request, mockRes as Response, mockNext);
			}).toThrow(ValidationError);
		});
	});

	describe("getItemSchema", () => {
		const validator = validate(getItemSchema);

		it("should pass validation for valid get item data", () => {
			mockReq = {
				params: {
					id: "123",
				},
			};

			validator(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalled();
		});

		it("should fail validation for missing id", () => {
			mockReq = {
				params: {},
			};

			expect(() => {
				validator(mockReq as Request, mockRes as Response, mockNext);
			}).toThrow(ValidationError);
		});
	});

	describe("deleteItemSchema", () => {
		const validator = validate(deleteItemSchema);

		it("should pass validation for valid delete item data", () => {
			mockReq = {
				params: {
					id: "123",
				},
			};

			validator(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalled();
		});
	});

	describe("listItemsSchema", () => {
		const validator = validate(listItemsSchema);

		it("should pass validation for valid list items data", () => {
			mockReq = {
				query: {
					name: "test",
					limit: "10",
					offset: "0",
				},
			};

			validator(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalled();
		});

		it("should pass validation with optional parameters", () => {
			mockReq = {
				query: {},
			};

			validator(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalled();
		});

		it("should fail validation for invalid limit", () => {
			mockReq = {
				query: {
					limit: "not-a-number",
				},
			};

			expect(() => {
				validator(mockReq as Request, mockRes as Response, mockNext);
			}).toThrow(ValidationError);
		});

		it("should fail validation for negative offset", () => {
			mockReq = {
				query: {
					offset: "-1",
				},
			};

			expect(() => {
				validator(mockReq as Request, mockRes as Response, mockNext);
			}).toThrow(ValidationError);
		});

		it("should fail validation for limit too high", () => {
			// Temporarily mock config with low maxItemsPerPage
			const config = require("../../src/config");
			const originalMaxItems = config.performance.maxItemsPerPage;
			config.performance.maxItemsPerPage = 5;

			mockReq = {
				query: {
					limit: "10", // Higher than max
				},
			};

			expect(() => {
				validator(mockReq as Request, mockRes as Response, mockNext);
			}).toThrow(ValidationError);

			// Restore
			config.performance.maxItemsPerPage = originalMaxItems;
		});
	});
});
