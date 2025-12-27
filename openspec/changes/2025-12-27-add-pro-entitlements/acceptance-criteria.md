# Acceptance Criteria

## Feature: Pro status & entitlements

### Requirement: Pro status reflects registration cutoff and expiry
- Rationale: Cutoff-based users should have predictable Pro status with a long-lived window.

#### Scenario: User created before cutoff is Pro
- WHEN an authenticated user with `created_at <= 2025-12-31T15:59:59Z` calls `GET /functions/vibescore-user-status`
- THEN the response returns `pro.active = true`
- AND `pro.expires_at` equals `created_at + 99 years`

### Requirement: Entitlement windows control Pro status
- Rationale: Paid/override entitlements should grant Pro only within effective windows.

#### Scenario: Active entitlement grants Pro
- WHEN an entitlement exists with `effective_from <= now_utc < effective_to` and `revoked_at IS NULL`
- THEN `pro.active = true`
- AND `pro.sources` includes `entitlement`

#### Scenario: Revoked entitlement does not grant Pro
- WHEN an entitlement has `revoked_at` set
- THEN it is excluded from Pro calculation

### Requirement: Admin endpoints are restricted
- Rationale: Only admins should grant or revoke entitlements.

#### Scenario: Missing admin auth is rejected
- WHEN a non-admin caller invokes `POST /functions/vibescore-entitlements`
- THEN the endpoint responds with `401` or `403`
