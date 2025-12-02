import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import "./App.css";
import "./components/Modal.css";
import { SwapFormSkeleton } from "./components/LoadingSkeleton";
import { Modal } from "./components/Modal";
import { CurrencyInput } from "./components/CurrencyInput";
import { useCurrencySwap } from "./hooks/useCurrencySwap";
import { useDebounce } from "./hooks/useDebounce";
import { usePerformanceMonitor } from "./hooks/usePerformanceMonitor";
import { useTheme } from "./hooks/useTheme";
import { FEATURE_FLAGS } from "./config/features";
import { useAnalytics } from "./hooks/useAnalytics";

// Lazy load only ErrorBoundary for now
const LazyErrorBoundary = lazy(() => import("./components/ErrorBoundary"));

function App() {
	const { t } = useTranslation();
	const { theme, toggleTheme } = useTheme();
	const { trackUserInteraction } = useAnalytics();
	const { trackInteraction } = usePerformanceMonitor({
		componentName: "CurrencySwapApp",
		trackRenders: true,
		trackInteractions: true,
		sampleRate: 0.2, // 20% sampling for demo
	});
	const {
		currencies,
		fromCurrency,
		toCurrency,
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
		refetchPrices,
		showSuccessModal,
		setShowSuccessModal,
	} = useCurrencySwap();

	const [rawInputAmount, setRawInputAmount] = useState<string>("");
	const debouncedInputAmount = useDebounce(
		rawInputAmount,
		Number(import.meta.env.VITE_DEBOUNCE_DELAY) || 300
	);

	// Update the actual input amount when debounced value changes
	useEffect(() => {
		setInputAmount(debouncedInputAmount);
	}, [debouncedInputAmount, setInputAmount]);

	const handleRetry = useCallback(() => {
		refetchPrices();
	}, [refetchPrices]);

	if (loading) return <SwapFormSkeleton />;

	if (error && !currencies.length) {
		return (
			<div className="container">
				<div className="error-state">
					<h2>{t("unableToLoad")}</h2>
					<p>{error}</p>
					<button onClick={handleRetry} className="retry-btn">
						{t("tryAgain")}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="container">
			{FEATURE_FLAGS.ENABLE_DARK_MODE && (
				<button
					onClick={toggleTheme}
					className="theme-toggle"
					aria-label={t("toggleTheme")}
				>
					{theme === "light" ? "🌙" : "☀️"}
				</button>
			)}
			<form
				onSubmit={(e) => {
					handleSubmit(e);
					trackUserInteraction(
						"submit_swap",
						`${fromCurrency} to ${toCurrency}`,
						parseFloat(rawInputAmount)
					);
				}}
				className="swap-form"
			>
				<h1>{t("currencySwap")}</h1>
				<div className="swap-section">
					<CurrencyInput
						label={t("from")}
						currency={fromCurrency}
						amount={rawInputAmount}
						onCurrencyChange={setFromCurrency}
						onAmountChange={setRawInputAmount}
						currencies={currencies}
						ariaLabel={t("swapFrom")}
						placeholder={t("amountToSend")}
						disabled={submitting}
						error={
							validationErrors["fromAmount.amount"] ||
							validationErrors["fromAmount.currency"]
						}
					/>
					<button
						type="button"
						className="swap-arrow"
						onClick={() => {
							swapCurrencies();
							trackInteraction("swap_currencies");
							trackUserInteraction(
								"swap_currencies",
								`${fromCurrency} to ${toCurrency}`
							);
						}}
						aria-label="Swap currencies"
						disabled={submitting}
					>
						⇅
					</button>
					<CurrencyInput
						label={t("to")}
						currency={toCurrency}
						amount={outputAmount}
						onCurrencyChange={setToCurrency}
						onAmountChange={() => {}} // Read-only
						currencies={currencies}
						ariaLabel={t("receive")}
						placeholder={t("amountToReceive")}
						readOnly
						disabled={submitting}
						error={validationErrors["toCurrency"]}
					/>
				</div>
				{exchangeRate && (
					<div className="exchange-rate">
						<span>{exchangeRate}</span>
					</div>
				)}
				{error && (
					<div
						className="error-message"
						role="alert"
						aria-live="polite"
					>
						{error}
					</div>
				)}
				{validationErrors.root && (
					<div
						className="error-message"
						role="alert"
						aria-live="polite"
					>
						{validationErrors.root}
					</div>
				)}
				<button
					type="submit"
					disabled={
						submitting || Object.keys(validationErrors).length > 0
					}
					className="confirm-btn"
				>
					{submitting ? (
						<>
							<span
								className="loading-spinner"
								aria-hidden="true"
							></span>
							{t("processing")}
						</>
					) : (
						t("confirmSwap")
					)}
				</button>
			</form>
			<Modal
				isOpen={showSuccessModal}
				onClose={() => setShowSuccessModal(false)}
				title={t("swapSuccessful")}
				message={t("swapCompleted")}
			/>
		</div>
	);
}

function AppWithErrorBoundary() {
	return (
		<Suspense fallback={<SwapFormSkeleton />}>
			<LazyErrorBoundary>
				<App />
			</LazyErrorBoundary>
		</Suspense>
	);
}

export default AppWithErrorBoundary;
