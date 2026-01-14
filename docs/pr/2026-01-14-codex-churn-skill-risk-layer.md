# PR Template (Minimal)

## PR Goal (one sentence)
Tie Codex churn skill to the PR risk-layer gate before @codex review.

## Commit Narrative
- docs: add risk-layer gate to Codex churn skill

## Regression Test Gate
### Most likely regression surface
- Skill guidance for triggering risk-layer addendum before Codex review.

### Verification method (choose at least one)
- [x] `rg -n "Risk-Layer Gate|risk-layer" docs/skills/pr-review-cycle-retro/SKILL.md` => PASS

### Uncovered scope
- None.
