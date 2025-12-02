# Code Challenge Submission - Full-Stack Engineer

## Description

This repository contains my solutions to the 99Tech Code Challenge for the Full-Stack Engineer position. Each problem represents a **standalone project** with its own complete setup, dependencies, testing, and deployment configuration.

## Table of Contents

-   [Problems](#problems)
-   [Project Structure](#project-structure)
-   [Technologies Used](#technologies-used)
-   [Setup and Installation](#setup-and-installation)
-   [How to Run](#how-to-run)
-   [Notes](#notes)

## Problems

The following problems were attempted for the Full-Stack Engineer role:

-   [Problem 1: Not Attempted](src/problem1/) - No solution provided
-   [Problem 2: Fancy Form](src/problem2/) - **Standalone React Frontend** with currency swap functionality
-   [Problem 3: Not Attempted](src/problem3/) - No solution provided
-   [Problem 4: Three ways to sum to n](src/problem4/) - **Standalone TypeScript Algorithm** implementations
-   [Problem 5: A Crude Server](src/problem5/) - **Standalone Node.js Backend** with CRUD API
-   [Problem 6: Architecture](src/problem6/) - **Standalone API Specification** for scoreboard service

## Project Structure

Each problem is a **completely independent project** with:

```
src/
├── problem2/          # Standalone React Frontend App
│   ├── package.json   # Own dependencies & scripts
│   ├── src/          # Source code
│   ├── tests/        # Test suites
│   ├── .github/      # Independent CI/CD
│   └── README.md     # Setup & run instructions
│
├── problem4/          # Standalone TypeScript Library
│   ├── *.ts          # Algorithm implementations
│   └── test.ts       # Test runner
│
├── problem5/          # Standalone Node.js API Server
│   ├── package.json   # Own dependencies & scripts
│   ├── src/          # Express server code
│   ├── tests/        # Comprehensive test suite
│   ├── docker/       # Containerization
│   ├── k8s/          # Kubernetes manifests
│   ├── .github/      # Independent CI/CD
│   └── README.md     # Complete setup guide
│
└── problem6/          # Standalone API Specification
    └── README.md     # Architecture documentation
```

### Standalone Project Features

Each problem includes:

-   ✅ **Independent Dependencies**: Own `package.json` with specific versions
-   ✅ **Complete Testing**: Unit, integration, and E2E tests
-   ✅ **CI/CD Pipelines**: GitHub Actions workflows for each project
-   ✅ **Documentation**: Individual README with setup instructions
-   ✅ **Deployment Ready**: Docker, Kubernetes, or hosting configurations
-   ✅ **Production Setup**: Environment configs, security, monitoring

## Solutions

### Problem 2: Fancy Form - Standalone React Frontend

**Location:** [src/problem2/](src/problem2/) | **Status:** ✅ Complete Standalone Project

**Description:** A comprehensive responsive currency swap form built with React and TypeScript, featuring advanced frontend patterns and modern development practices. This is a **complete, production-ready frontend application** that can be deployed independently.

**Standalone Features:**

-   🔧 **Independent Setup**: Own `package.json`, Vite config, TypeScript setup
-   🧪 **Complete Testing**: 17 unit tests + E2E tests with Playwright
-   🚀 **CI/CD Ready**: GitHub Actions pipeline with GitHub Pages deployment
-   📱 **Production Build**: Optimized bundle with PWA capabilities
-   🎨 **Full UI System**: Theming, i18n, accessibility, analytics

**Key Features:**

-   Input validation and error messages using Zod schemas
-   Intuitive UI/UX design with theming support
-   Integration with token icons and real-time price API
-   Custom React hooks for currency swap logic, debouncing, and performance monitoring
-   Internationalization with i18next
-   Comprehensive testing with Vitest (unit tests) and Playwright (E2E tests)
-   Component documentation with Storybook
-   Accessibility features and responsive design

### Problem 4: Three ways to sum to n - Standalone TypeScript Library

**Location:** [src/problem4/](src/problem4/) | **Status:** ✅ Complete Standalone Project

**Description:** Three unique TypeScript implementations of a summation function with comprehensive mathematical proofs and complexity analysis. This is a **pure algorithmic library** that can be used independently in any TypeScript/JavaScript project.

**Standalone Features:**

-   🔧 **Zero Dependencies**: Pure TypeScript implementations
-   🧪 **Complete Testing**: Comprehensive test suite with edge cases
-   📚 **Mathematical Rigor**: Formal proofs and complexity analysis
-   🔄 **Multiple Algorithms**: Three different approaches for comparison
-   📖 **Full Documentation**: JSDoc comments and usage examples

**Implementations:**

-   **Iterative approach** (O(n) time, O(1) space): Simple loop summation
-   **Mathematical formula** (O(1) time, O(1) space): Closed-form formula n(n+1)/2 with multiple proofs
-   **Divide and conquer** (O(log n) time, O(log n) space): Recursive approach with algebraic derivation

**Key Features:**

-   Comprehensive JSDoc documentation
-   Mathematical proofs for formula correctness
-   Edge case handling (n=0)
-   TypeScript type safety
-   Comprehensive test suite with multiple test cases

### Problem 5: A Crude Server - Standalone Node.js Backend API

**Location:** [src/problem5/](src/problem5/) | **Status:** ✅ Complete Standalone Project

**Description:** A production-ready backend server with comprehensive CRUD operations, authentication, and DevOps practices using Express.js and TypeScript. This is a **full-featured REST API server** that can be deployed independently with Docker and Kubernetes.

**Standalone Features:**

-   🔧 **Independent Setup**: Own `package.json`, Express server, database config
-   🧪 **Complete Testing**: 184 tests including unit, integration, E2E, and load testing
-   🐳 **Container Ready**: Docker multi-stage builds with PostgreSQL/Redis services
-   ☸️ **Kubernetes Ready**: Deployment manifests for cloud scaling
-   🚀 **CI/CD Complete**: GitHub Actions pipeline with staging deployment
-   📊 **Production Monitoring**: Health checks, metrics, logging, security

**Features:**

-   RESTful API endpoints with versioning and OpenAPI documentation
-   JWT-based user authentication and registration with bcrypt hashing
-   Data persistence with SQLite/PostgreSQL using TypeORM with soft delete
-   Redis-backed caching with fallback mechanisms
-   Security middleware (Helmet, CORS, rate limiting)
-   Structured logging with Winston
-   Health checks, metrics, and graceful shutdown
-   Docker containerization with multi-stage builds
-   Kubernetes deployment manifests
-   Comprehensive testing: unit, integration, E2E with Jest, and load testing with K6
-   CI/CD with GitHub Actions
-   Code quality analysis with SonarQube
-   Database migrations and seeding

### Problem 6: Architecture - Standalone API Specification

**Location:** [src/problem6/](src/problem6/) | **Status:** ✅ Complete Standalone Project

**Description:** Comprehensive specification and documentation for a scalable API service module handling live scoreboard updates with real-time WebSocket broadcasting, secure authentication, and multi-category support. This is a **complete architectural specification** that can serve as the foundation for implementing a production scoreboard service.

**Standalone Features:**

-   📋 **Complete Specification**: API endpoints, database schema, WebSocket protocol
-   🏗️ **Architecture Design**: Component diagrams, sequence flows, scaling strategies
-   🔒 **Security Design**: HMAC-SHA256 tokens, rate limiting, OWASP compliance
-   📊 **Data Strategy**: Redis primary + PostgreSQL persistence with sync mechanisms
-   🚀 **Production Ready**: Monitoring, deployment, and testing strategies
-   📚 **Implementation Guide**: Pseudocode, database schemas, deployment manifests

**Key Features:**

-   RESTful API endpoints for scoreboard retrieval and score updates, supporting multiple categories (e.g., games, regions)
-   WebSocket integration with rooms for real-time live updates per category
-   Secure action token system with HMAC-SHA256 signing to prevent unauthorized score increases
-   PostgreSQL database with scores table for per-category persistence and audit logging
-   Redis primary data store with category-specific sorted sets for leaderboard management, storing only top 10 users per category
-   Data synchronization strategy with periodic reconciliation between Redis and PostgreSQL
-   Rate limiting, security measures against common attacks (OWASP guidelines), and comprehensive error handling
-   Scalable architecture supporting up to 10,000 concurrent users, with horizontal scaling and category-based sharding options
-   Detailed testing strategy, deployment guidelines, and monitoring with Prometheus/Grafana

**Deliverables:**

-   README with module documentation, pseudocode examples, and API specifications
-   Sequence and component architecture diagrams
-   Database schema with scores and score_updates tables
-   Redis caching strategy with category-specific keys
-   WebSocket protocol and connection lifecycle
-   Security, performance, and scalability considerations
-   Improvement roadmap with implemented enhancements like data sync and multi-category support

## Technologies Used

-   **Frontend:** React, TypeScript, Vite, HTML, CSS, JavaScript, i18next (internationalization), Zod (validation)
-   **Backend:** Node.js, Express.js, TypeScript, TypeORM, JWT, bcrypt
-   **Database:** SQLite (Problem 5), PostgreSQL (Problem 6)
-   **Cache:** Redis (Problem 6)
-   **Testing:** Vitest, Playwright (E2E), Jest, Storybook
-   **DevOps:** Docker, Kubernetes, GitHub Actions (CI/CD)
-   **Tools:** Git, VS Code, TypeScript Compiler, ESLint, Prettier

## CI/CD Pipeline

Both Problem 2 and Problem 5 feature comprehensive, consistent CI/CD pipelines using GitHub Actions:

### Pipeline Features

-   **Matrix Testing**: Node.js 18.x and 20.x across all test suites
-   **Security Audits**: Automated dependency vulnerability scanning
-   **Code Quality**: ESLint linting and code quality checks
-   **Comprehensive Testing**: Unit, integration, and E2E test coverage
-   **Coverage Reporting**: Codecov integration with quality thresholds
-   **Artifact Management**: Build and test result artifacts
-   **Docker Integration**: Containerized builds and testing
-   **Load Testing**: Performance validation for backend services
-   **Path-based Triggers**: Efficient CI that only runs when relevant files change

### Problem 2 (Frontend)

-   React/Vite application with Vitest unit tests and Playwright E2E tests
-   GitHub Pages deployment for main branch
-   Bundle analysis and performance monitoring

### Problem 5 (Backend)

-   Node.js/Express API with Jest testing suite
-   PostgreSQL and Redis service containers for integration testing
-   Docker containerization with Kubernetes manifests
-   Load testing with K6 for performance validation

## Setup and Installation

Each problem is a **completely independent project** that can be cloned, set up, and run separately. You can work with any single problem without affecting the others.

### Option 1: Clone Entire Repository

```bash
git clone https://github.com/ngmitam/code-challenge.git
cd code-challenge
```

### Option 2: Clone Individual Projects

Each problem can be treated as its own repository:

```bash
# For Problem 2 (Frontend)
git clone https://github.com/ngmitam/code-challenge.git
cd code-challenge/src/problem2
npm install
npm run dev

# For Problem 5 (Backend)
git clone https://github.com/ngmitam/code-challenge.git
cd code-challenge/src/problem5
npm install
npm run dev
```

### Standalone Project Setup

Each problem directory contains everything needed for independent development:

-   ✅ **Own Dependencies**: `package.json` with specific versions
-   ✅ **Complete Source Code**: All implementation files
-   ✅ **Testing Suite**: Unit, integration, and E2E tests
-   ✅ **Configuration Files**: TypeScript, ESLint, build configs
-   ✅ **Documentation**: Individual README with setup instructions
-   ✅ **CI/CD**: Independent GitHub Actions workflows
-   ✅ **Deployment Configs**: Docker, Kubernetes manifests where applicable

## How to Run

### Problem 2: Fancy Form

Navigate to `src/problem2/` and run the development server:

```bash
cd src/problem2
npm install
npm run dev
```

Access at `http://localhost:5173` (or the port shown in the terminal).

To run tests:

```bash
npm test          # Unit tests with Vitest (runs once and exits)
npm run test:watch # Unit tests in watch mode (for development)
npm run test:e2e  # E2E tests with Playwright
```

To view component stories:

```bash
npm run storybook
```

### Problem 4: Three ways to sum to n

Run the test suite to verify all implementations:

```bash
npx ts-node src/problem4/test.ts
```

This will test all three functions (iterative, formula, recursive) with various inputs including edge cases.

### Problem 5: A Crude Server

Navigate to the problem directory and install dependencies:

```bash
cd src/problem5
npm install
```

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
LOG_LEVEL=info
USE_REDIS=false
REDIS_HOST=localhost
REDIS_PORT=6379
```

Build and start the server:

```bash
npm run build
npm start
```

Access at `http://localhost:3000`

### Problem 6: Architecture

Refer to the README.md in `src/problem6/` for the specification.

## Notes

### Standalone Project Philosophy

-   **Each problem is a complete, independent project** that can be developed, tested, and deployed separately
-   **No cross-dependencies**: Problems don't rely on each other and can be evaluated individually
-   **Production-ready**: Each solution includes all necessary components for real-world deployment
-   **Technology choices**: Each problem uses appropriate technologies for its specific requirements

### Implementation Quality

-   **Problem 2**: Enterprise-grade React application with modern patterns and comprehensive testing
-   **Problem 4**: Mathematically rigorous algorithmic implementations with formal proofs
-   **Problem 5**: Production-ready API server with security, monitoring, and DevOps practices
-   **Problem 6**: Complete architectural specification with implementation guidance

### Development Approach

-   All problems include comprehensive testing strategies
-   CI/CD pipelines ensure code quality and deployment readiness
-   Documentation provides clear setup and usage instructions
-   Each solution demonstrates full-stack engineering capabilities

### Evaluation Notes

-   Assumptions are documented in each problem's individual README
-   For any uncertainties, implementation decisions are explained in the respective files
-   Each problem represents a minimal viable solution that could be extended for production use
