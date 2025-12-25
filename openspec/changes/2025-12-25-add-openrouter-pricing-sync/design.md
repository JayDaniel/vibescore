## Context
- Pricing is used for cost calculation; it must be auditable and reproducible.
- OpenRouter provides a Models API with pricing metadata.
- Scheduled automation is already used for leaderboard refresh and retention.

## Goals / Non-Goals
- Goals:
  - Sync OpenRouter pricing into the database on a fixed schedule.
  - Keep the database as the pricing source of truth.
  - Allow a configurable default model/source for cost calculation.
- Non-Goals:
  - UI to manage pricing.
  - Backfilling historical usage cost.
  - Handling non-token billing (request/image/web_search) beyond storage.

## Decisions
- Decision: Use an edge function (`vibescore-pricing-sync`) to fetch OpenRouter and upsert pricing.
  - Why: Centralizes pricing updates and preserves DB as source of truth.
- Decision: Trigger via GitHub Actions schedule every 6 hours.
  - Why: Consistent with existing scheduled backend tasks.
- Decision: Resolver defaults to configured model/source.
  - Why: Multiple pricing rows would otherwise be ambiguous.
- Decision: Retention is opt-in and safe by default (no purge).
  - Why: Avoids accidental loss of pricing history.

## Alternatives considered
- Sync directly from GitHub Actions without an edge function.
  - Rejected: Duplicates logic and spreads secrets across systems.

## Risks / Trade-offs
- OpenRouter schema changes may require updates -> mitigate with strict parsing + tests.
- Token pricing mismatch -> mitigate with unit conversion tests.

## Migration Plan
- Add new endpoint and scheduled workflow.
- Configure env vars and secrets.
- Deploy and verify with a manual trigger.

## Open Questions
- Should retention be soft (deactivate) or hard delete when enabled?
