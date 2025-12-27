# Pro Entitlements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add backend Pro status computation with entitlements and admin grant/revoke endpoints.

**Architecture:** Runtime Pro status is computed from registration cutoff + entitlement windows. Entitlements are stored in a new table with RLS; user status reads via user JWT, admin write endpoints require service-role/project-admin token.

**Tech Stack:** InsForge Edge Functions (Deno), Node.js tests (`node --test`), SQL migrations in OpenSpec change.

### Task 1: Add entitlements schema + RLS

**Files:**
- Create: `openspec/changes/2025-12-27-add-pro-entitlements/sql/001_create_user_entitlements.sql`

**Step 1: Write schema file**

```sql
-- Pro entitlements table
create table if not exists public.vibescore_user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  source text not null,
  effective_from timestamptz not null,
  effective_to timestamptz not null,
  revoked_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid
);

alter table public.vibescore_user_entitlements enable row level security;

-- Admin policy
create policy if not exists project_admin_policy on public.vibescore_user_entitlements
  for all to project_admin using (true) with check (true);

-- User can read own entitlements (optional)
create policy if not exists vibescore_user_entitlements_select on public.vibescore_user_entitlements
  for select to public using (auth.uid() = user_id);
```

**Step 2: Commit**

```bash
git add openspec/changes/2025-12-27-add-pro-entitlements/sql/001_create_user_entitlements.sql
git commit -m "docs(openspec): add pro entitlements schema"
```

### Task 2: Pro status helper (TDD)

**Files:**
- Create: `insforge-src/shared/pro-status.js`
- Test: `test/pro-status.test.js`

**Step 1: Write the failing tests**

```js
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { computeProStatus } = require('../insforge-src/shared/pro-status');

test('registration cutoff grants pro with 99y expiry', () => {
  const createdAt = '2025-01-01T00:00:00Z';
  const now = '2026-01-01T00:00:00Z';
  const res = computeProStatus({ createdAt, entitlements: [], now });
  assert.equal(res.active, true);
  assert.equal(res.sources.includes('registration_cutoff'), true);
});

test('active entitlement grants pro', () => {
  const now = '2026-01-01T00:00:00Z';
  const res = computeProStatus({
    createdAt: '2026-02-01T00:00:00Z',
    entitlements: [{ effective_from: '2025-01-01T00:00:00Z', effective_to: '2027-01-01T00:00:00Z', revoked_at: null }],
    now
  });
  assert.equal(res.active, true);
  assert.equal(res.sources.includes('entitlement'), true);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/pro-status.test.js`
Expected: FAIL (module not found or function missing).

**Step 3: Write minimal implementation**

```js
const CUTOFF_UTC = '2025-12-31T15:59:59Z';
const YEARS_99_MS = 99 * 365.25 * 24 * 60 * 60 * 1000;

function computeProStatus({ createdAt, entitlements, now }) {
  const nowMs = Date.parse(now);
  const createdMs = Date.parse(createdAt);
  const cutoffMs = Date.parse(CUTOFF_UTC);

  const sources = [];
  let expiresAt = null;

  if (Number.isFinite(createdMs) && createdMs <= cutoffMs) {
    sources.push('registration_cutoff');
    const regExpiry = new Date(createdMs + YEARS_99_MS).toISOString();
    expiresAt = regExpiry;
  }

  const activeEntitlements = (entitlements || []).filter((row) => {
    if (!row) return false;
    if (row.revoked_at) return false;
    const from = Date.parse(row.effective_from);
    const to = Date.parse(row.effective_to);
    return Number.isFinite(from) && Number.isFinite(to) && nowMs >= from && nowMs < to;
  });

  if (activeEntitlements.length > 0) {
    sources.push('entitlement');
    const maxTo = activeEntitlements
      .map((row) => Date.parse(row.effective_to))
      .filter(Number.isFinite)
      .reduce((a, b) => Math.max(a, b), -Infinity);
    if (Number.isFinite(maxTo)) {
      const entExpiry = new Date(maxTo).toISOString();
      expiresAt = expiresAt ? (Date.parse(entExpiry) > Date.parse(expiresAt) ? entExpiry : expiresAt) : entExpiry;
    }
  }

  return { active: sources.length > 0, sources, expires_at: expiresAt };
}

module.exports = { computeProStatus, CUTOFF_UTC };
```

**Step 4: Run test to verify it passes**

