// Shared types for the application

export type CurrencyCode = string; // ISO 4217 currency codes like 'USD', 'EUR', etc.

export interface CurrencyOption {
	code: CurrencyCode;
	name: string;
	symbol?: string;
}

export interface PriceData {
	currency: CurrencyCode;
	price: number;
	date: string;
}

export interface ValidationError {
	field: string;
	message: string;
}
