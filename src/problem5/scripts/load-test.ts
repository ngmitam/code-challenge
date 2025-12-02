import http from "http";

/**
 * Simple load test script to verify basic performance
 * This runs a few concurrent requests to ensure the app can handle load
 */

const HOST =
	process.env.TEST_BASE_URL ||
	(process.env.NODE_ENV === "test"
		? "http://localhost:3001"
		: "http://localhost:3000");
const CONCURRENT_REQUESTS = 10;
const REQUESTS_PER_CLIENT = 5;

async function waitForServer(maxRetries: number = 30): Promise<void> {
	for (let i = 0; i < maxRetries; i++) {
		try {
			await new Promise<void>((resolve, reject) => {
				http.get(`${HOST}/health`, (res) => {
					if (res.statusCode === 200) {
						resolve();
					} else {
						reject(
							new Error(
								`Server returned status ${res.statusCode}`
							)
						);
					}
				}).on("error", reject);
			});
			console.log("✅ Server is ready!");
			return;
		} catch {
			console.log(`⏳ Waiting for server... (${i + 1}/${maxRetries})`);
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
	throw new Error("Server failed to start within the timeout period");
}

async function makeRequest(
	clientId: number,
	requestId: number
): Promise<number> {
	return new Promise((resolve) => {
		const start = Date.now();
		const url = requestId % 2 === 0 ? `${HOST}/health` : `${HOST}/api-docs`;

		http.get(url, (res) => {
			res.on("data", () => {
				// Ignore response data for load testing
			});
			res.on("end", () => {
				const duration = Date.now() - start;
				console.log(
					`Client ${clientId}, Request ${requestId}: ${res.statusCode} in ${duration}ms`
				);
				resolve(duration);
			});
		}).on("error", (err) => {
			console.error(
				`Client ${clientId}, Request ${requestId}: Error - ${err.message}`
			);
			resolve(0);
		});
	});
}

async function runClient(clientId: number): Promise<number[]> {
	const results: number[] = [];

	for (let i = 0; i < REQUESTS_PER_CLIENT; i++) {
		const duration = await makeRequest(clientId, i);
		results.push(duration);
		// Small delay between requests
		await new Promise((resolve) => setTimeout(resolve, 50));
	}

	return results;
}

async function main() {
	console.log("⏳ Waiting for server to be ready...");
	await waitForServer();

	console.log(
		`Starting load test with ${CONCURRENT_REQUESTS} clients, ${REQUESTS_PER_CLIENT} requests each...`
	);

	const startTime = Date.now();
	const clientPromises = [];

	for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
		clientPromises.push(runClient(i));
	}

	const allResults = await Promise.all(clientPromises);
	const totalTime = Date.now() - startTime;

	// Flatten results
	const flatResults = allResults.flat().filter((r) => r > 0);

	if (flatResults.length === 0) {
		console.error("No successful requests!");
		process.exit(1);
	}

	const avgResponseTime =
		flatResults.reduce((a, b) => a + b, 0) / flatResults.length;
	const minResponseTime = Math.min(...flatResults);
	const maxResponseTime = Math.max(...flatResults);
	const successRate =
		(flatResults.length / (CONCURRENT_REQUESTS * REQUESTS_PER_CLIENT)) *
		100;

	console.log("\n=== Load Test Results ===");
	console.log(`Total time: ${totalTime}ms`);
	console.log(
		`Successful requests: ${flatResults.length}/${
			CONCURRENT_REQUESTS * REQUESTS_PER_CLIENT
		}`
	);
	console.log(`Success rate: ${successRate.toFixed(1)}%`);
	console.log(`Average response time: ${avgResponseTime.toFixed(1)}ms`);
	console.log(`Min response time: ${minResponseTime}ms`);
	console.log(`Max response time: ${maxResponseTime}ms`);

	// Basic performance thresholds
	const MAX_AVG_RESPONSE_TIME = 500; // ms
	const MIN_SUCCESS_RATE = 95; // %

	if (avgResponseTime > MAX_AVG_RESPONSE_TIME) {
		console.error(
			`❌ Average response time too high: ${avgResponseTime.toFixed(
				1
			)}ms > ${MAX_AVG_RESPONSE_TIME}ms`
		);
		process.exit(1);
	}

	if (successRate < MIN_SUCCESS_RATE) {
		console.error(
			`❌ Success rate too low: ${successRate.toFixed(
				1
			)}% < ${MIN_SUCCESS_RATE}%`
		);
		process.exit(1);
	}

	console.log("✅ Load test passed!");
}

main().catch(console.error);
