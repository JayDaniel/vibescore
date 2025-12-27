# Test Strategy

## Objectives
- Verify Pro status calculation from cutoff + entitlements.
- Ensure admin-only entitlement write access.
- Prevent regression to existing auth behaviors.

## Test Levels
- Unit: pro status computation helper.
- Integration: edge functions for status and entitlements.
- Regression: existing edge-function test suite.
- Performance: not applicable (no new heavy queries).

## Test Matrix
- User status endpoint -> Integration -> Backend -> `test/edge-functions.test.js`
- Cutoff + expiry computation -> Unit -> Backend -> new unit test
- Entitlement grant/revoke auth -> Integration -> Backend -> `test/edge-functions.test.js`

## Environments
- Local Node test runner (`node --test`).

## Automation Plan
- Add tests to `test/edge-functions.test.js`.
- Keep unit tests in `test/pro-status.test.js` or similar.

## Entry / Exit Criteria
- Entry: OpenSpec proposal + spec delta validated.
- Exit: All new tests pass; no regressions in existing tests.

## Coverage Risks
- Relying on auth payload for `created_at` may require integration test with mocked auth.
