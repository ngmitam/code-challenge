import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCurrencySwap } from "./useCurrencySwap";

describe("useCurrencySwap", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("initializes with default values", () => {
		const mockFetch = vi.fn();
		vi.stubGlobal("fetch", mockFetch);

		const { result } = renderHook(() => useCurrencySwap());

		expect(result.current.fromCurrency).toBe("USD");
		expect(result.current.toCurrency).toBe("ETH");
		expect(result.current.inputAmount).toBe("");
		expect(result.current.loading).toBe(true);
	});

	it("loads prices from API successfully", async () => {
		const mockPrices = [
			{ currency: "USD", price: 1, date: "2025-12-02" },
			{ currency: "ETH", price: 3000, date: "2025-12-02" },
		];

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockPrices),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { result } = renderHook(() => useCurrencySwap());

		await waitFor(
			() => {
				expect(result.current.loading).toBe(false);
			},
			{ timeout: 10000 }
		);

		expect(result.current.currencies).toEqual(["ETH", "USD"]);
		expect(result.current.prices).toHaveProperty("USD");
		expect(result.current.prices).toHaveProperty("ETH");
	});

	it("calculates exchange rate correctly", async () => {
		const mockPrices = [
			{ currency: "USD", price: 1, date: "2025-12-02" },
			{ currency: "ETH", price: 3000, date: "2025-12-02" },
		];

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockPrices),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { result } = renderHook(() => useCurrencySwap());

		await waitFor(
			() => {
				expect(result.current.loading).toBe(false);
			},
			{ timeout: 10000 }
		);

		act(() => {
			result.current.setInputAmount("100");
		});

		await waitFor(() => {
			expect(result.current.outputAmount).toBe("0.033333");
			expect(result.current.exchangeRate).toBe("1 USD = 0.000333 ETH");
		});
	});

	it("swaps currencies correctly", async () => {
		const mockPrices = [
			{ currency: "USD", price: 1, date: "2025-12-02" },
			{ currency: "ETH", price: 3000, date: "2025-12-02" },
		];

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockPrices),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { result } = renderHook(() => useCurrencySwap());

		await waitFor(
			() => {
				expect(result.current.loading).toBe(false);
			},
			{ timeout: 10000 }
		);

		act(() => {
			result.current.swapCurrencies();
		});

		expect(result.current.fromCurrency).toBe("ETH");
		expect(result.current.toCurrency).toBe("USD");
	});

	it("validates form input correctly", async () => {
		const mockPrices = [
			{ currency: "USD", price: 1, date: "2025-12-02" },
			{ currency: "ETH", price: 3000, date: "2025-12-02" },
		];

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockPrices),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { result } = renderHook(() => useCurrencySwap());

		await waitFor(
			() => {
				expect(result.current.loading).toBe(false);
			},
			{ timeout: 10000 }
		);

		// Test invalid amount
		act(() => {
			result.current.setInputAmount("-100");
		});

		// Trigger validation by calling handleSubmit
		await act(async () => {
			await result.current.handleSubmit({
				preventDefault: vi.fn(),
			} as unknown as React.FormEvent);
		});

		expect(result.current.validationErrors).toHaveProperty(
			"fromAmount.amount"
		);
	});

	it("handles successful form submission", async () => {
		const mockPrices = [
			{ currency: "USD", price: 1, date: "2025-12-02" },
			{ currency: "ETH", price: 3000, date: "2025-12-02" },
		];

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockPrices),
		});
		vi.stubGlobal("fetch", mockFetch);

		const { result } = renderHook(() => useCurrencySwap());

		await waitFor(
			() => {
				expect(result.current.loading).toBe(false);
			},
			{ timeout: 10000 }
		);

		act(() => {
			result.current.setInputAmount("100");
		});

		await act(async () => {
			await result.current.handleSubmit({
				preventDefault: vi.fn(),
			} as unknown as React.FormEvent);
		});

		expect(result.current.submitting).toBe(false);
		expect(result.current.showSuccessModal).toBe(true);
		expect(result.current.inputAmount).toBe("");
		expect(result.current.outputAmount).toBe("");
	});
});
