import { memo } from "react";
import "../App.css";
import { FEATURE_FLAGS } from "../config/features";
import { sanitizeNumericInput, sanitizeCurrencyCode } from "../utils/security";
import type { CurrencyCode } from "../types";

interface CurrencyInputProps {
	label: string;
	currency: CurrencyCode;
	amount: string;
	onCurrencyChange: (value: CurrencyCode) => void;
	onAmountChange: (value: string) => void;
	currencies: CurrencyCode[];
	disabled?: boolean;
	ariaLabel: string;
	placeholder: string;
	readOnly?: boolean;
	error?: string;
}

export const CurrencyInput = memo(
	({
		label,
		currency,
		amount,
		onCurrencyChange,
		onAmountChange,
		currencies,
		disabled = false,
		ariaLabel,
		placeholder,
		readOnly = false,
		error,
	}: CurrencyInputProps) => {
		return (
			<div className="currency-input">
				<label htmlFor={`${label.toLowerCase()}-currency`}>
					{label}
				</label>
				<div className="select-wrapper">
					{FEATURE_FLAGS.ENABLE_CURRENCY_ICONS && (
						<img
							key={currency}
							src={`https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${currency}.svg`}
							alt={`${currency} icon`}
							onError={(e) => {
								e.currentTarget.style.display = "none";
							}}
						/>
					)}
					<select
						id={`${label.toLowerCase()}-currency`}
						value={currency}
						onChange={(e) =>
							onCurrencyChange(
								sanitizeCurrencyCode(e.target.value)
							)
						}
						aria-label={`Select currency to ${ariaLabel}`}
						aria-describedby={
							error ? `${label.toLowerCase()}-error` : undefined
						}
						aria-invalid={!!error}
						disabled={disabled}
						role="combobox"
						aria-expanded="false"
					>
						{currencies.map((curr) => (
							<option key={curr} value={curr}>
								{curr}
							</option>
						))}
					</select>
				</div>
				<input
					id={`${label.toLowerCase()}-amount`}
					type="number"
					placeholder={placeholder}
					min="0"
					step="any"
					value={amount}
					onChange={(e) =>
						onAmountChange(sanitizeNumericInput(e.target.value))
					}
					aria-label={ariaLabel}
					aria-describedby={
						error ? `${label.toLowerCase()}-error` : undefined
					}
					aria-invalid={!!error}
					disabled={disabled}
					readOnly={readOnly}
					className={error ? "input-error" : ""}
					autoComplete="off"
					inputMode="decimal"
				/>
				{error && (
					<div
						id={`${label.toLowerCase()}-error`}
						className="input-error-message"
						role="alert"
						aria-live="polite"
					>
						{error}
					</div>
				)}
			</div>
		);
	}
);
