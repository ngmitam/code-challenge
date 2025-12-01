// Test file for problem4.ts

import { sum_to_n_a, sum_to_n_b, sum_to_n_c } from "./problem4";

function testSumFunction(func: (n: number) => number, name: string) {
	const testCases = [
		{ input: 0, expected: 0 },
		{ input: 1, expected: 1 },
		{ input: 5, expected: 15 },
		{ input: 10, expected: 55 },
		{ input: 100, expected: 5050 },
	];

	console.log(`Testing ${name}:`);
	for (const { input, expected } of testCases) {
		try {
			const result = func(input);
			const pass = result === expected;
			console.log(
				`  sum_to_n(${input}) = ${result} ${
					pass ? "✓" : "✗"
				} (expected ${expected})`
			);
		} catch (error) {
			console.log(`  sum_to_n(${input}) threw error: ${error}`);
		}
	}
	console.log("");
}

testSumFunction(sum_to_n_a, "sum_to_n_a (iterative)");
testSumFunction(sum_to_n_b, "sum_to_n_b (formula)");
testSumFunction(sum_to_n_c, "sum_to_n_c (recursive)");

// Test edge cases
console.log("Testing edge cases:");
try {
	sum_to_n_a(-1);
} catch (error) {
	console.log(
		"sum_to_n_a(-1) correctly threw error:",
		error instanceof Error ? error.message : String(error)
	);
}

try {
	sum_to_n_b(-1);
} catch (error) {
	console.log(
		"sum_to_n_b(-1) correctly threw error:",
		error instanceof Error ? error.message : String(error)
	);
}

try {
	sum_to_n_c(-1);
} catch (error) {
	console.log(
		"sum_to_n_c(-1) correctly threw error:",
		error instanceof Error ? error.message : String(error)
	);
}
