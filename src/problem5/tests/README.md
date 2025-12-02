# Test Structure

This project uses a well-organized test structure with clear separation of concerns and comprehensive test coverage.

## Test Organization

```
tests/
├── __tests__/                    # Main test directory
│   ├── auth/                     # Authentication tests
│   │   └── auth.test.ts         # User registration and login tests
│   ├── items/                    # Items API tests
│   │   └── items.test.ts        # CRUD operations for items
│   ├── integration/              # Integration tests
│   │   └── user-journey.test.ts  # Full user workflow integration tests
│   ├── authMiddleware.test.ts    # Auth middleware unit tests
│   ├── cache.test.ts             # Cache utility tests
│   ├── errorHandler.test.ts      # Error handler middleware tests
│   ├── rateLimit.test.ts         # Rate limiting middleware tests
│   ├── result.test.ts            # Result utility tests
│   ├── tracing.test.ts           # Tracing middleware tests
│   └── validation.test.ts        # Validation middleware tests
├── utils/                        # Test utilities and helpers
│   └── test-helpers.ts          # Shared test utilities and factories
└── e2e.test.ts                   # End-to-end tests (Docker-based)
```

## Test Types

### Unit Tests (`__tests__/` excluding `integration/`)

-   **Purpose**: Test individual components and functions in isolation
-   **Scope**: Single API endpoints, middleware, utilities
-   **Database**: In-memory database with cleanup between tests
-   **Dependencies**: Minimal mocking, focus on business logic

### Integration Tests (`__tests__/integration/`)

-   **Purpose**: Test component interactions and full workflows
-   **Scope**: Complete user journeys, cross-API interactions
-   **Database**: Real database with proper setup/teardown
-   **Dependencies**: Full application stack

### End-to-End Tests (`e2e.test.ts`)

-   **Purpose**: Test complete application in production-like environment
-   **Scope**: Full application with Docker containers
-   **Database**: PostgreSQL + Redis in containers
-   **Dependencies**: Complete infrastructure

## Test Utilities

### `DatabaseTestHelper`

-   Database setup, teardown, and cleanup
-   Test user/item creation utilities

### `AuthTestHelper`

-   Authentication operations (register, login)
-   Token management

### `ItemsTestHelper`

-   CRUD operations for items
-   Authenticated user context

### `createTestApp()`

-   Configured Express application for testing
-   All middleware and routes properly set up

## Running Tests

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e         # End-to-end tests only

# Run with coverage
npm run test:coverage

# Run Docker E2E tests
npm run test:e2e:docker
```

## Test Scripts

```json
{
	"scripts": {
		"test": "jest",
		"test:watch": "jest --watch",
		"test:coverage": "jest __tests__ --coverage",
		"test:unit": "jest __tests__",
		"test:integration": "jest __tests__/integration",
		"test:e2e": "jest tests/e2e.test.ts --testTimeout=60000",
		"test:e2e:docker": "docker-compose -f docker-compose.test.yml --profile test up --abort-on-container-exit --exit-code-from e2e-tests"
	}
}
```

## Best Practices

### Test Naming

-   Use descriptive test names that explain the behavior being tested
-   Follow the pattern: `should [expected behavior] when [condition]`

### Test Structure

-   Use `describe` blocks to group related tests
-   Use `beforeAll`, `beforeEach`, `afterAll`, `afterEach` for setup/teardown
-   Keep tests independent and isolated

### Assertions

-   Use specific assertions rather than generic ones
-   Test both positive and negative scenarios
-   Verify error responses and edge cases

### Database Testing

-   Always clean up test data between tests
-   Use unique identifiers to avoid conflicts
-   Test database constraints and relationships

### Coverage Goals

-   **Statements**: 80%
-   **Functions**: 80%
-   **Branches**: 70%
-   **Lines**: 80%
