## 1. Planning
- [ ] Confirm requirements & acceptance criteria in `docs/plans/2025-12-28-session-expired-banner/`
- [ ] Confirm this change proposal is approved before code changes

## 2. Tests (TDD)
- [ ] Add failing tests for session expired banner behavior
- [ ] Verify tests fail for the expected reasons

## 3. Implementation
- [ ] Add session expired storage helpers + event emitter
- [ ] Mark session expired on 401 in `vibescore-api`
- [ ] Update `use-auth` to track session expired and compute `signedIn`
- [ ] Update `App` gating for LandingPage vs Dashboard
- [ ] Add non-blocking banner to `DashboardPage`
- [ ] Add copy registry keys for banner

## 4. Verification
- [ ] Run `npm test`
- [ ] Run `node scripts/validate-copy-registry.cjs`
- [ ] Manual check: force 401 and confirm banner appears without full-page gate

## 5. Docs & Spec
- [ ] Update spec delta under `openspec/changes/2025-12-28-update-session-expired-banner/specs/vibescore-tracker/spec.md`
- [ ] Record verification report
