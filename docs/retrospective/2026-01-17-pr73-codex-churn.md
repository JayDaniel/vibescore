# PR Retrospective: #73 CLI Doctor Codex Churn (2026-01-17)

## Summary
- Codex review flagged that `config.json` can be valid JSON `null`, causing `doctor` to crash before reporting.
- Fix added a plain-object guard and defaulted to `{}`, plus a regression test; this required a second Codex review cycle.

## Evidence
- Codex review thread comment (2026-01-17) requesting a guard against null config values.
- Fix commit `fd7ceb0` (guard non-object config + test "doctor tolerates null config.json payload").

## Stage Attribution
- Primary: Implementation
- Secondary: Testing

## Cause Taxonomy
- Implementation Drift: assumed config value is an object when `readJsonStrict` can return `null`.
- Test Gap: missing regression coverage for valid-but-null JSON config.

## Preventive Actions
- Validate config shape before dereferencing and coerce non-plain objects to `{}`.
- Keep regression coverage for corrupted-but-valid config payloads.
- Add boundary cases to the PR risk-layer addendum when touching config parsing.

## Notes
- Codex review cycle count: 2 (initial review → fix → re-review).
