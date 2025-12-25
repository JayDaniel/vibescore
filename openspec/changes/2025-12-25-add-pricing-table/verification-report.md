# Verification Report

## Scope
- Pricing table-backed cost calculation.

## Tests Run
- `npm run build:insforge`
- `node scripts/acceptance/pricing-resolver.cjs`
- `node --test test/edge-functions.test.js`

## Results
- Passed.

## Evidence
- Build output: `Built 15 InsForge edge functions into insforge-functions/`.
- Acceptance output: `{ ok: true, resolved_model: "gpt-5.2-codex", fallback_model: "gpt-5.2-codex" }`.
- Edge function tests include pricing metadata assertions.

## Remaining Risks
- Live pricing table migration not re-verified in this run.
- Operational workflows (updating pricing rows) remain manual.
