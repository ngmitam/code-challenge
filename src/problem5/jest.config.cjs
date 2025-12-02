module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	maxWorkers: 1, // Run tests serially to avoid database conflicts
	roots: ["<rootDir>/src", "<rootDir>/tests"],
	testMatch: [
		"**/__tests__/**/*.test.ts",
		"**/__tests__/**/*.spec.ts",
		"**/e2e.test.ts",
	],
	collectCoverageFrom: [
		"src/**/*.ts",
		"!src/index.ts", // Exclude entry point
		"!src/**/*.d.ts", // Exclude type definitions
	],
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov", "html"],
	coverageThreshold: {
		global: {
			branches: 70,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},
	// Ensure clean test runs
	forceExit: true,
	detectOpenHandles: true,
	testTimeout: 10000,
};
