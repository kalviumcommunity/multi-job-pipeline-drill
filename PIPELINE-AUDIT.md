# Pipeline Audit Report

This document details the audit of the CI/CD workflow defined in `.github/workflows/pipeline.yml`. It outlines what each job is intended to accomplish, the configuration issues identified in the initial setup, and the required fixes.

---

## 1. `lint` Job

* **Intended Purpose**: Run static code analysis (`eslint src/`) across the codebase to ensure code quality and style standards are met before executing subsequent build and test jobs.
* **Identified Issues**:
  * **Missing Job Timeout**: No `timeout-minutes` was configured, risking hanging or exhausting runner minutes if the linter gets stuck.
  * **ESLint Configuration Incompatibility**: ESLint v10 requires a flat configuration (`eslint.config.js`) instead of legacy `.eslintrc.json`, causing the lint step to fail when executed.
* **Correct Fix**:
  * Create `eslint.config.js` with proper rules and parser options for ESLint v9/v10 flat configuration support.
  * Add `timeout-minutes: 10` to the job definition.

---

## 2. `unit-tests` Job

* **Intended Purpose**: Execute unit test suites (`npm test` via Jest) in parallel with the `build` job after linting completes successfully.
* **Identified Issues**:
  * **Missing Dependency (`needs`)**: Lacked `needs: [lint]`, causing unit tests to run immediately on workflow start concurrently with `lint`, wasting compute resources if linting fails.
  * **Missing Job Timeout**: No `timeout-minutes` was specified.
* **Correct Fix**:
  * Add a `needs: [lint]` dependency with explanatory comment.
  * Add `timeout-minutes: 15`.

---

## 3. `build` Job

* **Intended Purpose**: Compile/package the application into the `dist/` directory and upload it as a build artifact for downstream testing and deployment jobs.
* **Identified Issues**:
  * **Missing Dependency (`needs`)**: Did not declare `needs: [lint]`, running concurrently with linting.
  * **Missing Artifact Upload**: Did not use `actions/upload-artifact` to persist the generated `dist/` directory, so build outputs were lost when the runner terminated.
  * **Missing Job Timeout**: No `timeout-minutes` was specified.
* **Correct Fix**:
  * Add `needs: [lint]` with an explanatory comment.
  * Add `actions/upload-artifact@v4` step uploading `dist/` as `app-build`.
  * Add `timeout-minutes: 20`.

---

## 4. `integration-tests` Job

* **Intended Purpose**: Run integration test suites (`npm run test:integration`) that validate the compiled distribution files in `dist/`.
* **Identified Issues**:
  * **Missing Dependency (`needs`)**: Did not declare `needs: [build]`, executing before the build job finished.
  * **Missing Artifact Download**: Did not retrieve the `app-build` artifact using `actions/download-artifact`, causing `dist/api.js` check to fail with `Build output not found`.
  * **Missing Job Timeout**: No `timeout-minutes` was specified.
* **Correct Fix**:
  * Add `needs: [build]` with an explanatory comment.
  * Add `actions/download-artifact@v4` step to download `app-build` into the `dist` directory prior to running integration tests.
  * Add `timeout-minutes: 30`.

---

## 5. `deploy-staging` Job

* **Intended Purpose**: Deploy the application to the staging environment only after all unit tests and integration tests pass, restricted to the `main` branch.
* **Identified Issues**:
  * **Missing Dependencies (`needs`)**: Did not specify `needs: [unit-tests, integration-tests]`, attempting to deploy before verification completed.
  * **Missing Branch Condition**: Ran on all branches and pull requests because it lacked an `if: github.ref == 'refs/heads/main'` conditional.
  * **Missing Job Timeout**: No `timeout-minutes` was specified.
* **Correct Fix**:
  * Add `needs: [unit-tests, integration-tests]` with an explanatory comment.
  * Add `if: github.ref == 'refs/heads/main'` to restrict execution to the `main` branch.
  * Add `timeout-minutes: 15`.

---

## 6. `deploy-production` Job

* **Intended Purpose**: Deploy the application to production after staging deployment succeeds, strictly restricted to the `main` branch.
* **Identified Issues**:
  * **Missing Dependency (`needs`)**: Did not declare `needs: [deploy-staging]`, running prematurely in parallel with other jobs.
  * **Missing Branch Condition**: Lacked an `if: github.ref == 'refs/heads/main'` branch condition.
  * **Missing Job Timeout**: No `timeout-minutes` was specified.
* **Correct Fix**:
  * Add `needs: [deploy-staging]` with an explanatory comment.
  * Add `if: github.ref == 'refs/heads/main'` condition.
  * Add `timeout-minutes: 15`.

---

## 7. `notify` Job

* **Intended Purpose**: Report workflow completion status regardless of whether the pipeline succeeded, failed, or had skipped steps.
* **Identified Issues**:
  * **Missing Dependencies (`needs`)**: Did not specify all upstream jobs in `needs`, causing notification to fire at the very start rather than after pipeline completion.
  * **Missing Conditional Handling**: Did not include `if: always()`, causing the job to be skipped if any upstream job failed.
  * **Missing Job Timeout**: No `timeout-minutes` was specified.
* **Correct Fix**:
  * Add `needs: [lint, unit-tests, build, integration-tests, deploy-staging, deploy-production]`.
  * Add `if: always()` condition to guarantee execution regardless of pipeline outcome.
  * Add `timeout-minutes: 10`.
