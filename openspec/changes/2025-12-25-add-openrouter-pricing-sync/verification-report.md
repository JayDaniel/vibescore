# Verification Report

## Scope
- OpenRouter pricing sync, resolver selection, retention behavior, and ops health checks.

## Tests Run
- `node scripts/acceptance/openrouter-pricing-sync.cjs`
- `node scripts/acceptance/usage-summary-aggregate.cjs`
- `node scripts/acceptance/usage-model-breakdown.cjs`
- `npm run build:insforge`

## Results
- Passed.

## Evidence
- Pricing sync acceptance output: `{ ok: true, upserts: 3, alias_upserts: 1, retention: { lt: { value: "2025-09-26" } } }`.
- Summary aggregate acceptance output: `{ ok: true, total_cost_usd: "0.000231" }`.
- Model breakdown acceptance output includes sources `codex`, `every-code`.
- Ops health check artifacts: `scripts/ops/pricing-sync-health.sql`, `docs/ops/pricing-sync-health.md`.

## Remaining Risks
- Live OpenRouter API schema drift may require mapping updates.
- InsForge env configuration (API key + defaults) not re-verified in this run.
