# Pipeline Audit

## lint
- Supposed to run the repository linter first and block bad code from moving forward.
- Currently wrong because it has no `needs:` relationship, so it does not explicitly anchor the pipeline order.
- Fix: keep `lint` as the first job and add downstream `needs: lint` dependencies where the later jobs should be gated by lint.

## unit-tests
- Supposed to run the unit test suite after lint passes.
- Currently wrong because it is independent of lint, so it can run even when lint has already failed.
- Fix: add `needs: lint` so unit tests only start after the code quality gate passes.

## build
- Supposed to create the `dist/` directory for later validation and deployment stages.
- Currently wrong because it does not publish `dist/` as an artifact, so later jobs cannot consume the build output.
- Fix: add `actions/upload-artifact@v4` with the artifact name `app-build` and include `dist/`.

## integration-tests
- Supposed to validate the built application using the generated `dist/api.js` file.
- Currently wrong because it does not download the build artifact, so `dist/api.js` is missing on the runner.
- Fix: add `actions/download-artifact@v4` before the integration test command and use the exact artifact name `app-build`.

## deploy-staging
- Supposed to deploy only after the application has passed the necessary verification steps.
- Currently wrong because it has no `needs:` chain and no branch condition, so it can run too early and on any branch.
- Fix: add `needs: [unit-tests, integration-tests]` and gate it with `if: github.ref == 'refs/heads/main'`.

## deploy-production
- Supposed to promote the verified staging release to production on the main branch only.
- Currently wrong because it has no `needs:` dependency and no branch restriction, so it is effectively unconditional.
- Fix: add `needs: deploy-staging` and the same `main` branch `if:` condition.

## notify
- Supposed to report the final pipeline outcome whether the workflow succeeds or fails.
- Currently wrong because it lacks `if: always()`, so it can be skipped when an earlier job fails.
- Fix: add `if: always()` and make it depend on the pipeline jobs so it runs after the workflow has finished.