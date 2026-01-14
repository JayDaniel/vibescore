---
name: pr-review-cycle-retro
description: Use when a repo shows repeated review cycles or post-merge fixes and you need a structured PR retrospective with root-cause analysis.
---

# PR Review Cycle Retrospective

## Overview
Turn high review-cycle PRs into structured root-cause insights while separating low-signal automated reviews from actionable evidence.

## When to Use
- Closed PRs show repeated review cycles or follow-up fix PRs.
- You need 5 Whys + Fishbone + stage attribution per PR.
- You must separate frontend/backend root causes and avoid review-noise bias.

When NOT to use:
- One-off incidents with no repeated cycles.
- Purely mechanical changes (formatting-only PRs).

## Core Pattern
1) **Select**: Identify PRs with review cycles >= threshold.
2) **Filter**: Flag automated review-only PRs as low signal.
3) **Evidence**: Collect at least one evidence item per PR.
4) **Analyze**: Produce 5 Whys + Fishbone + stage attribution.
5) **Aggregate**: Summarize recurring causes by frontend/backend.

## Quick Reference
| Item | Rule |
| --- | --- |
| Review cycle | review event -> code update -> review event |
| Evidence | review comment with actionable detail OR follow-up fix PR OR regression doc |
| Stage attribution | design / implementation / review / testing / release |
| Noise guard | if only automated review events, mark as low-signal |
| Mixed PR | record both frontend and backend impact |

## Implementation (Repo-Specific)
Use the repo script to build the candidate list and baseline artifacts:

```bash
node scripts/ops/pr-retro.cjs \
  --since YYYY-MM-DD \
  --min-cycles 3 \
  --limit 5 \
  --out-dir docs/retrospective \
  --max-prs 80
```

Then fill analysis fields in the generated CSV/MD.

## Evidence Rules
- Each PR must cite at least 1 evidence item.
- If evidence is weak (automated review only), mark **low-signal** and use follow-up fixes or PR gate docs.
- Do not infer root cause without a traceable artifact.

## Automated Review Detection
- Treat reviewers matching known automation (e.g., `chatgpt-codex-connector`, `*bot*`) as low-signal.
- If all reviews are automated, rely on follow-up fixes, regression docs, or commit history for evidence.

## Stage Attribution Guide
- **Design**: contract mismatch, underspecified requirements, privacy/exposure gaps.
- **Implementation**: logic errors, incorrect ordering/aggregation, missing edge cases.
- **Review**: issues discovered late or missed until after merge.
- **Testing**: missing regression coverage, no E2E/contract validation.
- **Release**: environment mismatch, gateway constraints, deployment drift.

## Fishbone Categories
People, Process, Tools, Requirements, Code, Tests, Communication.

## Common Mistakes
- Treating automated reviews as strong evidence.
- Mixing symptoms (bugs) with causes (missing invariant).
- Failing to separate frontend vs backend impact.
- No stage attribution or evidence link.

## Rationalization Table
| Excuse | Reality |
| --- | --- |
| \"No time to read PRs\" | Without evidence, the analysis is guesswork. |
| \"Review cycles are enough\" | Cycles show churn, not root cause. |
| \"Titles explain the bug\" | Titles are symptoms, not causal evidence. |
| \"Mixed PRs are too hard\" | Record both sides to avoid blind spots. |

## Red Flags - STOP
- Fewer than 1 evidence item per PR.
- All review cycles are automated with no follow-up fixes.
- Root cause is stated without traceable artifacts.
- Evidence relies only on PR title or description.
