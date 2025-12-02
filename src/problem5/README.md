# Problem 5: A Crude Server

This is a simple backend server built with Express.js and TypeScript, providing CRUD operations for items stored in a SQLite/PostgreSQL database using TypeORM. The application includes input validation, security middleware, logging, authentication, rate limiting, and comprehensive testing.

## Features

-   ✅ **API Versioning**: RESTful API with v1 endpoints (`/api/v1/*`)
-   ✅ **User Authentication**: JWT-based authentication with bcrypt password hashing, refresh tokens, and token blacklisting
-   ✅ **User Registration**: Register new users with secure password storage
-   ✅ **CRUD Operations**: Create, Read, Update, Delete items with proper validation
-   ✅ **Soft Delete**: Items are marked as deleted instead of being removed from database
-   ✅ **Data Ownership**: Users can only access/modify their own items
-   ✅ **Input Validation**: Comprehensive validation using Zod schemas
-   ✅ **API Throttling**: Redis-backed rate limiting with distributed throttling support
-   ✅ **ORM Integration**: TypeORM for database operations with support for SQLite and PostgreSQL
-   ✅ **Database Migrations**: Automatic schema synchronization
-   ✅ **Security**: Helmet, CORS, global and user-specific rate limiting, and secure headers
-   ✅ **Logging**: Structured logging with Winston and request tracing middleware
-   ✅ **Health Checks**: Enhanced health endpoint with system metrics
-   ✅ **API Documentation**: Interactive Swagger/OpenAPI documentation
-   ✅ **Docker Support**: Containerized deployment with multi-stage build
-   ✅ **CI/CD**: GitHub Actions pipeline for automated testing and building
-   ✅ **Linting**: ESLint for code quality
-   ✅ **Testing**: Jest & Supertest with comprehensive test coverage
-   ✅ **Environment Configuration**: Flexible configuration management
-   ✅ **Compression**: Gzip compression for responses
-   ✅ **Clustering**: Multi-core support with Node.js cluster module
-   ✅ **Monitoring**: Prometheus metrics for observability
-   ✅ **Load Balancing**: Nginx configuration for horizontal scaling
-   ✅ **Kubernetes**: Deployment manifests for cloud-native scaling
-   ✅ **Performance Optimization**: Database indexes and query optimization

## API Versioning

This API uses URI versioning to ensure backward compatibility and smooth transitions between versions.

### Current Version: v1

All endpoints are prefixed with `/api/v1/`.

### Versioning Strategy

-   **URI Versioning**: `/api/v1/resource` - Version is part of the URL path
-   **Backward Compatibility**: New versions maintain compatibility with previous versions where possible
-   **Deprecation Notices**: Deprecated endpoints will be marked in the changelog and documentation
-   **Sunset Policy**: Deprecated versions will be supported for at least 6 months after deprecation

### Future Versions

When introducing breaking changes, a new version (v2, v3, etc.) will be created with:

-   Updated endpoint paths
-   Modified request/response formats
-   New features and improvements

### Migration Guide

To migrate from v1 to future versions:

1. Update client code to use new endpoint paths
2. Handle new response formats
3. Test thoroughly in staging environment
4. Update API documentation references

## API Endpoints

### Authentication

#### POST /api/v1/auth/login

Authenticate user and get JWT token.

**Request Body:**

```json
{
	"username": "admin",
	"password": "password"
}
```

**Response:**

```json
{
	"token": "jwt-token-here",
	"refreshToken": "refresh-token-here",
	"user": {
		"id": 1,
		"username": "admin"
	}
}
```

#### POST /api/v1/auth/register

Register a new user account.

**Request Body:**

```json
{
	"username": "newuser",
	"password": "mypassword"
}
```

**Response:**

```json
{
	"token": "jwt-token-here",
	"refreshToken": "refresh-token-here",
	"user": {
		"id": 2,
		"username": "newuser"
	}
}
```

#### POST /api/v1/auth/logout

Logout user and blacklist the current access token. Requires authentication.

**Response:** 200 OK

```json
{
	"message": "Logged out successfully"
}
```

