/**
 * Security utilities for input sanitization and validation
 */

export function sanitizeNumericInput(input: string): string {
	// Remove any non-numeric characters except decimal point
	return input.replace(/[^0-9.]/g, "");
}

export function sanitizeCurrencyCode(input: string): string {
	// Only allow uppercase letters and numbers, max 10 characters
	return input.replace(/[^A-Z0-9]/g, "").substring(0, 10);
}

export function validateAmountRange(
	amount: number,
	min: number = 0,
	max: number = 1000000
): boolean {
	return amount >= min && amount <= max && Number.isFinite(amount);
}

export function escapeHtml(unsafe: string): string {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

export function isValidCurrencyCode(code: string): boolean {
	// Basic validation: 2-10 uppercase letters/numbers
	const currencyRegex = /^[A-Z0-9]{2,10}$/;
	return currencyRegex.test(code);
}

export function preventXSS(input: string): string {
	// Basic XSS prevention - escape dangerous characters
	return escapeHtml(input);
}

export function rateLimitCheck(
	lastRequestTime: number,
	minIntervalMs: number = 1000
): { allowed: boolean; waitTime: number } {
	const now = Date.now();
	const timeSinceLastRequest = now - lastRequestTime;

	if (timeSinceLastRequest < minIntervalMs) {
		return {
			allowed: false,
			waitTime: minIntervalMs - timeSinceLastRequest,
		};
	}

	return { allowed: true, waitTime: 0 };
}
