## 1. Backend schema + RPC
- [x] 1.1 Create link code table with TTL + single-use fields
- [x] 1.2 Add atomic exchange RPC or function

## 2. Edge functions
- [x] 2.1 Implement link code init endpoint (session-bound)
- [x] 2.2 Implement link code exchange endpoint (idempotent)

## 3. CLI init
- [x] 3.1 Add `--link-code` flag handling
- [x] 3.2 Exchange link code for device token during init

## 4. Dashboard UI + copy registry
- [x] 4.1 Add copy strings to `dashboard/src/content/copy.csv`
- [x] 4.2 Render install command with link code
- [x] 4.3 Add "copy full command" button
- [x] 4.4 Mask user id display while preserving full copy value

## 5. Tests
- [x] 5.1 Backend tests: exchange idempotency + expiry
- [x] 5.2 Frontend tests: copy command + masking
- [x] 5.3 CLI regression: init still works without link code

## 6. Docs + verification
- [x] 6.1 Update design/plan artifacts as needed
- [x] 6.2 Record regression verification steps + results
