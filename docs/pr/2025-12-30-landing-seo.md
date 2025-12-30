# PR Template (Minimal)

## PR Goal (one sentence)
Improve landing page SEO content and metadata injection (canonical/icon/JSON-LD) while expanding anchor navigation.

## Commit Narrative
- feat(landing): expand landing copy + SEO sections
- chore(seo): add canonical/icon placeholders + JSON-LD injection
- test(docs): record regression results

## Rollback Semantics
Reverting this PR restores the previous landing copy and metadata output; no backend changes.

## Hidden Context
- All user-visible text remains sourced from `dashboard/src/content/copy.csv`.

## Regression Test Gate
### Most likely regression surface
- Landing layout (new sections + anchors).
- Meta tag injection (canonical/icon + JSON-LD) and copy registry mapping.

### Verification method (choose at least one)
- [x] `node scripts/validate-copy-registry.cjs` => PASS with warnings (unused keys: `landing.meta.title`, `landing.meta.description`, `landing.meta.og_site_name`, `landing.meta.og_type`, `landing.meta.og_url`, `landing.meta.og_image`, `landing.meta.twitter_card`, `landing.meta.canonical_url`, `landing.meta.favicon`, `landing.meta.apple_touch_icon`, `identity_card.operator_label`, `identity_panel.access_label`, `usage.summary.since`, `dashboard.session.label`).
- [ ] `npm --prefix dashboard run build` => FAIL (missing `@fontsource/geist-mono/400.css` in local `node_modules`).

### Uncovered scope
- Visual regression check (desktop/mobile) in a browser.
- Clean build after reinstalling dashboard dependencies.
