# Acceptance Criteria

## Feature: OpenRouter pricing sync

### Requirement: Sync endpoint upserts pricing rows
- Rationale: Pricing data must be persisted as the source of truth.

#### Scenario: Successful sync writes pricing rows
- WHEN a caller invokes `POST /functions/vibescore-pricing-sync`
- THEN the response reports the number of models processed and rows upserted
- AND `vibescore_pricing_profiles` contains rows with `source = "openrouter"`

### Requirement: Sync is idempotent per model/date
- Rationale: Scheduled runs should not create duplicates.

#### Scenario: Re-running the same day does not duplicate rows
- GIVEN a prior sync has been executed for `effective_from = today`
- WHEN the sync endpoint runs again
- THEN the row count for the same `(model, source, effective_from)` does not increase
- AND the latest pricing values are updated in place

### Requirement: Pricing resolver uses configured model/source
- Rationale: Multiple models exist; cost must use the intended default.

#### Scenario: Resolver selects configured model/source
- GIVEN multiple active pricing profiles exist
- WHEN `resolvePricingProfile` runs without explicit overrides
- THEN it selects the profile matching the configured `VIBESCORE_PRICING_MODEL` and `VIBESCORE_PRICING_SOURCE`

### Requirement: Retention policy is safe by default
- Rationale: Pricing history must not disappear unintentionally.

#### Scenario: Retention disabled keeps history
- GIVEN `retention_days` is not provided
- WHEN sync runs
- THEN no historical rows are deleted or deactivated
