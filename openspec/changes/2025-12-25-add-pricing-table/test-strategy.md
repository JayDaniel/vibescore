# Test Strategy

## Objectives
- Validate pricing resolution logic, fallback behavior, and cost computation accuracy.

## Test Levels
- Unit:
  - Pricing resolver chooses correct profile by `effective_from`.
  - Fallback when table empty.
- Integration:
  - Edge function reads pricing table and returns metadata.
- Regression:
  - Repeatable script that compares cost with known inputs.
- Performance:
  - Ensure pricing lookup adds minimal overhead (single query per request).

## Test Matrix
- Resolve latest profile -> Unit -> Backend -> Jest/Node test
- Fallback to default -> Unit -> Backend -> Jest/Node test
- End-to-end cost response -> Integration -> curl runbook

## Environments
- Local InsForge stack or staging with seeded pricing rows.

## Automation Plan
- Add a script under `scripts/acceptance/` that stubs pricing table responses.

## Entry / Exit Criteria
- Entry: proposal approved.
- Exit: unit + integration coverage recorded in verification report.

## Coverage Risks
- DB permission issues when reading pricing table.
