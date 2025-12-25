# Requirement Analysis

## Goal
- Move pricing from static config to a maintained pricing table so cost calculations are auditable and updateable without code changes.

## Scope
- In scope:
  - New database table to store pricing profiles with effective dates.
  - Backend pricing resolver reads table with fallback to default profile.
  - Endpoints that return pricing metadata use resolved table profile.
  - Admin/ops workflow to update pricing entries.
- Out of scope:
  - Frontend changes.
  - Per-user custom pricing.
  - Historical re-rating of stored usage data.

## Users / Actors
- Backend services computing usage cost.
- Ops/admin updating pricing profiles.
- Dashboard consumers (read-only).

## Inputs
- Pricing table rows (model/source/rates/effective_from/active flag).
- Existing usage aggregates.

## Outputs
- Cost calculations derived from the pricing table.
- Pricing metadata in API responses reflects selected profile.

## Business Rules
- Pricing profile selection uses latest `effective_from` not in the future.
- If no row matches, fall back to default profile to avoid hard failure.
- Costs must remain bigint-safe and deterministic.

## Assumptions
- Existing endpoints already compute cost from shared pricing helper.
- InsForge supports table creation and read access from Edge Functions.

## Dependencies
- InsForge database schema migration.
- `insforge-src/shared/pricing.js` and endpoints consuming it.

## Risks
- Missing or invalid pricing rows could zero out costs.
- Performance regression if pricing lookup is not cached per request.
- Backfill/consistency concerns if historical prices change.
