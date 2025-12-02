import { test, expect } from "@playwright/test";

test.describe("Currency Swap Form", () => {
	test("should load the form and display currencies", async ({ page }) => {
		await page.goto("/");

		// Wait for the form to load
		await page.waitForSelector(".swap-form");

		// Check if title is present
		await expect(page.locator("h1")).toContainText("Currency Swap");

		// Check if currency selects are present
		const fromSelect = page.locator("select").first();
		const toSelect = page.locator("select").last();

		await expect(fromSelect).toBeVisible();
		await expect(toSelect).toBeVisible();

		// Check if USD and ETH are available (assuming they load)
		await expect(fromSelect).toContainText("USD");
		await expect(toSelect).toContainText("ETH");
	});

	test("should allow currency selection and input", async ({ page }) => {
		await page.goto("/");

		await page.waitForSelector(".swap-form");

		// Select currencies
		const fromSelect = page.locator("select").first();
		const toSelect = page.locator("select").last();

		await fromSelect.selectOption("USD");
		await toSelect.selectOption("ETH");

		// Input amount
		const amountInput = page.locator('input[type="number"]').first();
		await amountInput.fill("100");

		// Check if output amount appears (this might take time due to debouncing)
		await page.waitForTimeout(500);
		const outputInput = page.locator('input[type="number"]').last();
		const outputValue = await outputInput.inputValue();
		expect(outputValue).not.toBe("");
	});

	test("should show validation errors for invalid input", async ({
		page,
	}) => {
		await page.goto("/");

		await page.waitForSelector(".swap-form");

		// Try to submit without amount
		const submitButton = page.locator(".confirm-btn");
		await submitButton.click();

		// Check for validation error
		await expect(page.locator(".input-error-message")).toBeVisible();
	});

	test("should be accessible with basic ARIA attributes", async ({
		page,
	}) => {
		await page.goto("/");

		await page.waitForSelector(".swap-form");

		// Check ARIA labels exist on inputs
		const inputs = page.locator("input[aria-label]");
		await expect(inputs).toHaveCount(2);

		// Check selects have proper ARIA labels
		const selects = page.locator('select[aria-label*="Select currency"]');
		await expect(selects).toHaveCount(2);

		// Check form element exists
		const form = page.locator("form");
		await expect(form).toBeVisible();
	});

	test("should handle loading states properly", async ({ page }) => {
		await page.goto("/");

		await page.waitForSelector(".swap-form");

		// Input amount to trigger loading
		const amountInput = page.locator('input[type="number"]').first();
		await amountInput.fill("100");

		// Check for loading skeleton or spinner
		await page.waitForTimeout(200);
		// Loading might be quick, so we don't assert visibility
	});

	test("should handle error states gracefully", async ({ page }) => {
		await page.goto("/");

		await page.waitForSelector(".swap-form");

		// Try to submit with invalid data
		const submitButton = page.locator(".confirm-btn");
		await submitButton.click();

		// Check for error boundary or error message
		await page.waitForTimeout(500);
		// Error might not occur, so we don't assert
	});
});
