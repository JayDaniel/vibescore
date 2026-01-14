# PR Template (Minimal)

## PR Goal (one sentence)
Record Codex churn analysis for PR #65 in retrospective docs.

## Commit Narrative
- docs: add PR #65 Codex churn analysis to retrospective

## Regression Test Gate
### Most likely regression surface
- Retrospective document consistency for PR #65 entries.

### Verification method (choose at least one)
- [x] `rg -n "PR #65|Public view share cleanup" docs/retrospective/2026-01-13-pr-retro.md` => PASS
- [x] `rg -n "^65," docs/retrospective/2026-01-13-pr-retro.csv` => PASS

### Uncovered scope
- Generated JSON consistency (manual). 
