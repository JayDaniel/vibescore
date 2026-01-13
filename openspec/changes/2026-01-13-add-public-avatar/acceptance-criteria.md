# Acceptance Criteria

## Feature: Public View Avatar

### Requirement: Public View profile returns privacy-safe avatar URL
- Rationale: Allow the public page to show an avatar without exposing private data.

#### Scenario: Valid share token returns avatar
- WHEN requesting `GET /functions/vibeusage-public-view-profile` with a valid share token
- THEN the response includes `display_name` and `avatar_url`
- AND `avatar_url` is `null` unless it is a valid http/https URL within length limits

### Requirement: Public View UI uses avatar with identicon fallback
- Rationale: Ensure identity stays visible when avatar is missing or fails to load.

#### Scenario: Avatar load fails
- WHEN the public page cannot load the avatar
- THEN the UI falls back to identicon (MatrixAvatar)
- AND the page continues to render

### Requirement: Public View does not expose private identifiers
- Rationale: Prevent PII leakage.

#### Scenario: Metadata contains email or unsafe url
- WHEN `display_name` contains an email or `avatar_url` is non-http/https
- THEN the profile response returns `null` for those fields
- AND the UI uses anonymous fallback + identicon
