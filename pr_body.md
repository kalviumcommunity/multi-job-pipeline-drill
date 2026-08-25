# Pipeline Orchestration Fixes

This PR resolves multiple job sequencing and configuration issues identified during the pipeline audit.

## Audit Findings
From `PIPELINE-AUDIT.md`:
1. **lint**: Fails due to ESLint configuration format mismatch. Fix: Add `ESLINT_USE_FLAT_CONFIG: "false"`.
2. **unit-tests**: Lacks dependency on lint. Fix: Add `needs: lint`.
3. **build**: Missing artifact upload and `needs: unit-tests`. Fix: Add `upload-artifact` and `needs: lint`. 
4. **integration-tests**: Missing dependency on build and artifact download. Fix: Add `needs: build` and `download-artifact`.
5. **deploy-staging**: Missing dependency on tests and branch restriction. Fix: Add `needs: [unit-tests, integration-tests]` and `if: github.ref == 'refs/heads/main'`.
6. **deploy-production**: Missing dependency on staging. Fix: Add `needs: deploy-staging` and branch restriction.
7. **notify**: Missing dependencies and always-run condition. Fix: Add `needs: [all]` and `if: always()`.

## Tasks Completed
* **Task 2**: Added correct `needs:` declarations to every job to ensure lint runs first, unit-tests and build run in parallel, integration-tests run after build, deploy-staging runs after tests, deploy-production runs after staging, and notify runs last.
* **Task 3**: Added `actions/upload-artifact@v4` in the `build` job to upload `dist/` as `app-build`, and `actions/download-artifact@v4` in `integration-tests` to retrieve it.
* **Task 4**: Added `if: github.ref == 'refs/heads/main'` conditions for deploy jobs. Added `if: always()` for the `notify` job. Added `timeout-minutes:` to every job to prevent hanging runs.

## Verification
The complete pipeline run shows all job statuses executing correctly according to the dependency graph.

**Screenshot of the complete pipeline run:**
[Screenshot](/pipeline-run-screenshot.png)
