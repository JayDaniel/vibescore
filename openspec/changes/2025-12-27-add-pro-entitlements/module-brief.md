# Module Brief: Pro Entitlements & Status

## Scope
- IN: runtime pro status computation from registration cutoff + entitlements; new admin entitlement write APIs; user status read API; entitlement table & RLS.
- OUT: payment provider integration, dashboard UI changes, marketing/copy updates.

## Interfaces
- Input: `Authorization: Bearer <user_jwt>` (status) or `<service_role>`/project admin (entitlement writes), `public.users.created_at`, entitlement rows.
- Output: `pro.active`, `pro.sources`, `pro.expires_at`, and admin create/revoke responses.

## Data Flow and Constraints
- Registration cutoff constant: `2025-12-31T23:59:59` Asia/Shanghai (= `2025-12-31T15:59:59Z`).
- Registration pro expiry: `created_at + 99 years`.
- Entitlement active if `now_utc` in `[effective_from, effective_to)` and `revoked_at IS NULL`.
- `pro.expires_at` is the max of all active sources.
- Use database `now()` for authoritative time when possible.

## Non-Negotiables
- Do not require device tokens for user status.
- Do not expose PII.
- Admin endpoints require service-role or project-admin callers.
- No payment provider integration in this change.

## Test Strategy
- Unit: pro status computation (cutoff, entitlement active/expired, revoke).
- Integration: status endpoint with auth + mock entitlements.
- Regression: existing auth endpoints unchanged.

## Milestones
- M1: OpenSpec artifacts complete.
- M2: Schema + edge functions implemented with tests.
- M3: Regression + verification.

## Plan B Triggers
- If `created_at` is unavailable via `user_jwt`, switch to RPC or service-role lookup with explicit policy.

## Upgrade Plan (disabled)
- Payment webhook integration to populate entitlements.
