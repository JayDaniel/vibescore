# Test Strategy

## Objectives
- Verify Public View profile returns `avatar_url` with sanitization.
- Verify public page avatar rendering with fallback.

## Test Levels
- Unit: avatar URL / display_name sanitization logic.
- Integration: public view profile endpoint (valid/invalid token).
- Regression: `test/public-view.test.js` covers public view UI behavior.
- Performance: Not required.

## Test Matrix
- Profile returns avatar -> Integration -> Backend -> `node --test test/edge-functions.test.js` (or new assertions).
- Avatar load fallback -> Unit/UI -> Dashboard -> `node --test test/public-view.test.js`
- PII filtering -> Unit -> Backend -> new unit test or static assertion

## Environments
- Local dev (Node 18 + InsForge mocks)

## Automation Plan
- Extend `test/public-view.test.js`.
- Run `npm run build:insforge` after backend changes.

## Entry / Exit Criteria
- Entry: Spec change approved, tasks scoped.
- Exit: All tests pass, `insforge-functions/` regenerated.

## Coverage Risks
- User metadata may omit avatar fields; UI falls back to identicon.
