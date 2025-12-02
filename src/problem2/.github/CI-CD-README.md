# CI/CD Pipeline for Problem 2

This directory contains GitHub Actions workflows for automated testing, building, and deployment of the Currency Swap React application.

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Triggers:** Push/PR to main/develop branches affecting `src/problem2/**`

**Jobs:**

-   **test-and-build**: Comprehensive testing and building
    -   Node.js 20 setup with npm caching
    -   Dependency installation
    -   ESLint linting
    -   Unit tests (Vitest)
    -   E2E tests (Playwright)
    -   Production build
    -   Optional bundle analysis
    -   Artifact uploads (build files, test results)

### 2. Deployment Pipeline (`deploy.yml`)

**Triggers:** Push to main branch affecting `src/problem2/**` or manual trigger

**Features:**

-   Automated deployment to GitHub Pages
-   Production build verification
-   Environment-based deployment

### 3. Code Quality Pipeline (`code-quality.yml`)

**Triggers:** Push/PR to main/develop, plus weekly schedule

**Jobs:**

-   **security-scan**: NPM audit for vulnerabilities
-   **code-coverage**: Test coverage reporting to Codecov
-   **performance-check**: Bundle size monitoring

## Setup Requirements

### For GitHub Pages Deployment:

1. Go to repository Settings → Pages
2. Set source to "GitHub Actions"
3. The deployment workflow will handle the rest

### Environment Variables:

Create repository secrets if needed:

-   `CODECOV_TOKEN`: For Codecov integration (optional)

## Local Development Commands

```bash
# Run tests with coverage
npm run test:coverage

# Bundle analysis
npm run analyze-bundle

# E2E tests
npm run test:e2e
```

## Workflow Status Badges

Add these badges to your README:

```markdown
![CI](https://github.com/ngmitam/code-challenge/workflows/CI/CD%20Pipeline/badge.svg?branch=main)
![Code Quality](https://github.com/ngmitam/code-challenge/workflows/Code%20Quality%20Checks/badge.svg?branch=main)
![Deployment](https://github.com/ngmitam/code-challenge/workflows/Deploy%20to%20GitHub%20Pages/badge.svg?branch=main)
```

## Monitoring

-   **Test Results**: Available as artifacts in workflow runs
-   **Coverage Reports**: Uploaded to Codecov
-   **Bundle Analysis**: Check workflow logs for bundle sizes
-   **Security**: NPM audit results in security scan job

## Troubleshooting

### Common Issues:

1. **Tests failing in CI but passing locally**

    - Check Node.js version compatibility
    - Ensure all dependencies are in package-lock.json

2. **Bundle size warnings**

    - Review the bundle analyzer output
    - Consider code splitting or lazy loading

3. **E2E test timeouts**
    - Increase timeout values in playwright.config.ts
    - Check for flaky network requests

### Manual Workflow Triggers:

You can manually trigger the deployment workflow from the Actions tab in GitHub.
