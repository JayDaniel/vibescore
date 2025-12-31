# Change: Add debug headers for usage endpoints

## Why
We cannot observe `slow_query` logs via InsForge MCP log sources. A gated debug header path provides evidence for query duration and threshold without adding database writes.

## What Changes
- Add optional debug response headers on usage endpoints when `debug=1` is provided.
- Expose request id, query duration, slow-query threshold, and slow-query flag via headers.
- Update tests and backend API documentation.

## Impact
- Affected specs: `openspec/specs/vibescore-tracker/spec.md`
- Affected code: `insforge-src/shared/http.js`, `insforge-src/shared/logging.js`, `insforge-src/functions/vibescore-usage-*.js`, `insforge-functions/*`, `test/edge-functions.test.js`, `BACKEND_API.md`
