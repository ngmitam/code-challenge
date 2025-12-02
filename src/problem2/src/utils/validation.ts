import { z } from "zod";

export const currencyAmountSchema = z
	.object({
		amount: z
			.string()
			.min(1, "Amount is required")
			.refine((val) => !isNaN(Number(val)), "Must be a valid number")
			.refine((val) => Number(val) > 0, "Amount must be greater than 0")
			.refine(
				(val) => Number(val) <= 1000000,
				"Amount cannot exceed 1,000,000"
			),
		currency: z.string().min(1, "Currency is required"),
	})
	.refine((data) => data.currency !== "", "Please select a currency");

export const swapFormSchema = z
	.object({
		fromAmount: currencyAmountSchema,
		toCurrency: z.string().min(1, "Target currency is required"),
	})
	.refine(
		(data) => data.fromAmount.currency !== data.toCurrency,
		"From and to currencies must be different"
	);

export type CurrencyAmount = z.infer<typeof currencyAmountSchema>;
export type SwapFormData = z.infer<typeof swapFormSchema>;
