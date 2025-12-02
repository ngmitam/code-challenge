import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "./utils/i18n";
import { ThemeProvider } from "./contexts/ThemeProvider";
import App from "./App";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const renderWithProviders = (component: React.ReactElement) => {
	return render(
		<I18nextProvider i18n={i18n}>
			<ThemeProvider>{component}</ThemeProvider>
		</I18nextProvider>
	);
};

describe("Currency Swap Form", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders loading state initially", () => {
		// Mock fetch to never resolve
		mockFetch.mockImplementation(() => new Promise(() => {}));

		renderWithProviders(<App />);
		// Check for skeleton loading elements
		expect(document.querySelector(".skeleton")).toBeInTheDocument();
	});

	it("renders error state when fetch fails", async () => {
		mockFetch.mockRejectedValue(new Error("Network error"));

		renderWithProviders(<App />);
		await waitFor(
			() => {
				expect(
					screen.getByText(
						"Failed to load prices. Please check your connection and try again."
					)
				).toBeInTheDocument();
			},
			{ timeout: 10000 }
		);
	});

	it("renders form when data loads successfully", async () => {
		const mockPrices = [
			{ currency: "USD", price: 1, date: "2025-12-02" },
			{ currency: "ETH", price: 3000, date: "2025-12-02" },
		];

		mockFetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockPrices),
		});

		render(<App />);

		await waitFor(() => {
			expect(screen.getByText("Currency Swap")).toBeInTheDocument();
		});

		expect(
			screen.getByLabelText("Select currency to swap from")
		).toBeInTheDocument();
		expect(
			screen.getByLabelText("Select currency to receive")
		).toBeInTheDocument();
		expect(screen.getByLabelText("swap from")).toBeInTheDocument();
		expect(screen.getByLabelText("receive")).toBeInTheDocument();
	});

	it("calculates exchange rate correctly", async () => {
		const mockPrices = [
			{ currency: "USD", price: 1, date: "2025-12-02" },
			{ currency: "ETH", price: 3000, date: "2025-12-02" },
		];

		mockFetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockPrices),
		});

		renderWithProviders(<App />);

		await waitFor(() => {
			expect(screen.getByText("Currency Swap")).toBeInTheDocument();
		});

		const inputAmount = screen.getByLabelText("swap from");
		fireEvent.change(inputAmount, { target: { value: "100" } });

		await waitFor(() => {
			const outputAmount = screen.getByLabelText("receive");
			expect(outputAmount).toHaveValue(0.033333);
		});
	});

	it("swaps currencies when swap button is clicked", async () => {
		const mockPrices = [
			{ currency: "USD", price: 1, date: "2025-12-02" },
			{ currency: "ETH", price: 3000, date: "2025-12-02" },
		];

		mockFetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockPrices),
		});

		renderWithProviders(<App />);

		await waitFor(() => {
			expect(screen.getByText("Currency Swap")).toBeInTheDocument();
		});

		const fromSelect = screen.getByLabelText(
			"Select currency to swap from"
		);
		const toSelect = screen.getByLabelText("Select currency to receive");

		expect(fromSelect).toHaveValue("USD");
		expect(toSelect).toHaveValue("ETH");

		const swapButton = screen.getByLabelText("Swap currencies");
		fireEvent.click(swapButton);

		expect(fromSelect).toHaveValue("ETH");
		expect(toSelect).toHaveValue("USD");
	});

	it("shows error when submitting without amounts", async () => {
		const mockPrices = [
			{ currency: "USD", price: 1, date: "2025-12-02" },
			{ currency: "ETH", price: 3000, date: "2025-12-02" },
		];

		mockFetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockPrices),
		});

		renderWithProviders(<App />);

		await waitFor(() => {
			expect(screen.getByText("Currency Swap")).toBeInTheDocument();
		});

		const submitButton = screen.getByText("CONFIRM SWAP");
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(
				screen.getByText("Amount must be greater than 0")
			).toBeInTheDocument();
		});
	});

	it("handles successful submission", async () => {
		const mockPrices = [
			{ currency: "USD", price: 1, date: "2025-12-02" },
			{ currency: "ETH", price: 3000, date: "2025-12-02" },
		];

		mockFetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockPrices),
		});

		renderWithProviders(<App />);

		await waitFor(() => {
			expect(screen.getByText("Currency Swap")).toBeInTheDocument();
		});

		const inputAmount = screen.getByLabelText("swap from");
		fireEvent.change(inputAmount, { target: { value: "100" } });

		await waitFor(() => {
			expect(screen.getByLabelText("receive")).toHaveValue(0.033333);
		});

		const submitButton = screen.getByText("CONFIRM SWAP");
		fireEvent.click(submitButton);

		expect(submitButton).toHaveTextContent("Processing...");
		expect(submitButton).toBeDisabled();
	});
});
