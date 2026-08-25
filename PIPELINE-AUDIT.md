# Pipeline Audit

This document outlines the purpose, configuration issues, and recommended fixes for each job in the `pipeline.yml` workflow.

## 1. `lint`
- **Purpose**: Runs static code analysis (via ESLint) to catch syntax and styling issues before they are merged.
- **Configuration Issue**: The job fails because ESLint v9+ looks for a flat config file (`eslint.config.js`) by default, but the project uses a legacy `.eslintrc.json` file.
- **Correct Fix**: Add the environment variable `ESLINT_USE_FLAT_CONFIG: "false"` to the lint step so ESLint knows to use the legacy configuration format, or migrate the configuration file to the new format.

## 2. `unit-tests`
- **Purpose**: Executes unit tests (via Jest) to ensure individual functions and components of the application behave correctly.
- **Configuration Issue**: The job lacks a `needs` dependency on the `lint` job. By running in parallel, it consumes CI runners even if basic code quality checks fail.
- **Correct Fix**: Add `needs: lint` to the job configuration so it only runs if the codebase passes linting.

## 3. `build`
- **Purpose**: Compiles and packages the application source code into a distributable format (e.g., outputting to the `dist/` directory).
- **Configuration Issue**: The job lacks an artifact upload step (Problem 4). The `dist/` directory created by the build is destroyed when the runner spins down and cannot be passed to subsequent jobs. Additionally, it lacks a `needs: unit-tests` dependency.
- **Correct Fix**: Add a `needs: unit-tests` dependency, and add an `actions/upload-artifact` step at the end of the job to save the `dist/` folder.

## 4. `integration-tests`
- **Purpose**: Tests the compiled application as a whole to ensure different parts of the system integrate and work together correctly.
- **Configuration Issue**: The job is missing a `needs: build` dependency, causing it to run prematurely in parallel with the build. It also lacks an artifact download step (Problem 2), so it cannot access the `dist/` directory required for testing.
- **Correct Fix**: Add `needs: build` to ensure proper execution order, and add an `actions/download-artifact` step before the test script to retrieve the `dist/` folder.

## 5. `deploy-staging`
- **Purpose**: Deploys the built application to a staging environment for pre-production testing and review.
- **Configuration Issue**: The job runs on every single branch push because it lacks an `if` condition (Problem 3). It also lacks a `needs: integration-tests` dependency, meaning it attempts deployment before testing is completed.
- **Correct Fix**: Add `needs: integration-tests` and add the condition `if: github.ref == 'refs/heads/main'` so that staging deployments only occur on the main branch after successful integration testing.

## 6. `deploy-production`
- **Purpose**: Deploys the application to the live production environment for end users.
- **Configuration Issue**: The job lacks a `needs: deploy-staging` dependency, causing it to run concurrently with (or even before) the staging deployment. It also lacks branch restrictions.
- **Correct Fix**: Add `needs: deploy-staging` to ensure it only deploys after a successful staging rollout, and ideally add an `environment` tag to require manual approval before production deployment.

## 7. `notify`
- **Purpose**: Sends a notification (e.g., to Slack or Email) with the final status of the pipeline execution.
- **Configuration Issue**: The job lacks a `needs` array specifying all previous jobs, causing it to run immediately at the start of the pipeline. Furthermore, it lacks an `if: always()` condition (Problem 6), meaning it will be skipped entirely if any previous job fails (which is when notifications are most critical).
- **Correct Fix**: Add `needs: [lint, unit-tests, build, integration-tests, deploy-staging, deploy-production]` and add `if: always()` to ensure it waits for all jobs to finish and executes regardless of their success or failure status.
