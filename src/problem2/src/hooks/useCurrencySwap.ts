import { useState, useEffect, useCallback } from "react";
import { swapFormSchema } from "../utils/validation";
import { logger } from "../utils/logger";
import { FEATURE_FLAGS } from "../config/features";
import type { CurrencyCode, PriceData } from "../types";

interface PriceHistory {
	currency: CurrencyCode;
	prices: { price: number; timestamp: number }[];
}

interface UseCurrencySwapReturn {
	prices: Record<CurrencyCode, PriceData>;
	priceHistory: Record<CurrencyCode, PriceHistory>;
	currencies: CurrencyCode[];
	fromCurrency: CurrencyCode;
	toCurrency: CurrencyCode;
	inputAmount: string;
	outputAmount: string;
	exchangeRate: string;
	loading: boolean;
	error: string;
	submitting: boolean;
	validationErrors: Record<string, string>;
	setFromCurrency: (currency: CurrencyCode) => void;
	setToCurrency: (currency: CurrencyCode) => void;
	setInputAmount: (amount: string) => void;
	swapCurrencies: () => void;
	handleSubmit: (e: React.FormEvent) => Promise<void>;
	refetchPrices: () => Promise<void>;
	showSuccessModal: boolean;
	setShowSuccessModal: (show: boolean) => void;
}

const CACHE_KEY = "currency_prices_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const API_URL =
	import.meta.env.VITE_API_URL ||
	"https://interview.switcheo.com/prices.json";
const MAX_RETRY_ATTEMPTS = Number(import.meta.env.VITE_MAX_RETRY_ATTEMPTS) || 3;
const RETRY_DELAY = Number(import.meta.env.VITE_RETRY_DELAY) || 1000;
const SUBMIT_TIMEOUT = Number(import.meta.env.VITE_SUBMIT_TIMEOUT) || 2000;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
	url: string,
	attempts: number = MAX_RETRY_ATTEMPTS
): Promise<Response> {
	for (let i = 0; i < attempts; i++) {
		try {
			const response = await fetch(url);
			if (response.ok) return response;
			if (i === attempts - 1) throw new Error(`HTTP ${response.status}`);
		} catch (error) {
			if (i === attempts - 1) throw error;
			await sleep(RETRY_DELAY * Math.pow(2, i)); // Exponential backoff
		}
	}
	throw new Error("Max retries exceeded");
}

function getCachedPrices(): Record<string, PriceData> | null {
	try {
		const cached = localStorage.getItem(CACHE_KEY);
		if (!cached) return null;

		const { data, timestamp } = JSON.parse(cached);
		if (Date.now() - timestamp > CACHE_DURATION) {
			localStorage.removeItem(CACHE_KEY);
			return null;
		}
		return data;
	} catch {
		return null;
	}
}

function setCachedPrices(prices: Record<string, PriceData>): void {
	try {
		localStorage.setItem(
			CACHE_KEY,
			JSON.stringify({
				data: prices,
				timestamp: Date.now(),
			})
		);
	} catch {
		// Ignore storage errors
	}
}

