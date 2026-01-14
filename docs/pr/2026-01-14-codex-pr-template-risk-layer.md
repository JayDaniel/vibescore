# PR Template (Minimal)

## PR Goal (one sentence)
Add a risk-layer addendum to the PR template for higher-risk changes.

## Commit Narrative
- docs: add risk-layer triggers and addendum to PR template

## Regression Test Gate
### Most likely regression surface
- PR template clarity and required fields for high-risk changes.

### Verification method (choose at least one)
- [x] `rg -n "Risk Layer" .github/PULL_REQUEST_TEMPLATE.md` => PASS

### Uncovered scope
- GitHub UI rendering of the template (manual).
