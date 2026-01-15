## 1. Spec
- [x] Draft requirements analysis + acceptance criteria + test strategy + milestones.
- [x] Add CI/CD requirements to spec delta.
- [x] Validate change with `openspec validate 2026-01-14-add-full-ci-cd --strict`.

## 2. CI (PR + main)
- [x] Add CI workflow for tests, guardrails, and build checks across modules.
- [x] Ensure insforge build output check runs (`npm run build:insforge:check`).
- [x] Ensure dashboard build runs (`npm run dashboard:build`).

## 3. CD (main)
- [x] Add release workflow for npm publish with version-exists guard.
- [x] Add Vercel deploy gate (require Vercel status check for main).
- [x] Add manual MCP deployment confirmation step for functions when functions change.
- [x] Add preflight table check gate (model-identity-alias-table).

## 4. Docs & Runbook
- [x] Update docs/deployment/freeze.md with a CI/CD release entry template.
- [x] Add MCP deploy runbook step for functions.

## 5. Verification
- [x] Run CI workflow on a PR and record results.
- [ ] Run release workflow on main (or workflow_dispatch) and record results.
- [x] Update verification report with evidence.