#### POST /api/v1/auth/refresh

Refresh access token using refresh token.

**Request Body:**

```json
{
	"refreshToken": "refresh-token-here"
}
```

**Response:**

```json
{
	"token": "new-jwt-token-here",
	"refreshToken": "new-refresh-token-here"
}
```

### Items Management

**All item endpoints require authentication and enforce data ownership - users can only access/modify their own items.**

#### POST /api/v1/items

Create a new item. Requires authentication.

**Request Body:**

```json
{
	"name": "Item Name",
	"description": "Optional description"
}
```

**Response:**

```json
{
	"id": 1,
	"name": "Item Name",
	"description": "Optional description",
	"userId": 1,
	"createdAt": "2025-12-02T02:00:00.000Z",
	"updatedAt": "2025-12-02T02:00:00.000Z"
}
```

### GET /api/v1/items

List user's items with optional filters and pagination. Requires authentication.

**Query Parameters:**

-   `name` (optional): Filter by name (partial match)
-   `limit` (optional): Number of items to return (default: 10, max: 100)
-   `offset` (optional): Number of items to skip (default: 0)

**Response:**

```json
[
	{
		"id": 1,
		"name": "Item Name",
		"description": "Optional description",
		"userId": 1,
		"createdAt": "2025-12-02T02:00:00.000Z",
		"updatedAt": "2025-12-02T02:00:00.000Z"
	}
]
```

### GET /api/v1/items/:id

Get details of a specific item. Requires authentication and ownership.

**Response:**

```json
{
	"id": 1,
	"name": "Item Name",
	"description": "Optional description",
	"userId": 1,
	"createdAt": "2025-12-02T02:00:00.000Z",
	"updatedAt": "2025-12-02T02:00:00.000Z"
}
```

### PUT /api/v1/items/:id

Update an existing item. Requires authentication and ownership.

**Request Body:**

```json
{
	"name": "Updated Name",
	"description": "Updated description"
}
```

**Response:**

```json
{
	"id": 1,
	"name": "Updated Name",
	"description": "Updated description",
	"userId": 1,
	"createdAt": "2025-12-02T02:00:00.000Z",
	"updatedAt": "2025-12-02T02:00:00.000Z"
}
```

### DELETE /api/v1/items/:id

