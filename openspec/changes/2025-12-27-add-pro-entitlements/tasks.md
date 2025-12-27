## 1. Implementation
- [ ] 1.1 Add `vibescore_user_entitlements` table + RLS policies
- [ ] 1.2 Add shared Pro status computation helper (cutoff + entitlements + expiry)
- [ ] 1.3 Implement `GET /functions/vibescore-user-status`
- [ ] 1.4 Implement admin endpoints to grant/revoke entitlements
- [ ] 1.5 Add edge function tests for status + entitlement endpoints
- [ ] 1.6 Update `BACKEND_API.md` with new endpoints

## 2. Verification
- [ ] 2.1 Run targeted tests (`node --test test/edge-functions.test.js`)
- [ ] 2.2 Run `openspec validate 2025-12-27-add-pro-entitlements --strict`
