# Session Expired Banner Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在无法自动刷新会话时，为“曾登录但会话过期”的用户展示非阻塞横幅，并保留首次未登录的 LandingPage 行为。

**Architecture:** 401 触发本地 session expired 标记 → `useAuth` 读取并计算 `signedIn` → `App` 用 `sessionExpired` 决定渲染 LandingPage 或 Dashboard → `DashboardPage` 顶部横幅提示登录。

**Tech Stack:** React + Vite, localStorage, Node test runner.

---

### Task 1: Write the failing tests

**Files:**
- Create: `test/dashboard-session-expired-banner.test.js`

**Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(rel) {
  return fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
}

test("auth storage exposes session expired helpers", () => {
  const src = read("dashboard/src/lib/auth-storage.js");
  assert.match(src, /SESSION_EXPIRED_KEY/);
  assert.match(src, /loadSessionExpired/);
  assert.match(src, /setSessionExpired/);
  assert.match(src, /clearSessionExpired/);
});

test("useAuth tracks sessionExpired and gates signedIn", () => {
  const src = read("dashboard/src/hooks/use-auth.js");
  assert.match(src, /sessionExpired/);
  assert.match(src, /signedIn/);
  assert.match(src, /!sessionExpired/);
});

test("App gates LandingPage on sessionExpired", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /!signedIn\s*&&\s*!mockEnabled\s*&&\s*!sessionExpired/);
});

test("DashboardPage shows session expired banner and bypasses auth gate", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /sessionExpired/);
  assert.match(src, /dashboard\.session_expired\.title/);
  assert.match(src, /requireAuthGate.*!sessionExpired/);
});

test("vibescore-api marks session expired on 401", () => {
  const src = read("dashboard/src/lib/vibescore-api.js");
  assert.match(src, /markSessionExpired/);
  assert.match(src, /status\s*===\s*401/);
});

