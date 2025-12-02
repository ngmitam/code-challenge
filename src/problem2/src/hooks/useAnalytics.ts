import { useEffect, useCallback } from "react";
import { FEATURE_FLAGS } from "../config/features";

interface AnalyticsEvent {
	event: string;
	category: string;
	action: string;
	label?: string;
	value?: number;
	timestamp: number;
}

class AnalyticsService {
	private events: AnalyticsEvent[] = [];
	private readonly maxEvents = 100;

	trackEvent(event: Omit<AnalyticsEvent, "timestamp">) {
		if (!FEATURE_FLAGS.ENABLE_ADVANCED_ANALYTICS) return;

		const analyticsEvent: AnalyticsEvent = {
			...event,
			timestamp: Date.now(),
		};

		this.events.push(analyticsEvent);

		// Keep only the last maxEvents
		if (this.events.length > this.maxEvents) {
			this.events = this.events.slice(-this.maxEvents);
		}

		// In a real app, send to analytics service
		console.log("Analytics Event:", analyticsEvent);

		// Store in localStorage for persistence
		try {
			localStorage.setItem(
				"analytics_events",
				JSON.stringify(this.events)
			);
		} catch (error) {
			console.warn("Failed to store analytics events:", error);
		}
	}

	getEvents(): AnalyticsEvent[] {
		return [...this.events];
	}

	clearEvents() {
		this.events = [];
		localStorage.removeItem("analytics_events");
	}
}

const analyticsService = new AnalyticsService();

// Load stored events on initialization
try {
	const stored = localStorage.getItem("analytics_events");
	if (stored) {
		const events = JSON.parse(stored);
		analyticsService["events"] = events;
	}
} catch (error) {
	console.warn("Failed to load stored analytics events:", error);
}

export const useAnalytics = () => {
	const trackEvent = useCallback(
		(event: Omit<AnalyticsEvent, "timestamp">) => {
			analyticsService.trackEvent(event);
		},
		[]
	);

	const trackPageView = useCallback(
		(page: string) => {
			trackEvent({
				event: "page_view",
				category: "navigation",
				action: "view",
				label: page,
			});
		},
		[trackEvent]
	);

	const trackUserInteraction = useCallback(
		(action: string, label?: string, value?: number) => {
			trackEvent({
				event: "user_interaction",
				category: "interaction",
				action,
				label,
				value,
			});
		},
		[trackEvent]
	);

	const trackConversion = useCallback(
		(type: string, value: number) => {
			trackEvent({
				event: "conversion",
				category: "business",
				action: type,
				value,
			});
		},
		[trackEvent]
	);

	useEffect(() => {
		// Track initial page load
		trackPageView("currency_swap");
	}, [trackPageView]);

	return {
		trackEvent,
		trackPageView,
		trackUserInteraction,
		trackConversion,
		getEvents: analyticsService.getEvents.bind(analyticsService),
		clearEvents: analyticsService.clearEvents.bind(analyticsService),
	};
};
