# Design: Full CI/CD (Vercel + MCP + npm)

## Module Brief

### Scope
- In: GitHub Actions CI for tests/guardrails/builds, CD for npm publish, Vercel deploy gating, manual MCP gate for functions, preflight database check.
- Out: Automatic Insforge function deployment, infra provisioning, staging environments.

### Interfaces
- GitHub Actions workflows (.github/workflows).
- Vercel Git integration status checks.
- npm registry (NPM_TOKEN).
- Insforge2 MCP operator for function deployment.

### Data Flow and Constraints
- PR -> CI checks (tests + build checks).
- main -> release workflow:
  - npm publish if version is new.
  - Vercel deploy via Git integration.
  - If functions changed, require manual MCP confirmation.
  - Preflight checks must pass before release completion.
- Constraint: Insforge functions can only be deployed via MCP.

### Non-negotiables
- No secrets in logs.
- MCP is the only deploy path for functions.
- Preflight must block release if required tables are missing.

### Test Strategy
- CI: npm test, validate:guardrails, build:insforge:check, dashboard:build.
- CD: publish dry-run gating, workflow logs, Vercel status checks.
- Acceptance: scripts/acceptance/model-identity-alias-table.cjs.

### Milestones
- M1: Requirements + acceptance.
- M2: OpenSpec proposal + tasks.
- M3: CI workflow.
- M4: CD workflow + MCP manual gate.
- M5: Release evidence recorded.

### Plan B Triggers
- npm publish fails due to version conflicts -> switch to manual version bump or tag-based release.
- Vercel status not available -> add manual dashboard deploy confirmation step.
- MCP step missed repeatedly -> introduce explicit release checklist issue gating.

### Upgrade Plan (disabled by default)
- If manual MCP gating causes repeated delays, consider a BFF deploy coordinator service.