test("copy registry includes session expired strings", () => {
  const src = read("dashboard/src/content/copy.csv");
  assert.ok(src.includes("dashboard.session_expired.title"));
  assert.ok(src.includes("dashboard.session_expired.body"));
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/dashboard-session-expired-banner.test.js`
Expected: FAIL with missing patterns for session expired logic and copy keys.

---

### Task 2: Add session expired storage helpers

**Files:**
- Modify: `dashboard/src/lib/auth-storage.js`

**Step 1: Write minimal implementation**

```js
const STORAGE_KEY = "vibescore.dashboard.auth.v1";
const SESSION_EXPIRED_KEY = "vibescore.dashboard.session_expired.v1";
const AUTH_EVENT_NAME = "vibescore:auth-storage";

function emitAuthStorageChange() {
  if (typeof window === "undefined" || !window.dispatchEvent) return;
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

export function loadSessionExpired() {
  try {
    const raw = localStorage.getItem(SESSION_EXPIRED_KEY);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.expiredAt === "string") return true;
    } catch (_e) {
      return true;
    }
    return raw === "true";
  } catch (_e) {
    return false;
  }
}

export function setSessionExpired() {
  try {
    localStorage.setItem(
      SESSION_EXPIRED_KEY,
      JSON.stringify({ expiredAt: new Date().toISOString() })
    );
  } catch (_e) {
    return;
  } finally {
    emitAuthStorageChange();
  }
}

export function clearSessionExpired() {
  try {
    localStorage.removeItem(SESSION_EXPIRED_KEY);
  } catch (_e) {
    return;
  } finally {
    emitAuthStorageChange();
  }
}

export function markSessionExpired() {
  setSessionExpired();
  clearAuthStorage();
}

export function subscribeAuthStorage(handler) {
  if (typeof window === "undefined" || !window.addEventListener) return () => {};
  const onChange = () => {
    handler({
      auth: loadAuthFromStorage(),
      sessionExpired: loadSessionExpired(),
    });
  };
  window.addEventListener(AUTH_EVENT_NAME, onChange);
  return () => window.removeEventListener(AUTH_EVENT_NAME, onChange);
}
```

**Step 2: Run test to verify it passes**

Run: `node --test test/dashboard-session-expired-banner.test.js`
Expected: still FAIL (other logic not implemented yet).

---

### Task 3: Update useAuth to track sessionExpired

**Files:**
- Modify: `dashboard/src/hooks/use-auth.js`

**Step 1: Write minimal implementation**

```js
import {
  clearAuthStorage,
  clearSessionExpired,
  loadAuthFromStorage,
  loadSessionExpired,
  saveAuthToStorage,
  subscribeAuthStorage,
} from "../lib/auth-storage.js";

export function useAuth() {
  const [auth, setAuth] = useState(() => loadAuthFromStorage());
  const [sessionExpired, setSessionExpired] = useState(() => loadSessionExpired());

  useEffect(() => {
    const unsubscribe = subscribeAuthStorage(({ auth: nextAuth, sessionExpired: nextExpired }) => {
      setAuth(nextAuth);
      setSessionExpired(nextExpired);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const path = window.location.pathname.replace(/\/+$/, "");
    if (path !== "/auth/callback") return;

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token") || "";
    if (!accessToken) return;

    clearSessionExpired();
    const next = { /* existing fields */ };
    saveAuthToStorage(next);
    setAuth(next);
    setSessionExpired(false);
    window.history.replaceState({}, "", "/");
  }, []);

  const signOut = useCallback(() => {
    clearAuthStorage();
    clearSessionExpired();
    setAuth(null);
    setSessionExpired(false);
  }, []);

  const effectiveAuth = sessionExpired ? null : auth;

  return {
    auth: effectiveAuth,
    signedIn: Boolean(effectiveAuth?.accessToken),
    sessionExpired,
    signOut,
  };
}
```

**Step 2: Run test to verify it passes**

Run: `node --test test/dashboard-session-expired-banner.test.js`
Expected: still FAIL (App/Dashboard/vibescore-api/copy not updated).

---

### Task 4: Update App gating for sessionExpired

**Files:**
- Modify: `dashboard/src/App.jsx`

**Step 1: Write minimal implementation**

```js
const { auth, signedIn, signOut, sessionExpired } = useAuth();
const accessEnabled = signedIn || mockEnabled || sessionExpired;
if (!accessEnabled) {
  content = <LandingPage signInUrl={signInUrl} />;
} else {
  content = (
    <Suspense ...>
      <DashboardPage
        baseUrl={baseUrl}
        auth={auth}
        signedIn={signedIn}
        sessionExpired={sessionExpired}
        signOut={signOut}
      />
    </Suspense>
  );
}
```

**Step 2: Run test to verify it passes**

Run: `node --test test/dashboard-session-expired-banner.test.js`
Expected: still FAIL (banner/copy/vibescore-api).

---

### Task 5: Add session expired banner to DashboardPage

**Files:**
- Modify: `dashboard/src/pages/DashboardPage.jsx`

**Step 1: Write minimal implementation**

```jsx
export function DashboardPage({ baseUrl, auth, signedIn, sessionExpired, signOut }) {
  // ...
  const requireAuthGate = !signedIn && !mockEnabled && !sessionExpired;
  // ...
  <MatrixShell ...>
    {sessionExpired ? (
      <div className="mb-6">
        <AsciiBox title={copy("dashboard.session_expired.title")} subtitle={copy("dashboard.session_expired.subtitle")}>
          <p className="text-[10px] opacity-50 mt-0">
            {copy("dashboard.session_expired.body")}
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <MatrixButton as="a" primary href={signInUrl}>
              {copy("shared.button.sign_in")}
            </MatrixButton>
            <MatrixButton as="a" href={signUpUrl}>
              {copy("shared.button.sign_up")}
            </MatrixButton>
          </div>
        </AsciiBox>
      </div>
    ) : null}
    {/* existing content */}
  </MatrixShell>
}
```

**Step 2: Run test to verify it passes**

Run: `node --test test/dashboard-session-expired-banner.test.js`
Expected: still FAIL (copy/vibescore-api).

---

### Task 6: Mark session expired on 401 in vibescore-api

**Files:**
- Modify: `dashboard/src/lib/vibescore-api.js`

**Step 1: Write minimal implementation**

```js
import { markSessionExpired } from "./auth-storage.js";

function normalizeSdkError(error, errorPrefix) {
  const status = error?.statusCode ?? error?.status;
  if (status === 401) {
    markSessionExpired();
  }
  // existing normalize logic
}
```

**Step 2: Run test to verify it passes**

Run: `node --test test/dashboard-session-expired-banner.test.js`
Expected: still FAIL (copy missing).

---

### Task 7: Add copy registry keys

**Files:**
- Modify: `dashboard/src/content/copy.csv`

**Step 1: Add new keys**

```
dashboard.session_expired.title,dashboard,DashboardPage,Banner,title,"Session_Expired",,active

dashboard.session_expired.subtitle,dashboard,DashboardPage,Banner,subtitle,"REAUTH_REQUIRED",,active

dashboard.session_expired.body,dashboard,DashboardPage,Banner,body,"Your session expired. Sign in again to refresh private usage data.",,active
```

**Step 2: Run test to verify it passes**

Run: `node --test test/dashboard-session-expired-banner.test.js`
Expected: PASS.

---

### Task 8: Full verification

**Step 1: Run full test suite**
Run: `npm test`
Expected: PASS

**Step 2: Validate copy registry**
Run: `node scripts/validate-copy-registry.cjs`
Expected: no errors

**Step 3: Manual check**
- Force a 401 (invalidate token) and confirm banner renders while page stays visible.

---

### Task 9: Commit

```bash
git add test/dashboard-session-expired-banner.test.js \
  dashboard/src/lib/auth-storage.js \
  dashboard/src/lib/vibescore-api.js \
  dashboard/src/hooks/use-auth.js \
  dashboard/src/App.jsx \
  dashboard/src/pages/DashboardPage.jsx \
  dashboard/src/content/copy.csv

git commit -m "feat(dashboard): add session expired banner"
```
