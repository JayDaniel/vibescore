# Incident Retrospective: Missing vibescore_model_aliases Table (2026-01-14)

## Summary
- 2026-01-14T16:54:04Z: requests to /vibescore_model_aliases returned 404 (PostgREST 42P01).
- Cause: code path referenced a new table before migration was applied in the active Insforge2 database.

## Impact
- Alias lookup failed for endpoints that depend on model identity mapping.
- Public view traffic surfaced the error more frequently, but was not the root cause.

## Timeline (UTC)
- 2026-01-14T16:54:04Z: Postgres log reports missing relation public.vibescore_model_aliases; GET /vibescore_model_aliases returns 404.
- 2026-01-14T17:55:45Z+: GET /vibescore_model_aliases returns 200 after migration applied.

## Root Cause (Essence)
- Schema drift: migration for vibescore_model_aliases was not applied before code started reading the table.

## Contributing Factors
- No deploy gate to verify required tables exist.
- No explicit checklist tying code deployment to migration completion.
- Optional data path lacked safe fallback for missing table.

## Detection
- Observed in function logs: PostgREST 42P01 and 404 responses.

## Corrective Actions (Done)
- Applied migration to create table vibescore_model_aliases in Insforge2.

## Preventive Actions (Proposed)
- Require pre-deploy acceptance check: scripts/acceptance/model-identity-alias-table.cjs.
- Add a deploy checklist item to record the acceptance script output.
- Consider a safe fallback path if alias table is missing or empty.

## Principles
- Schema-first, code-second.
- Deploy gate must verify schema availability.
- Optional data paths must degrade safely.
