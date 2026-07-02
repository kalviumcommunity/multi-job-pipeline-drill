# Pipeline Audit

## 1. Lint

### Purpose
Checks code quality before any other jobs run.

### Problem
The lint job had no control over the execution order, so every job started at the same time.

### Fix
Lint is kept as the first job. Other jobs depend on it using `needs:`.

---

## 2. Unit Tests

### Purpose
Runs unit tests to verify application logic.

### Problem
Unit tests started before lint finished.

### Fix
Added:

```yaml
needs: lint
```

so unit tests only run after lint succeeds.

---

## 3. Build

### Purpose
Builds the application and creates the `dist/` folder.

### Problem
The build job ran before code validation and did not share its output.

### Fix

- Added

```yaml
needs: lint
```

- Uploaded the build artifact using

```yaml
actions/upload-artifact@v4
```

Artifact name:

```
app-build
```

---

## 4. Integration Tests

### Purpose
Runs integration tests using the built application.

### Problem

It tried downloading the build artifact before it existed.

### Fix

Added

```yaml
needs: build
```

Downloaded the artifact using

```yaml
actions/download-artifact@v4
```

Artifact name:

```
app-build
```

---

## 5. Deploy Staging

### Purpose

Deploys the application to staging.

### Problem

It ran on every branch and before all testing completed.

### Fix

Added

```yaml
needs:
  - unit-tests
  - integration-tests
```

Added

```yaml
if: github.ref == 'refs/heads/main'
```

---

## 6. Deploy Production

### Purpose

Deploys to production after staging.

### Problem

It could deploy before staging and also ran on feature branches.

### Fix

Added

```yaml
needs: deploy-staging
```

Added

```yaml
if: github.ref == 'refs/heads/main'
```

---

## 7. Notify

### Purpose

Always reports pipeline completion.

### Fix

Added

```yaml
if: always()
```

so notifications run whether the workflow succeeds or fails.

---

## Additional Improvements

- Added timeout-minutes to every job.
- Added comments explaining every `needs:` dependency.
- Fixed artifact sharing between Build and Integration Tests.
- Ensured deployment only happens from the `main` branch.