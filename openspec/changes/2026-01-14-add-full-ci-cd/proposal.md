# Change: Add full CI/CD for CLI, dashboard, and Insforge functions

## Why
- Current pipelines are partial (guardrails and scheduled jobs only). We need a unified CI/CD flow to reduce release risk and improve reliability.

## What Changes
- Add CI workflow to run tests, guardrails, and build checks across modules.
- Add CD workflow to auto publish CLI on main and rely on Vercel Git integration for dashboard deploys.
- Add manual MCP deployment gate for Insforge functions.
- Add preflight checks to verify required database tables before release.
- Record release evidence in docs/deployment/freeze.md.

## Impact
- Affected specs: ci-cd (new)
- Affected code: .github/workflows, docs/deployment, scripts/acceptance
- **BREAKING**: None

## Architecture / Flow
- PR -> CI (tests + build checks).
- main -> CD (npm publish + Vercel deploy check + MCP manual gate).
- Preflight scripts run before release completion.

## Risks & Mitigations
- Risk: npm publish without version bump -> Mitigation: skip publish when version exists.
- Risk: functions not deployed -> Mitigation: manual MCP confirmation gate.
- Risk: dashboard deploy not visible -> Mitigation: require Vercel status check.

## Rollout / Milestones
- M1: Requirements + acceptance.
- M2: OpenSpec proposal + tasks.
- M3: CI workflow.
- M4: CD workflow + manual gate.
- M5: Release evidence update.
