# PR Template (Minimal)

## PR Goal (one sentence)
Record the updated Codex PR review loop skill with preflight and post-merge learning.

## Commit Narrative
- docs: sync codex-pr-review-loop skill into repo

## Regression Test Gate
### Most likely regression surface
- Skill guidance for preflight and post-merge capture in Codex review loop.

### Verification method (choose at least one)
- [x] `rg -n "Pre-PR Codex Readiness|Post-merge learning" docs/skills/codex-pr-review-loop/SKILL.md` => PASS

### Uncovered scope
- None.
