## 1. Spec
- [x] Add pricing table requirements to spec delta.
- [x] Validate change with `openspec validate 2025-12-25-add-pricing-table --strict`.

## 2. Schema + Backend
- [x] Create pricing table migration or SQL (table + indexes).
- [x] Implement pricing resolver that reads the table and falls back.
- [x] Update cost endpoints to use resolver.

## 3. Tests & Verification
- [x] Unit tests for resolver selection + fallback.
- [x] Integration runbook or acceptance script.
- [x] Update docs and verification report.
