# Pipeline Audit

This document records the original workflow failures and the fixes applied in
`pipeline.yml`.

## 1. `lint`

- **Purpose**: Runs static code analysis (via ESLint) to catch syntax and styling issues before they are merged.
- **Configuration Issue**: The original workflow had no timeout and did not
  establish linting as the first validation gate.
- **Correct Fix**: Add a 10-minute timeout, then make unit tests and build
  depend on lint. Because this project uses legacy `.eslintrc.json` with its
  ESLint version, set `ESLINT_USE_FLAT_CONFIG: 'false'` on the lint command.

## 2. `unit-tests`

- **Purpose**: Executes unit tests (via Jest) to ensure individual functions and components of the application behave correctly.
- **Configuration Issue**: The original job ran in parallel with lint, had no
  timeout, and could not serve as a reliable validation gate.
- **Correct Fix**: Add `needs: lint` and a 15-minute timeout. It then runs in
  parallel with build after lint succeeds.

## 3. `build`

- **Purpose**: Compiles and packages the application source code into a distributable format (e.g., outputting to the `dist/` directory).
- **Configuration Issue**: The original job had no lint dependency or timeout.
  Its `dist/` output was also destroyed with the runner because it was never
  uploaded, so later jobs could not use it.
- **Correct Fix**: Add `needs: lint`, a 20-minute timeout, and upload `dist/`
  as `app-build` with `actions/upload-artifact@v4`.

## 4. `integration-tests`

- **Purpose**: Tests the compiled application as a whole to ensure different parts of the system integrate and work together correctly.
- **Configuration Issue**: The original job ran before build completed and had
  no artifact download, so its fresh runner had no `dist/` directory. It also
  had no timeout.
- **Correct Fix**: Add `needs: build`, download the exact `app-build` artifact
  before testing, and set a 30-minute timeout.

## 5. `deploy-staging`

- **Purpose**: Deploys the built application to a staging environment for pre-production testing and review.
- **Configuration Issue**: The original job ran on every branch, did not wait
  for both unit and integration tests, and had no timeout.
- **Correct Fix**: Add `needs: [unit-tests, integration-tests]`, guard it with
  `if: github.ref == 'refs/heads/main'`, and set a 15-minute timeout.

## 6. `deploy-production`

- **Purpose**: Deploys the application to the live production environment for end users.
- **Configuration Issue**: The original job ran on every push, including
  feature branches, had no staging dependency, and had no timeout.
- **Correct Fix**: Add `needs: deploy-staging`, guard it with
  `if: github.ref == 'refs/heads/main'`, and set a 15-minute timeout.

## 7. `notify`

- **Purpose**: Sends a notification (e.g., to Slack or Email) with the final status of the pipeline execution.
- **Configuration Issue**: The original job had no complete dependency list,
  no `always()` condition, and no timeout. It could run too early or be skipped
  when an upstream job failed.
- **Correct Fix**: Add `needs: [lint, unit-tests, build, integration-tests,
deploy-staging, deploy-production]`, add `if: always()`, and set a
  15-minute timeout so it reports every pipeline outcome.
