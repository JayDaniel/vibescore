# Auth Session Expiry Recovery Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement explicit auth state machine and expired gating so private requests/data are blocked until JWT revalidation succeeds.

**Architecture:** Client-only auth state machine in `dashboard/src/App.jsx`; `DashboardPage` gates private UI; revalidation uses latest token via `getInsforgeAccessToken()`; `vibescore-api` remains the JWT success/401 signal source for clearing/marking expiry.

**Tech Stack:** React (Vite), @insforge/react-router, node:test.

---

### Task 1: Update auth session-expiry tests (RED)

**Files:**
- Modify: `test/dashboard-session-expired-banner.test.js`

**Step 1: Write the failing test**

Add/replace the following test blocks (keep other tests unchanged):

```js
test("App derives signedIn from sessionExpired gate", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /const signedIn\s*=\s*.*!sessionExpired/);
});
```

```js
test("App disables auth when session expired", () => {
  const src = read("dashboard/src/App.jsx");
  const match = src.match(/useMemo\([\s\S]*?\n\s*if\s*\(sessionExpired\)\s*return\s*null;/);
  assert.ok(match, "expected auth guard for sessionExpired");
});
```

Replace the existing revalidation test with:

```js
test("App probes backend to revalidate expired sessions", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /probeBackend/);
  assert.match(src, /sessionExpired/);
  assert.match(src, /getInsforgeAccessToken\(\)[\s\S]*probeBackend/);
});
```

Replace the existing Dashboard auth-access-token test with:

```js
test("DashboardPage disables auth access token when session expired", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /const authAccessToken\s*=\s*signedIn\s*\?\s*\(?\s*auth\?\.getAccessToken/);
});
```

Add the expired gate and backend status tests:

```js
test("DashboardPage gates expired UI", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /const showExpiredGate\s*=\s*sessionExpired\s*&&\s*!publicMode/);
  assert.match(src, /showExpiredGate\s*\?\s*\(/);
});
```

```js
test("DashboardPage disables backend status when signed out or expired", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /const headerStatus\s*=\s*signedIn\s*\?\s*\(\s*<BackendStatus/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/dashboard-session-expired-banner.test.js`

Expected: FAIL on new assertions (signedIn/sessionExpired guard, expired gate, backend status gating).

---

### Task 2: Implement auth state machine + revalidate (GREEN)

**Files:**
- Modify: `dashboard/src/App.jsx`

**Step 1: Guard auth with sessionExpired and derive signedIn from state**

Replace the current `signedIn` and `auth` wiring with:

```jsx
  const signedIn = useInsforge && !sessionExpired;

  const auth = useMemo(() => {
    if (!useInsforge || sessionExpired) return null;
    return insforgeAuth ?? insforgeAuthFallback;
  }, [insforgeAuth, insforgeAuthFallback, sessionExpired, useInsforge]);
```

**Step 2: Revalidate using latest token**

Replace the session-expired revalidation effect with:

```jsx
  useEffect(() => {
    if (!sessionExpired) {
      lastProbeTokenRef.current = null;
      return;
    }
    if (!insforgeSignedIn) {
      lastProbeTokenRef.current = null;
      return;
    }
    let active = true;
    (async () => {
      const token = await getInsforgeAccessToken();
      if (!active) return;
      if (!token || token === lastProbeTokenRef.current) return;
      lastProbeTokenRef.current = token;
      probeBackend({ baseUrl, accessToken: token }).catch(() => {});
    })();
    return () => {
      active = false;
    };
  }, [baseUrl, getInsforgeAccessToken, insforgeSignedIn, sessionExpired]);
```

**Step 3: Run test to verify it still fails (expected)**

Run: `node --test test/dashboard-session-expired-banner.test.js`

Expected: FAIL (DashboardPage gating tests still failing).

---

### Task 3: Implement Dashboard expired gating + backend status gate (GREEN)

**Files:**
- Modify: `dashboard/src/pages/DashboardPage.jsx`

**Step 1: Gate authAccessToken on signedIn**

Replace the `authAccessToken` block with:

```jsx
  const authAccessToken = signedIn
    ? auth?.getAccessToken ?? auth?.accessToken ?? null
    : null;
```

**Step 2: Add expired gate + backend status gate**

Add the gate booleans near the existing auth gate:

```jsx
  const showExpiredGate = sessionExpired && !publicMode;
  const requireAuthGate = !signedIn && !mockEnabled && !sessionExpired;
  const showAuthGate = requireAuthGate && !publicMode;
```

Update `headerStatus` to only render when signed in:

```jsx
  const headerStatus = signedIn ? (
    <BackendStatus baseUrl={baseUrl} accessToken={authAccessToken} />
  ) : null;
```

**Step 3: Gate main UI by expired/auth state**

Replace the render section that currently shows both the expired banner and the grid with a single gate:

```jsx
        {showExpiredGate ? (
          <div className="mb-6">
            <AsciiBox
              title={copy("dashboard.session_expired.title")}
              subtitle={copy("dashboard.session_expired.subtitle")}
              className="border-[#00FF41]/40"
            >
              {/* keep existing expired copy + buttons */}
            </AsciiBox>
          </div>
        ) : showAuthGate ? (
          <div className="flex items-center justify-center">
            <AsciiBox
              title={copy("dashboard.auth_required.title")}
              subtitle={copy("dashboard.auth_required.subtitle")}
              className="w-full max-w-2xl"
            >
              {/* keep existing auth required copy + buttons */}
            </AsciiBox>
          </div>
        ) : (
          <>
            {/* keep existing dashboard grid content */}
          </>
        )}
```

**Step 4: Run test to verify it passes**

Run: `node --test test/dashboard-session-expired-banner.test.js`

Expected: PASS.

---

### Task 4: Canvas + OpenSpec + regression record + commit

**Files:**
- Modify: `architecture.canvas`
- Modify: `openspec/changes/2026-01-15-auth-session-expiry-recovery/tasks.md`
- Modify: `docs/pr/2026-01-15-auth-session-expiry-recovery.md`

**Step 1: Update canvas to Implemented**

Run generator, then re-apply status notes as Implemented:

```bash
node scripts/ops/architecture-canvas.cjs
python3 - <<'PY'
import json, re
path='architecture.canvas'
with open(path) as f:
    data=json.load(f)

updates = {
    'entry_App_50b6270d': {
        'role': '认证状态机与过期恢复控制',
        'notes': 'sessionExpired 清理由 JWT 成功决定；revalidate 使用最新 token。',
    },
    'frontend_DashboardPage_9ebda834': {
        'role': '私有视图渲染与过期态 gating',
        'notes': 'sessionExpired 时隐藏私有数据并阻断私有请求。',
    },
    'utils_auth-storage_f3bd6b20': {
        'role': '认证持久化存储',
        'notes': '仅在 JWT 成功后清除 sessionExpired。',
    },
    'utils_vibescore-api_4e9bf839': {
        'role': 'JWT 授权请求与过期信号源',
        'notes': '401 设为过期，成功才清除。',
    },
    'undefined_use-backend-status_f6637b78': {
        'role': '后端探测调度（非过期态）',
        'notes': '仅在 signed_in 且非 sessionExpired 时探测。',
    },
}

for node in data.get('nodes', []):
    if node.get('id') not in updates:
        continue
    text = node.get('text', '')
    text = re.sub(r"\n\nRole:.*", "", text, flags=re.S)
    block = (
        f"Role: {updates[node['id']]['role']}\n"
        "Status: Implemented\n"
        f"Notes: {updates[node['id']]['notes']}"
    )
    node['text'] = text.rstrip() + "\n\n" + block + "\n"

with open(path, 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
PY
```

**Step 2: Mark OpenSpec tasks complete**

Update checkboxes in `openspec/changes/2026-01-15-auth-session-expiry-recovery/tasks.md` to `[x]` for implemented items and verification.

**Step 3: Record regression command + result**

In `docs/pr/2026-01-15-auth-session-expiry-recovery.md`, add the latest run date to the verification line, e.g.

```md
- [x] `node --test test/dashboard-session-expired-banner.test.js` => PASS (2026-01-15)
```

**Step 4: Commit**

```bash
git add test/dashboard-session-expired-banner.test.js \
  dashboard/src/App.jsx \
  dashboard/src/pages/DashboardPage.jsx \
  architecture.canvas \
  openspec/changes/2026-01-15-auth-session-expiry-recovery/tasks.md \
  docs/pr/2026-01-15-auth-session-expiry-recovery.md

git commit -m "feat(auth): enforce session expiry state machine"
```