Soft delete an item (marks as deleted, doesn't remove from database). Requires authentication and ownership.

**Response:** 204 No Content

## Soft Delete Behavior

This API implements soft delete functionality:

-   Deleted items are marked with a `deleted_at` timestamp instead of being removed from the database
-   All GET operations automatically exclude soft-deleted items
-   Attempting to delete an already deleted item returns 404
-   This preserves data integrity and allows for potential future restoration features

### GET /health

Health check endpoint with system info.

**Response:**

```json
{
	"status": "OK",
	"timestamp": "2025-12-01T12:00:00.000Z",
	"uptime": 123.45,
	"itemsCount": 10,
	"usersCount": 5,
	"database": "SQLite",
	"cache": "in-memory",
	"version": "1.0.0"
}
```

### GET /api-docs

Interactive API documentation powered by Swagger UI.

### GET /metrics

Prometheus metrics endpoint for monitoring and observability.

### GET /cache/stats

Cache statistics endpoint showing hits, misses, and health information.

**Response:**

```json
{
	"stats": {
		"hits": 150,
		"misses": 25,
		"sets": 50,
		"deletes": 5
	},
	"health": {
		"status": "healthy",
		"l1Size": 10,
		"redisConnected": true
	}
}
```

## Setup and Running

1. Install dependencies:

    ```bash
    npm install
    ```

2. Create a `.env` file in the root directory:

    ```env
    PORT=3000
    NODE_ENV=development
    JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
    LOG_LEVEL=info
    USE_REDIS=false
    REDIS_HOST=localhost
    REDIS_PORT=6379
    ```

    **Environment Variables:**

    - `PORT`: Server port (default: 3000)
    - `NODE_ENV`: Environment mode
    - `JWT_SECRET`: Secret key for JWT tokens (change in production!)
    - `LOG_LEVEL`: Logging level (error, warn, info, debug)
    - `DATABASE_URL`: Database connection URL (default: SQLite)
    - `USE_REDIS`: Enable Redis caching (true/false)
    - `REDIS_HOST`: Redis server hostname
    - `REDIS_PORT`: Redis server port
    - `REDIS_PASSWORD`: Redis server password
    - `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds (default: 900000)
    - `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 100)
    - `BCRYPT_ROUNDS`: Bcrypt hashing rounds (default: 12)
    - `CORS_ORIGIN`: CORS allowed origin (default: http://localhost:3000)
    - `SESSION_TIMEOUT`: JWT session timeout in milliseconds (default: 3600000)
    - `REFRESH_TOKEN_EXPIRY`: Refresh token expiry in milliseconds (default: 604800000)
    - `MAX_LOGIN_ATTEMPTS`: Maximum login attempts before lockout (default: 5)
    - `LOCKOUT_DURATION`: Lockout duration in milliseconds (default: 900000)
    - `CACHE_TTL`: Cache TTL in seconds (default: 300)
    - `MAX_ITEMS_PER_PAGE`: Maximum items per page (default: 100)
    - `USE_CLUSTER`: Enable Node.js clustering (true/false)

3. Build the project:

    ```bash
    npm run build
    ```

4. Start the server:

    ```bash
    npm start
    ```

    Or for development (with auto-reload):

    ```bash
    npm run dev
    ```

The server will run on http://localhost:3000.

## Docker

Build and run with Docker:

```bash
docker build -t problem5 .
docker run -p 3000:3000 problem5
```

## Testing

Run the automated test suite with Jest and Supertest:

```bash
npm test
```

For watch mode:

```bash
npm run test:watch
```

The tests cover all CRUD operations, error handling, validation, and edge cases.

### Docker-based E2E Testing

For comprehensive end-to-end testing with full infrastructure (PostgreSQL + Redis), use Docker Compose:

```bash
# Run E2E tests with Docker
npm run test:e2e:docker
```

This command will:

1. Start PostgreSQL and Redis containers
2. Build and start the application container
3. Run the E2E test suite against the containerized application
4. Automatically clean up containers after completion

**Manual Docker E2E Testing:**

```bash
# Start the test infrastructure
docker-compose -f docker-compose.test.yml up -d postgres redis app

# Wait for services to be healthy
docker-compose -f docker-compose.test.yml ps

# Run E2E tests
npm run test:e2e

# Clean up
docker-compose -f docker-compose.test.yml down -v
```

The Docker E2E tests validate the complete user journey including authentication, item CRUD operations, and error handling in a production-like environment.

## Linting

Run ESLint to check code quality:

```bash
npm run lint
```

To auto-fix issues:

```bash
npm run lint:fix
```

## CI/CD

This project uses GitHub Actions for continuous integration. The CI pipeline runs on every push and pull request to the main branch, performing:

-   Dependency installation
-   Linting
-   Automated tests

## Scaling and Production Deployment

### Horizontal Scaling with Clustering

Enable clustering for multi-core utilization:

```bash
USE_CLUSTER=true npm start
```

### Load Balancing with Nginx

Use the provided `nginx.conf` for load balancing across multiple instances:

```bash
nginx -c /path/to/nginx.conf
```

### Kubernetes Deployment

Deploy to Kubernetes using the manifests in `k8s/`:

```bash
kubectl apply -f k8s/deployment.yaml
```

### Monitoring with Prometheus

Metrics are exposed at `/metrics` endpoint. Configure Prometheus to scrape this endpoint.

### Docker Compose Scaling

Scale the application with Docker Compose:

```bash
docker-compose up --scale app=3
```

### Performance Optimizations

-   Database indexes on frequently queried columns
-   Redis caching for hot data
-   Gzip compression for responses
-   Connection pooling for database
-   Health checks for load balancer compatibility
-   **Jest & Supertest**: Testing framework
-   **ESLint**: Code linting
-   **Docker**: Containerization
-   **GitHub Actions**: CI/CD pipeline
-   **dotenv**: Environment configuration
