# Pipeline Audit

The original workflow defined all six jobs independently. Because GitHub Actions
runs independent jobs concurrently, the workflow did not express the delivery
graph required by the service.

## `lint`

- **Purpose:** Install dependencies and check the source with ESLint.
- **Current issue:** It had no timeout and no downstream dependency contract, so
  later jobs could start even when lint failed.
- **Fix:** Set a 10-minute timeout and make unit tests and build depend on
  `lint`.

## `unit-tests`

- **Purpose:** Run the unit test suite for the API.
- **Current issue:** It ran in parallel with lint, so a unit-test result could
  appear successful even when the quality gate failed. It also had no timeout.
- **Fix:** Add `needs: lint` and a 15-minute timeout. It remains parallel with
  build after lint completes.

## `build`

- **Purpose:** Create the deployable `dist/` output.
- **Current issue:** It ran before lint and had no timeout. More importantly, it
  created `dist/` only on its own runner; the directory was discarded when the
  job ended because no artifact was uploaded.
- **Fix:** Add `needs: lint`, a 20-minute timeout, and upload `dist/` as the
  `app-build` artifact.

## `integration-tests`

- **Purpose:** Verify the built application output.
- **Current issue:** It ran without waiting for build and tried to test `dist/`
  on a fresh runner where that directory did not exist. It also had no timeout.
- **Fix:** Add `needs: build`, download the matching `app-build` artifact into
  `dist/`, and use a 30-minute timeout before running the tests.

## `deploy-staging`

- **Purpose:** Deploy a validated build to the staging environment.
- **Current issue:** It ran on every branch and did not wait for unit or
  integration tests. It also had no timeout.
- **Fix:** Add `needs: [unit-tests, integration-tests]`, restrict execution to
  `refs/heads/main`, and set a 15-minute timeout.

## `deploy-production`

- **Purpose:** Release the staged, validated build to production.
- **Current issue:** It ran on every push, including feature branches, without
  waiting for staging or any validation. It also had no timeout.
- **Fix:** Add `needs: deploy-staging`, restrict execution to
  `refs/heads/main`, and set a 15-minute timeout. The dependency also prevents
  production from running when staging fails or is skipped.

## `notify`

- **Purpose:** Report the final pipeline outcome.
- **Current issue:** Without `if: always()`, GitHub Actions skipped this job when
  an upstream job failed or was skipped, so failures produced no notification.
  It also had no timeout.
- **Fix:** Make it depend on all pipeline jobs, use `if: always()`, and set a
  15-minute timeout so it observes success, failure, and skipped deployment
  outcomes.
