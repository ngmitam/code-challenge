import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns the initial value immediately", () => {
		const { result } = renderHook(() => useDebounce("initial", 500));
		expect(result.current).toBe("initial");
	});

	it("debounces value changes", () => {
		const { result, rerender } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{ initialProps: { value: "initial", delay: 500 } }
		);

		// Initial value
		expect(result.current).toBe("initial");

		// Change value
		rerender({ value: "changed", delay: 500 });
		expect(result.current).toBe("initial"); // Still old value

		// Fast-forward time
		act(() => {
			vi.advanceTimersByTime(500);
		});

		expect(result.current).toBe("changed");
	});

	it("resets timer on value change", () => {
		const { result, rerender } = renderHook(
			({ value }) => useDebounce(value, 500),
			{ initialProps: { value: "initial" } }
		);

		// Change value
		rerender({ value: "first" });
		expect(result.current).toBe("initial");

		// Advance halfway
		act(() => {
			vi.advanceTimersByTime(250);
		});

		// Change again before debounce completes
		rerender({ value: "second" });

		// Advance another 250ms (total 500ms from second change)
		act(() => {
			vi.advanceTimersByTime(250);
		});

		expect(result.current).toBe("initial"); // Still not updated

		// Advance another 250ms to complete debounce
		act(() => {
			vi.advanceTimersByTime(250);
		});

		expect(result.current).toBe("second");
	});

	it("uses different delay values", () => {
		const { result, rerender } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{ initialProps: { value: "initial", delay: 1000 } }
		);

		rerender({ value: "changed", delay: 1000 });

		// Advance 500ms - should not update
		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(result.current).toBe("initial");

		// Advance another 500ms - should update
		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(result.current).toBe("changed");
	});
});
