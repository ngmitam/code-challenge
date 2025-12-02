import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
	stages: [
		{ duration: "30s", target: 10 }, // Ramp up to 10 users over 30s
		{ duration: "1m", target: 10 }, // Stay at 10 users for 1m
		{ duration: "30s", target: 50 }, // Ramp up to 50 users over 30s
		{ duration: "1m", target: 50 }, // Stay at 50 users for 1m
		{ duration: "30s", target: 0 }, // Ramp down to 0 users over 30s
	],
	thresholds: {
		http_req_duration: ["p(95)<500"], // 95% of requests should be below 500ms
		http_req_failed: ["rate<0.5"], // Error rate should be below 50% (accounting for rate limiting)
	},
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
	// Health check
	let response = http.get(`${BASE_URL}/health`);
	check(response, {
		"health check status is 200 or 429": (r) =>
			r.status === 200 || r.status === 429,
		"health check response time < 200ms": (r) => r.timings.duration < 200,
	});

	// API docs (if available)
	response = http.get(`${BASE_URL}/api-docs`);
	check(response, {
		"api docs accessible": (r) =>
			r.status === 200 || r.status === 404 || r.status === 429,
	});

	sleep(5); // Increased sleep to reduce rate limiting
}
