# Pipeline Audit

Baseline CI run (before fixes): PASTE YOUR BASELINE RUN LINK HERE

## lint
- Supposed to do: Run static analysis / style checks on the codebase first, before anything downstream spends CI minutes on code that doesn't meet basic standards.
- What's wrong: No needs:, so it runs in parallel with every other job instead of gating them - unit-tests, build, and even the deploy jobs can start (and finish) before we know if lint even passes. No timeout-minutes:, so a hung linter could run indefinitely.
- Fix: No needs: required since it's first in the chain, but add timeout-minutes: 10.

## unit-tests
- Supposed to do: Run fast unit tests against the source, once we know the code passes lint.
- What's wrong: No needs:, so it can start before lint finishes, meaning we might burn CI minutes testing code that fails style checks anyway. No timeout configured.
- Fix: Add needs: [lint] and timeout-minutes: 15.

## build
- Supposed to do: Compile the app into dist/, which integration-tests and both deploy jobs depend on.
- What's wrong (Problem 4, per the repo's own comment): No upload-artifact step - dist/ is produced on this job's runner and then discarded the moment the job ends, since it never leaves the machine. Also runs with no needs:, so it isn't gated on lint passing. No timeout.
- Fix: Add needs: [lint], timeout-minutes: 20, and an actions/upload-artifact@v4 step named app-build uploading dist/.

## integration-tests
- Supposed to do: Run tests against the actual compiled build, after unit-level correctness is confirmed.
- What's wrong (Problem 2, per the repo's own comment): No download-artifact step, so dist/ simply does not exist on this job's runner - GitHub Actions jobs run on separate, isolated machines with no shared filesystem. It also has no needs: [build], so it could start before build even finishes. No timeout.
- Fix: Add needs: [build], timeout-minutes: 30, and an actions/download-artifact@v4 step pulling the app-build artifact into dist/ before npm run test:integration runs.

## deploy-staging
- Supposed to do: Deploy the validated build to staging, only once both unit and integration tests pass, and only for code destined for production (main).
- What's wrong (Problem 3, per the repo's own comment): No if: condition - it runs on every push to every branch, meaning half-finished feature work can land in staging. It also has no needs: at all, so it isn't waiting on test results before deploying.
- Fix: Add needs: [unit-tests, integration-tests], if: github.ref == 'refs/heads/main', and timeout-minutes: 15.

## deploy-production
- Supposed to do: Ship to production, only after staging has been validated and only from main.
- What's wrong: This is the most dangerous bug in the whole pipeline - no needs: and no if: branch gate at all, so it fires on every single push, including feature branches. Unreviewed, unvalidated feature-branch code could be deployed straight to production.
- Fix: Add needs: [deploy-staging], if: github.ref == 'refs/heads/main', and timeout-minutes: 15.

## notify
- Supposed to do: Report the final pipeline outcome regardless of what failed, so the team always has a trustworthy final signal.
- What's wrong (Problem 6, per the repo's own comment): No if: always() - if any upstream job fails, notify is skipped along with it, meaning the team gets silence instead of a failure notification exactly when they need one most.
- Fix: Add needs: on all six other jobs and if: always() so it always runs and reports status, whether the pipeline succeeded or failed.
