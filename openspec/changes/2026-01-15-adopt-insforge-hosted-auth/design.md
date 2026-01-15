## Context
The dashboard currently parses auth callback parameters and persists the access token locally. This has proven brittle (path mismatches, redirect drift). InsForge provides hosted auth routes and SDK-managed session resolution which can replace most of the custom callback logic.

## Goals / Non-Goals
- Goals:
  - Use InsForge hosted auth routes (`/sign-in`, `/sign-up`) via React Router.
  - Rely on InsForge SDK session state for signed-in gating.
  - Reduce custom callback parsing in the dashboard.
  - Preserve existing user_jwt authorization boundaries for usage/leaderboard queries.
- Non-Goals:
  - Changing backend auth rules or token formats.
  - Replacing existing usage endpoints or authorization headers.
  - Redesigning dashboard UI beyond login entry points.

## Decisions
- Decision: Adopt InsForge hosted auth routes with React Router and `InsforgeProvider` at the dashboard entry.
  - Rationale: official flow reduces drift and centralizes session handling.
- Decision: Keep a temporary fallback to local auth storage during migration.
  - Rationale: reduce blast radius while validating the new flow in production.

## Alternatives Considered
- Continue using custom callback parsing and add more path/hash compatibility.
  - Rejected: still fragile and requires ongoing maintenance.
- Only use the shared OAuth callback handler but keep custom front-end parsing.
  - Rejected: partial benefit, still leaves local state drift issues.

## Risks / Trade-offs
- Routing refactor could affect initial render or link behavior.
  - Mitigation: minimal route table, add targeted regression checks.
- Hosted auth routes become a runtime dependency.
  - Mitigation: keep fallback for one release; log errors on SDK failure.

## Migration Plan
1. Add InsForge provider + router routes for hosted auth.
2. Route Landing buttons to `/sign-in` and `/sign-up`.
3. Gate dashboard on SDK auth state; keep local fallback for one release.
4. Collect login flow telemetry and user feedback.
5. Remove fallback once stable.

## Open Questions
- Which exact post-auth URL should be used (`/` vs `/dashboard`)?
- Do we need to support multiple callback URLs for local dev vs prod?