export function useCurrencySwap(): UseCurrencySwapReturn {
	const [prices, setPrices] = useState<Record<CurrencyCode, PriceData>>({});
	const [priceHistory, setPriceHistory] = useState<
		Record<CurrencyCode, PriceHistory>
	>({});
	const [currencies, setCurrencies] = useState<CurrencyCode[]>([]);
	const [fromCurrency, setFromCurrency] = useState<CurrencyCode>("USD");
	const [toCurrency, setToCurrency] = useState<CurrencyCode>("ETH");
	const [inputAmount, setInputAmount] = useState<string>("");
	const [outputAmount, setOutputAmount] = useState<string>("");
	const [exchangeRate, setExchangeRate] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>("");
	const [submitting, setSubmitting] = useState<boolean>(false);
	const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

	const fetchPrices = useCallback(async () => {
		try {
			setError("");

			// Try cache first
			const cachedPrices = getCachedPrices();
			if (cachedPrices) {
				setPrices(cachedPrices);
				const sortedCurrencies = Object.keys(cachedPrices).sort();
				setCurrencies(sortedCurrencies);
				setLoading(false);
				return;
			}

			const response = await fetchWithRetry(API_URL);
			const data: PriceData[] = await response.json();

			const latestPrices: Record<string, PriceData> = {};
			data.forEach((item) => {
				if (
					!latestPrices[item.currency] ||
					new Date(item.date) >
						new Date(latestPrices[item.currency].date)
				) {
					latestPrices[item.currency] = item;
				}
			});

			setPrices(latestPrices);
			setCachedPrices(latestPrices);
			const sortedCurrencies = Object.keys(latestPrices).sort();
			setCurrencies(sortedCurrencies);

			// Update price history
			setPriceHistory((prevHistory) => {
				const newHistory = { ...prevHistory };
				Object.entries(latestPrices).forEach(([currency, data]) => {
					if (!newHistory[currency]) {
						newHistory[currency] = { currency, prices: [] };
					}
					newHistory[currency].prices.push({
						price: data.price,
						timestamp: Date.now(),
					});
					// Keep only last 50 prices
					if (newHistory[currency].prices.length > 50) {
						newHistory[currency].prices =
							newHistory[currency].prices.slice(-50);
					}
				});
				return newHistory;
			});

			setLoading(false);

			logger.info("Successfully loaded currency prices", {
				currencyCount: sortedCurrencies.length,
				currencies: sortedCurrencies.slice(0, 5), // Log first 5 for brevity
			});
		} catch (err) {
			console.error("Failed to fetch prices:", err);
			setError(
				"Failed to load prices. Please check your connection and try again."
			);
			setLoading(false);

			logger.error("Failed to fetch currency prices", { error: err });
		}
	}, []);

	useEffect(() => {
		fetchPrices();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (FEATURE_FLAGS.ENABLE_REAL_TIME_UPDATES) {
			const interval = setInterval(() => {
				fetchPrices();
			}, 30000); // Update every 30 seconds

			return () => clearInterval(interval);
		}
	}, [fetchPrices]);

	useEffect(() => {
		const amount = parseFloat(inputAmount);
		if (
			fromCurrency &&
			toCurrency &&
			amount > 0 &&
			prices[fromCurrency] &&
			prices[toCurrency]
		) {
			const rate = prices[fromCurrency].price / prices[toCurrency].price;
			setOutputAmount((amount * rate).toFixed(6));
			setExchangeRate(
				`1 ${fromCurrency} = ${rate.toFixed(6)} ${toCurrency}`
			);
		} else {
			setOutputAmount("");
			setExchangeRate("");
		}
	}, [fromCurrency, toCurrency, inputAmount, prices]);

	const validateForm = useCallback((): boolean => {
		const formData = {
			fromAmount: { amount: inputAmount, currency: fromCurrency },
			toCurrency,
		};

		const result = swapFormSchema.safeParse(formData);
		if (!result.success) {
			const errors: Record<string, string> = {};
			result.error.issues.forEach((err) => {
				const path = err.path.join(".");
				errors[path] = err.message;
			});
			setValidationErrors(errors);
			return false;
		}

		setValidationErrors({});
		return true;
	}, [inputAmount, fromCurrency, toCurrency]);

	const swapCurrencies = useCallback(() => {
		setFromCurrency(toCurrency);
		setToCurrency(fromCurrency);
		setValidationErrors({});
	}, [fromCurrency, toCurrency]);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			const startTime = performance.now();

			try {
				if (!validateForm()) {
					logger.warn("Form validation failed", { validationErrors });
					return;
				}

				setSubmitting(true);
				setError("");
				setValidationErrors({});

				// Simulate backend call with timeout
				await sleep(SUBMIT_TIMEOUT);

				setInputAmount("");
				setOutputAmount("");
				setExchangeRate("");
				setSubmitting(false);
				setShowSuccessModal(true);

				const duration = performance.now() - startTime;
				logger.info("Currency swap completed successfully", {
					fromCurrency,
					toCurrency,
					amount: inputAmount,
					duration: `${duration.toFixed(2)}ms`,
				});
			} catch (error) {
				const duration = performance.now() - startTime;
				logger.error("Currency swap failed", {
					error,
					fromCurrency,
					toCurrency,
					amount: inputAmount,
					duration: `${duration.toFixed(2)}ms`,
				});
				setSubmitting(false);
				setError("Failed to complete the swap. Please try again.");
			}
		},
		[validateForm, fromCurrency, toCurrency, inputAmount, validationErrors]
	);

	return {
		prices,
		priceHistory,
		currencies,
		fromCurrency,
		toCurrency,
		inputAmount,
		outputAmount,
		exchangeRate,
		loading,
		error,
		submitting,
		validationErrors,
		setFromCurrency,
		setToCurrency,
		setInputAmount,
		swapCurrencies,
		handleSubmit,
		refetchPrices: fetchPrices,
		showSuccessModal,
		setShowSuccessModal,
	};
}
