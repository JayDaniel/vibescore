# Acceptance Criteria

## Feature: Pricing table-backed cost calculation

### Requirement: Pricing profile is resolved from table
- Rationale: Costs must reflect an explicit, maintainable pricing source.

#### Scenario: Table profile selected
- GIVEN a pricing row exists with `effective_from <= today`
- WHEN a user calls `GET /functions/vibescore-usage-summary`
- THEN the response `pricing` SHALL match the table row
- AND `total_cost_usd` SHALL be computed using that row's rates

### Requirement: Fallback to default profile
- Rationale: Prevent outages if table is empty.

#### Scenario: No table rows
- GIVEN no pricing rows exist
- WHEN a user calls `GET /functions/vibescore-usage-summary`
- THEN the response SHALL use the built-in default profile
- AND the response SHALL still include `pricing` metadata

### Requirement: Admin updates do not require code deploy
- Rationale: Pricing changes should be operationally lightweight.

#### Scenario: Update pricing row
- WHEN an admin inserts a new pricing row with a later `effective_from`
- THEN subsequent cost responses SHALL reflect the new row without redeploying code
