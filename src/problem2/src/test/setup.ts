import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock i18next
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => {
			const translations: Record<string, string> = {
				currencySwap: "Currency Swap",
				from: "From",
				to: "To",
				swapFrom: "swap from",
				receive: "receive",
				amountToSend: "Amount to send",
				amountToReceive: "Amount to receive",
				confirmSwap: "CONFIRM SWAP",
				processing: "Processing...",
				swapSuccessful: "Swap Successful!",
				swapCompleted:
					"Your currency swap has been completed successfully.",
				unableToLoad: "Unable to load currency data",
				tryAgain: "Try Again",
				failedToLoad:
					"Failed to load prices. Please check your connection and try again.",
				toggleTheme: "Toggle theme",
			};
			return translations[key] || key;
		},
	}),
	initReactI18next: {
		type: "3rdParty",
		init: vi.fn(),
	},
	I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock ThemeContext
vi.mock("../contexts/ThemeContext", () => ({
	ThemeContext: undefined,
}));

// Mock ThemeProvider
vi.mock("../contexts/ThemeProvider", () => ({
	ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock useTheme hook
vi.mock("../hooks/useTheme", () => ({
	useTheme: () => ({
		theme: "light",
		toggleTheme: vi.fn(),
	}),
}));
