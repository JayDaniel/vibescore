# Requirement Analysis

## Goal
- Automatically sync OpenRouter model pricing into `vibescore_pricing_profiles` on a 6-hour schedule while keeping the database as the source of truth.

## Scope
- In scope:
  - Fetch OpenRouter Models API pricing.
  - Normalize and upsert pricing into `vibescore_pricing_profiles` by model/source/effective date.
  - Schedule sync via GitHub Actions (every 6 hours).
  - Resolver selects configured default model/source when multiple profiles exist.
- Out of scope:
  - UI for managing pricing.
  - Historical cost backfill.
  - Non-token billing (request/image/web_search) beyond storage.

## Users / Actors
- Scheduled automation (GitHub Actions)
- Backend edge function
- Dashboard/usage endpoints (read pricing metadata)

## Inputs
- OpenRouter Models API response (pricing object values are USD per token/request/unit).
- Optional sync parameters: `effective_from`, `allow_models`, `retention_days`.

## Outputs
- Upserted rows in `vibescore_pricing_profiles`.
- Usage endpoints return pricing metadata derived from configured model/source.

## Business Rules
- Database remains the source of truth; OpenRouter is an input source only.
- Upsert is idempotent per `(model, source, effective_from)`.
- Token pricing uses USD-per-token -> micro-USD per million tokens conversion.
- Retention defaults to soft-deactivation with `retention_days=90`.

## Assumptions
- OpenRouter pricing for token fields is available and stable enough for scheduled sync.
- Default pricing model is `gpt-5.2-codex` with `source=openrouter`.

## Dependencies
- OpenRouter Models API availability.
- InsForge edge functions with outbound HTTP access.
- GitHub Actions secrets for InsForge base URL and service role key.

## Risks
- Pricing schema drift -> conversion errors.
- Multiple models without explicit selection -> wrong cost model.
- Retention policy ambiguity -> data loss if purge is enabled.
