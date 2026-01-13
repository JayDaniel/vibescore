# Requirement Analysis

## Goal
- Allow Public View to show a privacy-safe avatar for better recognition.

## Scope
- In scope:
  - Public View profile returns `avatar_url` (nullable).
  - Dashboard public view renders avatar with identicon fallback.
  - Avatar URL validation and sanitization.
- Out of scope:
  - Avatar upload/edit/storage UX.
  - New privacy settings UI.

## Users / Actors
- Public viewer
- Share link owner
- InsForge Edge Functions

## Inputs
- `Authorization: Bearer <share_token>`
- `auth.users` metadata (`raw_user_meta_data` / `user_metadata`)

## Outputs
- `display_name` (privacy-safe)
- `avatar_url` (http/https or null)

## Business Rules
- Only allow http/https avatar URLs.
- Return `null` if empty, invalid, or too long.
- `display_name` must not contain email; fallback to anonymous.
- Public View must not expose `user_id`, email, or raw metadata.

## Assumptions
- `public.users` view exposes `auth.users` metadata fields.
- User consents to public avatar exposure.

## Dependencies
- `insforge-src/shared/public-view.js` token resolution.
- `insforge-src/functions/vibescore-public-view-profile.js` response.
- `dashboard/src/pages/DashboardPage.jsx` public view rendering.

## Risks
- Avatar URL may reveal identity or tracking.
- Metadata fields may be missing, causing fallback.
