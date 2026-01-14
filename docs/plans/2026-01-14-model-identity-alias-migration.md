# Model Identity Alias Table Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the missing `vibescore_model_aliases` table in InsForge so identity alias lookups stop erroring and match the existing OpenSpec design.

**Architecture:** Apply a minimal schema migration that matches the OpenSpec design (`vibescore_model_aliases` with effective timestamps and RLS policies). Add a repeatable acceptance script that fails when the table is missing and passes after the migration. No backfill (per design non-goals).

**Tech Stack:** PostgreSQL (InsForge), Node.js acceptance script, OpenSpec change tracking.

### Task 1: Add failing acceptance script for table existence

**Files:**
- Create: `scripts/acceptance/model-identity-alias-table.cjs`

**Step 1: Write the failing test**

```js
#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { createClient } = require('@insforge/sdk');

async function main() {
  const baseUrl =
    process.env.VIBEUSAGE_INSFORGE_BASE_URL ||
    process.env.VIBESCORE_INSFORGE_BASE_URL ||
    process.env.INSFORGE_BASE_URL ||
    'https://5tmappuk.us-east.insforge.app';

  const serviceRoleKey =
    process.env.INSFORGE_SERVICE_ROLE_KEY ||
    process.env.INSFORGE_API_KEY ||
    '';

  if (!serviceRoleKey) {
    throw new Error('Missing INSFORGE_SERVICE_ROLE_KEY / INSFORGE_API_KEY');
  }

  const anonKey = process.env.INSFORGE_ANON_KEY || '';
  const client = createClient({
    baseUrl,
    anonKey: anonKey || serviceRoleKey,
    edgeFunctionToken: serviceRoleKey
  });

  const { data, error } = await client.database
    .from('vibescore_model_aliases')
    .select('usage_model')
    .limit(1);

  if (error) {
    throw new Error(`vibescore_model_aliases missing or inaccessible: ${error.message || error}`);
  }

  assert.ok(Array.isArray(data));

  process.stdout.write(JSON.stringify({ ok: true, table: 'vibescore_model_aliases' }, null, 2) + '\n');
}

main().catch((err) => {
  process.stderr.write(`${err?.stack || err}\n`);
  process.exit(1);
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
INSFORGE_SERVICE_ROLE_KEY=... INSFORGE_ANON_KEY=... node scripts/acceptance/model-identity-alias-table.cjs
```
Expected: FAIL with "vibescore_model_aliases missing or inaccessible".

### Task 2: Add migration SQL

**Files:**
- Create: `openspec/changes/2026-01-05-add-model-identity-alias/sql/001_create_model_aliases.sql`

**Step 1: Write SQL migration**

```sql
-- Create model identity alias table for usage->canonical mapping.

create table if not exists public.vibescore_model_aliases (
  alias_id bigserial primary key,
  usage_model text not null,
  canonical_model text not null,
  display_name text,
  effective_from timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists vibescore_model_aliases_usage_effective_idx
  on public.vibescore_model_aliases (usage_model, effective_from desc);

create index if not exists vibescore_model_aliases_canonical_idx
  on public.vibescore_model_aliases (canonical_model);

create index if not exists vibescore_model_aliases_active_idx
  on public.vibescore_model_aliases (active);

alter table public.vibescore_model_aliases enable row level security;

do $$ begin
  create policy project_admin_policy on public.vibescore_model_aliases
    for all to project_admin using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy vibescore_model_aliases_select on public.vibescore_model_aliases
    for select to public using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  grant usage, select on sequence public.vibescore_model_aliases_alias_id_seq to project_admin;
exception when undefined_object then null; end $$;
```

### Task 3: Apply migration to InsForge

**Files:**
- Execute: `openspec/changes/2026-01-05-add-model-identity-alias/sql/001_create_model_aliases.sql`

**Step 1: Apply SQL in InsForge SQL console**

Expected: Table created with indexes + RLS policies.

### Task 4: Verify migration passes acceptance script

**Step 1: Re-run acceptance script**

Run:
```bash
INSFORGE_SERVICE_ROLE_KEY=... INSFORGE_ANON_KEY=... node scripts/acceptance/model-identity-alias-table.cjs
```
Expected: PASS with `{ "ok": true }`.

### Task 5: Update OpenSpec task checklist

**Files:**
- Modify: `openspec/changes/2026-01-05-add-model-identity-alias/tasks.md`

**Step 1: Add Database section**

```markdown
## 5. Database
- [ ] Add `vibescore_model_aliases` table migration SQL.
- [ ] Apply migration in InsForge.
- [ ] Verify table existence via acceptance script.
```

**Step 2: Mark tasks complete after verification**

### Task 6: Validate OpenSpec change

**Step 1: Run validation**

Run:
```bash
openspec validate 2026-01-05-add-model-identity-alias --strict
```
Expected: PASS.

### Task 7: Update architecture canvas

**Step 1: Regenerate canvas**

Run:
```bash
node scripts/ops/architecture-canvas.cjs
```
Expected: Canvas refreshed with no drift warnings.

### Task 8: Commit

```bash
git add scripts/acceptance/model-identity-alias-table.cjs \
        openspec/changes/2026-01-05-add-model-identity-alias/sql/001_create_model_aliases.sql \
        openspec/changes/2026-01-05-add-model-identity-alias/tasks.md \
        architecture.canvas

git commit -m "chore: add model identity alias migration and check"
```

### Task 9: Regression record

Record the acceptance script command and result in the commit message notes or a local verification log.

## Verification Log (2026-01-14)

- Command (pre-migration, expected FAIL):
  - `INSFORGE_ANON_KEY=<anon-jwt> node scripts/acceptance/model-identity-alias-table.cjs`
  - Result: FAIL with `relation "public.vibescore_model_aliases" does not exist`
- Command (post-migration, expected PASS):
  - `INSFORGE_ANON_KEY=<anon-jwt> node scripts/acceptance/model-identity-alias-table.cjs`
  - Result: PASS with `{ "ok": true, "table": "vibescore_model_aliases" }`
