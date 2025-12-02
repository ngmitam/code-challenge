import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import config from "../config";
import { ValidationError } from "../utils/result";

export const createItemSchema = z.object({
	body: z.object({
		name: z.string().min(1, "Name is required").max(100, "Name too long"),
		description: z.string().max(500, "Description too long").optional(),
	}),
});

export const updateItemSchema = z.object({
	body: z.object({
		name: z.string().min(1, "Name is required").max(100, "Name too long"),
		description: z.string().max(500, "Description too long").optional(),
	}),
	params: z.object({
		id: z.string(),
	}),
});

export const getItemSchema = z.object({
	params: z.object({
		id: z.string(),
	}),
});

export const deleteItemSchema = z.object({
	params: z.object({
		id: z.string(),
	}),
});

export const listItemsSchema = z.object({
	query: z.object({
		name: z.string().optional(),
		limit: z
			.string()
			.regex(/^\d+$/)
			.transform(Number)
			.refine(
				(val) => val > 0 && val <= config.performance.maxItemsPerPage,
				`Limit must be between 1 and ${config.performance.maxItemsPerPage}`
			)
			.optional(),
		offset: z
			.string()
			.regex(/^\d+$/)
			.transform(Number)
			.refine((val) => val >= 0, "Offset must be non-negative")
			.optional(),
	}),
});

export const validate =
	(schema: z.ZodSchema) =>
	(req: Request, res: Response, next: NextFunction) => {
		try {
			schema.parse(req);
			next();
		} catch (error: unknown) {
			const zodError = error as z.ZodError;
			const firstError = zodError.errors[0];
			throw new ValidationError(
				firstError.message,
				firstError.path.join("."),
				"VALIDATION_ERROR"
			);
		}
	};