Run: `node --test test/pro-status.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add insforge-src/shared/pro-status.js test/pro-status.test.js
git commit -m "feat(backend): add pro status helper"
```

### Task 3: User status endpoint (TDD)

**Files:**
- Create: `insforge-src/functions/vibescore-user-status.js`
- Build: `insforge-functions/vibescore-user-status.js`
- Test: `test/edge-functions.test.js`

**Step 1: Write failing test**

```js
test('vibescore-user-status returns pro.active for cutoff user', async () => {
  const fn = require('../insforge-functions/vibescore-user-status');
  const userId = '11111111-1111-1111-1111-111111111111';
  const userJwt = 'user_jwt_test';

  globalThis.createClient = (args) => ({
    auth: { getCurrentUser: async () => ({ data: { user: { id: userId, created_at: '2025-01-01T00:00:00Z' } }, error: null }) },
    database: { from: () => ({ select: () => ({ eq: () => ({ order: async () => ({ data: [], error: null }) }) }) }) }
  });

  const req = new Request('http://localhost/functions/vibescore-user-status', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userJwt}` }
  });

  const res = await fn(req);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.pro.active, true);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/edge-functions.test.js`
Expected: FAIL (module not found).

**Step 3: Implement endpoint (minimal)**
- Use `getEdgeClientAndUserId` to resolve user + `created_at`.
- Query `vibescore_user_entitlements` with user_id.
- Call `computeProStatus` with `now = new Date().toISOString()`.

**Step 4: Build insforge artifacts**

Run: `npm run build:insforge`
Expected: generate `insforge-functions/vibescore-user-status.js`.

**Step 5: Run test to verify it passes**

Run: `node --test test/edge-functions.test.js`
Expected: PASS

**Step 6: Commit**

```bash
git add insforge-src/functions/vibescore-user-status.js insforge-functions/vibescore-user-status.js test/edge-functions.test.js
git commit -m "feat(backend): add user pro status endpoint"
```

### Task 4: Admin entitlement endpoints (TDD)

**Files:**
- Create: `insforge-src/functions/vibescore-entitlements.js`
- Create: `insforge-src/functions/vibescore-entitlements-revoke.js`
- Build: `insforge-functions/*.js`
- Test: `test/edge-functions.test.js`

**Step 1: Write failing tests**
- Test 401 when bearer is not service-role.
- Test insert/revoke path uses `vibescore_user_entitlements`.

**Step 2: Run test to verify it fails**

Run: `node --test test/edge-functions.test.js`
Expected: FAIL (module not found / unauthorized logic missing).

**Step 3: Implement endpoints**
- Require `Authorization: Bearer <service_role_key>`.
- Grant endpoint inserts entitlement row.
- Revoke endpoint updates `revoked_at`.

**Step 4: Build insforge artifacts**

Run: `npm run build:insforge`
Expected: new compiled functions.

**Step 5: Run test to verify it passes**

Run: `node --test test/edge-functions.test.js`
Expected: PASS

**Step 6: Commit**

```bash
git add insforge-src/functions/vibescore-entitlements.js insforge-src/functions/vibescore-entitlements-revoke.js insforge-functions/vibescore-entitlements.js insforge-functions/vibescore-entitlements-revoke.js test/edge-functions.test.js
git commit -m "feat(backend): add pro entitlement admin endpoints"
```

### Task 5: Docs + OpenSpec updates

**Files:**
- Modify: `BACKEND_API.md`
- Modify: `openspec/changes/2025-12-27-add-pro-entitlements/tasks.md`
- Modify: `openspec/changes/2025-12-27-add-pro-entitlements/verification-report.md`

**Step 1: Update BACKEND_API.md**
- Add `vibescore-user-status`, `vibescore-entitlements`, `vibescore-entitlements-revoke` sections.

**Step 2: Mark tasks complete + record verification**
- Check tasks 1.1–2.2.
- Update verification report with test run evidence.

**Step 3: Commit**

```bash
git add BACKEND_API.md openspec/changes/2025-12-27-add-pro-entitlements/tasks.md openspec/changes/2025-12-27-add-pro-entitlements/verification-report.md
git commit -m "docs: add pro entitlement api docs and verification"
```

### Task 6: Full regression run

**Step 1: Run full tests**

Run: `npm test`
Expected: PASS

**Step 2: Commit (optional)**

```bash
git add openspec/changes/2025-12-27-add-pro-entitlements/verification-report.md
git commit -m "test: record regression run"
```
