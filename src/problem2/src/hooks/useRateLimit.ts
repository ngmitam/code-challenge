import { useState, useCallback, useRef } from "react";

interface UseRateLimitOptions {
	maxAttempts: number;
	windowMs: number;
}

interface UseRateLimitReturn {
	isRateLimited: boolean;
	attemptCount: number;
	timeUntilReset: number;
	execute: <T>(fn: () => T | Promise<T>) => Promise<T | null>;
	reset: () => void;
}

export function useRateLimit({
	maxAttempts = 5,
	windowMs = 60000,
}: UseRateLimitOptions): UseRateLimitReturn {
	const [isRateLimited, setIsRateLimited] = useState(false);
	const [attemptCount, setAttemptCount] = useState(0);
	const [timeUntilReset, setTimeUntilReset] = useState(0);

	const attemptsRef = useRef<number[]>([]);
	const timeoutRef = useRef<number | null>(null);

	const reset = useCallback(() => {
		attemptsRef.current = [];
		setAttemptCount(0);
		setIsRateLimited(false);
		setTimeUntilReset(0);
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
	}, []);

	const execute = useCallback(
		async <T>(fn: () => T | Promise<T>): Promise<T | null> => {
			if (isRateLimited) {
				return null;
			}

			const now = Date.now();
			attemptsRef.current = attemptsRef.current.filter(
				(timestamp) => now - timestamp < windowMs
			);

			if (attemptsRef.current.length >= maxAttempts) {
				const oldestAttempt = Math.min(...attemptsRef.current);
				const resetTime = oldestAttempt + windowMs;
				const timeLeft = resetTime - now;

				setIsRateLimited(true);
				setTimeUntilReset(timeLeft);

				timeoutRef.current = setTimeout(() => {
					reset();
				}, timeLeft);

				return null;
			}

			attemptsRef.current.push(now);
			setAttemptCount(attemptsRef.current.length);

			try {
				const result = await fn();
				return result;
			} catch (error) {
				console.error("Rate limited function failed:", error);
				return null;
			}
		},
		[isRateLimited, maxAttempts, windowMs, reset]
	);

	return {
		isRateLimited,
		attemptCount,
		timeUntilReset,
		execute,
		reset,
	};
}
