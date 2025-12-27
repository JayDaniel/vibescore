# Pro Entitlements & Status Design

## Goal
Provide a backend-calculated Pro status for users based on:
- Registration cutoff (Asia/Shanghai 2025-12-31 23:59:59)
- Entitlements (paid/override/manual) with effective windows
- Manual revocation

## Architecture
- Runtime computation in a new edge function `vibescore-user-status`.
- Entitlements stored in `public.vibescore_user_entitlements` with RLS.
- Admin-only endpoints to grant/revoke entitlements (no payment integration yet).

## Data Model
Table: `public.vibescore_user_entitlements`
- `id` (uuid pk)
- `user_id` (uuid, fk -> public.users)
- `source` (`paid` | `override` | `manual`)
- `effective_from` (timestamptz)
- `effective_to` (timestamptz)
- `revoked_at` (timestamptz, nullable)
- `note` (text, nullable)
- `created_at`, `updated_at`, `created_by` (uuid/text)

## Rules
- Registration cutoff: `created_at <= 2025-12-31T15:59:59Z`.
- Registration Pro expiry: `created_at + 99 years`.
- Entitlement active: `now_utc` in `[effective_from, effective_to)` and `revoked_at IS NULL`.
- `pro.active = registration_cutoff || active_entitlement`.
- `pro.expires_at` uses the maximum expiry across active sources.

## Endpoints
- `GET /functions/vibescore-user-status` (user_jwt)
- `POST /functions/vibescore-entitlements` (service-role/project admin)
- `POST /functions/vibescore-entitlements-revoke` (service-role/project admin)

## Risks & Mitigations
- `created_at` not available via user auth -> fallback to service-role/RPC.
- Increased read latency -> minimal queries + caching as needed.

## Non-Goals
- Payment provider integration
- Frontend UI changes
