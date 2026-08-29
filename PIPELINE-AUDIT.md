# Pipeline Audit

## lint

- **Purpose:** Install dependencies and run ESLint.
- **Issue:** The job had no timeout, and ESLint 10 could not find a flat configuration file.
- **Fix:** Add a 10-minute timeout and `eslint.config.js`.

## unit-tests

- **Purpose:** Run the unit test suite.
- **Issue:** It could run before lint and had no timeout.
- **Fix:** Add `needs: lint` and a 15-minute timeout.

## build

- **Purpose:** Create the application output in `dist/`.
- **Issue:** It had no sequencing, timeout, or artifact upload.
- **Fix:** Depend on lint, use a 20-minute timeout, and upload `dist/` as `app-build`.

## integration-tests

- **Purpose:** Test the built application.
- **Issue:** The job ran on a separate runner without the build output.
- **Fix:** Depend on build, download `app-build` into `dist/`, and use a 30-minute timeout.

## deploy-staging

- **Purpose:** Deploy tested code to staging.
- **Issue:** It could run on any branch and did not require both test jobs.
- **Fix:** Require `unit-tests` and `integration-tests`, restrict execution to `main`, and use a 15-minute timeout.

## deploy-production

- **Purpose:** Deploy staging-approved code to production.
- **Issue:** It did not depend on staging and was not restricted to `main`.
- **Fix:** Require `deploy-staging`, restrict execution to `main`, and use a 15-minute timeout.

## notify

- **Purpose:** Report the pipeline result.
- **Issue:** It could be skipped when an upstream job failed.
- **Fix:** Add `if: always()`, depend on all pipeline jobs, and set a timeout.
