import { useEffect, useRef, useCallback } from "react";
import { logger } from "../utils/logger";

interface PerformanceMetrics {
	renderTime: number;
	interactionTime?: number;
	memoryUsage?: number;
}

interface MemoryInfo {
	usedJSHeapSize: number;
	totalJSHeapSize: number;
	jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
	memory?: MemoryInfo;
}

interface UsePerformanceMonitorOptions {
	componentName: string;
	trackRenders?: boolean;
	trackInteractions?: boolean;
	sampleRate?: number; // 0-1, how often to log
}

export function usePerformanceMonitor({
	componentName,
	trackRenders = true,
	trackInteractions = false,
	sampleRate = 0.1, // 10% sampling
}: UsePerformanceMonitorOptions) {
	const renderStartTime = useRef<number>(0);
	const renderCount = useRef(0);
	const lastInteractionTime = useRef<number>(0);

	// Track render performance
	useEffect(() => {
		if (!trackRenders) return;

		renderStartTime.current = performance.now();
		const currentRenderCount = ++renderCount.current;

		return () => {
			if (renderStartTime.current && Math.random() < sampleRate) {
				const renderTime = performance.now() - renderStartTime.current;
				const metrics: PerformanceMetrics = { renderTime };

				// Get memory info if available
				const extendedPerf = performance as ExtendedPerformance;
				if (extendedPerf.memory) {
					metrics.memoryUsage = extendedPerf.memory.usedJSHeapSize;
				}

				logger.info(`Component render performance: ${componentName}`, {
					renderTime: `${renderTime.toFixed(2)}ms`,
					renderCount: currentRenderCount,
					memoryUsage: metrics.memoryUsage
						? `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`
						: undefined,
				});
			}
		};
	});

	// Track user interactions
	const trackInteraction = useCallback(
		(interactionType: string, details?: Record<string, unknown>) => {
			if (!trackInteractions) return;

			const now = performance.now();
			const timeSinceLastInteraction = lastInteractionTime.current
				? now - lastInteractionTime.current
				: 0;

			lastInteractionTime.current = now;

			if (Math.random() < sampleRate) {
				logger.info(`User interaction: ${componentName}`, {
					interactionType,
					timeSinceLastInteraction: `${timeSinceLastInteraction.toFixed(
						2
					)}ms`,
					details,
				});
			}
		},
		[componentName, trackInteractions, sampleRate]
	);

	// Track API call performance
	const trackApiCall = useCallback(
		(
			apiName: string,
			startTime: number,
			success: boolean,
			error?: Error
		) => {
			const duration = performance.now() - startTime;

			if (Math.random() < sampleRate) {
				logger.info(`API call performance: ${apiName}`, {
					duration: `${duration.toFixed(2)}ms`,
					success,
					error: error?.message,
				});
			}
		},
		[sampleRate]
	);

	return {
		trackInteraction,
		trackApiCall,
	};
}
