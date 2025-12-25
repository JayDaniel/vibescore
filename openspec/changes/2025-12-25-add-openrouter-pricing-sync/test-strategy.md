# Test Strategy

## Objectives
- Verify OpenRouter pricing sync correctness, idempotency, and safe defaults.
- Ensure usage endpoints continue to return pricing metadata with the configured model/source.

## Test Levels
- Unit:
  - Pricing normalization (USD per token -> micros per million).
  - Field mapping and default handling.
- Integration:
  - Sync endpoint with mocked OpenRouter response.
  - Upsert behavior on repeat runs.
- Regression:
  - Existing usage summary/model breakdown responses remain stable.
- Performance:
  - Not required (single scheduled sync every 6 hours).

## Test Matrix
- Sync upserts pricing -> Integration -> Backend -> acceptance script
- Idempotent updates -> Integration -> Backend -> acceptance script
- Resolver selects default model/source -> Unit -> Backend -> unit test
- Safe retention default -> Integration -> Backend -> acceptance script

## Environments
- Local dev with mocked OpenRouter response.
- InsForge staging or production for live sync (manual trigger).

## Automation Plan
- Add `scripts/acceptance/openrouter-pricing-sync.cjs` with a mock response.
- Extend existing acceptance scripts to ensure pricing metadata still present.

## Entry / Exit Criteria
- Entry: OpenSpec change approved.
- Exit: All acceptance scripts pass and sync endpoint deployed.

## Coverage Risks
- OpenRouter schema changes may require test updates.
