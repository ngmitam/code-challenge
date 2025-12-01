// Problem 4: Three ways to sum to n

/**
 * Iterative approach: Uses a loop to sum numbers from 1 to n.
 * Time complexity: O(n) - proportional to n
 * Space complexity: O(1) - constant space
 * @param n - The number to sum up to
 * @returns The sum of numbers from 1 to n
 * @example sum_to_n_a(5) returns 15
 */
export function sum_to_n_a(n: number): number {
	if (n < 0) throw new Error("n must be non-negative");
	let total = 0;
	for (let i = 1; i <= n; i++) {
		total += i;
	}
	return total;
}

/**
 * Mathematical formula approach: Uses the closed-form formula n*(n+1)/2
 * Time complexity: O(1) - constant time
 * Space complexity: O(1) - constant space
 *
 * Formula derivation:
 * Consider pairing numbers: (1+n), (2+n-1), (3+n-2), ..., up to the middle.
 * Each pair sums to (n+1), and there are floor(n/2) such pairs.
 * If n is odd, the middle number n/2 + 0.5 is left unpaired.
 * Total sum = floor(n/2) * (n+1) + (n % 2) * ceil(n/2)
 *         = (n/2) * (n+1) + (n % 2) * ((n+1)/2)
 *         = n(n+1)/2
 *
 * Alternative proof by induction:
 * Base case: n=1, sum=1, formula=1*2/2=1 ✓
 * Assume true for n=k: sum= k(k+1)/2
 * For n=k+1: sum = k(k+1)/2 + (k+1) = (k+1)(k/2 + 1) = (k+1)(k+2)/2 ✓
 *
 * @param n - The number to sum up to
 * @returns The sum of numbers from 1 to n
 * @example sum_to_n_b(5) returns 15
 */
export function sum_to_n_b(n: number): number {
	if (n < 0) throw new Error("n must be non-negative");
	return (n * (n + 1)) / 2;
}

/**
 * Divide and conquer approach: Recursively splits the sum into smaller subproblems
 * Time complexity: O(log n) - logarithmic due to recursion depth
 * Space complexity: O(log n) - logarithmic due to call stack
 *
 * Algorithm derivation: Finding the recursive formula by algebraic manipulation
 *
 * We want to express sum_to_n in terms of sum_to_m where m = floor(n/2)
 *
 * Case 1: n is even (n = 2m)
 * Case 1: n = 2m (even)
 * sum_to_n = 1 + 2 + ... + 2m
 *          = (1 + 2 + ... + m) + (m+1 + ... + 2m)
 *          = sum_to_m + [(m+1) + (m+2) + ... + (m + m - 1) + (m + m)]
 *          = sum_to_m + [m*m + (1 + 2 + ... + m)]
 *          = sum_to_m + m² + sum_to_m
 *          = 2*sum_to_m + m²
 * ∴ sum_to_n = 2*sum_to_m + m²
 *
 * Case 2: n = 2m+1 (odd)
 * sum_to_n = 1 + 2 + ... + 2m + (2m+1)
 *          = (1 + 2 + ... + 2m) + (2m+1)
 *          = (2*sum_to_m + m²) + (2m+1)
 *          = 2*sum_to_m + m² + 2m + 1
 *          = 2*sum_to_m + (m² + 2m + 1)
 *          = 2*sum_to_m + (m+1)²
 * ∴ sum_to_n = 2*sum_to_m + (m+1)²
 *
 * @param n - The number to sum up to
 * @returns The sum of numbers from 1 to n
 * @example sum_to_n_c(5) returns 15
 */
export function sum_to_n_c(n: number): number {
	if (n < 0) throw new Error("n must be non-negative");
	if (n === 0) return 0;

	const half = Math.floor(n / 2);
	const sumHalf = sum_to_n_c(half);

	if (n % 2 === 1) {
		// Odd case: 2*sum_to_n(half) + (half+1)²
		return 2 * sumHalf + (half + 1) * (half + 1);
	} else {
		// Even case: 2*sum_to_n(half) + half²
		return 2 * sumHalf + half * half;
	}
}
