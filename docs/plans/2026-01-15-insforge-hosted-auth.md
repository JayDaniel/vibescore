# InsForge Hosted Auth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace brittle OAuth callback parsing with InsForge hosted auth routes and SDK session gating while keeping a temporary local-auth fallback.

**Architecture:** Use `@insforge/react-router` to provide hosted `/sign-in` and `/sign-up` routes from `dashboard/src/main.jsx`, then gate the dashboard in `dashboard/src/App.jsx` using InsForge session state with a fallback to existing `use-auth` storage. Landing login links point to hosted routes by default; local CLI redirect continues to use the existing `auth-url` helper.

**Tech Stack:** React + React Router, InsForge SDK (`@insforge/react-router`), existing `use-auth` storage, Node test runner.

### Task 1: Add hosted auth routing test coverage

**Files:**
- Modify: `test/dashboard-session-expired-banner.test.js`
- (Optional) Modify: `dashboard/src/main.jsx` (only after failing test)

**Step 1: Write the failing test**

Add a test that expects `dashboard/src/main.jsx` to reference `@insforge/react-router` and wire hosted routes.

```js
test("main wires InsForge hosted auth routes", () => {
  const src = fs.readFileSync(
    path.resolve("dashboard/src/main.jsx"),
    "utf8"
  );
  expect(src).toContain("@insforge/react-router");
  expect(src).toContain("getInsforgeRoutes");
  expect(src).toContain("/sign-in");
  expect(src).toContain("/sign-up");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/dashboard-session-expired-banner.test.js`
Expected: FAIL with missing `@insforge/react-router`/`getInsforgeRoutes` references.

**Step 3: Write minimal implementation**

Update `dashboard/src/main.jsx` to create a router with hosted auth routes and wrap the app in `InsforgeProvider`.

```js
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { InsforgeProvider, getInsforgeRoutes } from "@insforge/react-router";
import { insforgeAuthClient } from "./lib/insforge-auth-client.js";

const router = createBrowserRouter([
  ...getInsforgeRoutes({ afterSignInUrl: "/", afterSignUpUrl: "/" }),
  { path: "*", element: <App /> },
]);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <InsforgeProvider client={insforgeAuthClient}>
      <RouterProvider router={router} />
    </InsforgeProvider>
  </React.StrictMode>
);
```

**Step 4: Run test to verify it passes**

Run: `node --test test/dashboard-session-expired-banner.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add dashboard/src/main.jsx test/dashboard-session-expired-banner.test.js
git commit -m "test(auth): assert hosted auth router wiring"
```

### Task 2: Add InsForge auth client wrapper

**Files:**
- Create: `dashboard/src/lib/insforge-auth-client.js`
- Modify: `dashboard/src/lib/config.js` (if needed for base url/anon key helpers)

**Step 1: Write the failing test**

Add a test that ensures the auth client wrapper exists and uses `createClient` with `getInsforgeBaseUrl` and `getInsforgeAnonKey`.

```js
test("insforge auth client wrapper uses base url and anon key", () => {
  const src = fs.readFileSync(
    path.resolve("dashboard/src/lib/insforge-auth-client.js"),
    "utf8"
  );
  expect(src).toContain("createClient");
  expect(src).toContain("getInsforgeBaseUrl");
  expect(src).toContain("getInsforgeAnonKey");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/dashboard-session-expired-banner.test.js`
Expected: FAIL because file does not exist.

**Step 3: Write minimal implementation**

Create `dashboard/src/lib/insforge-auth-client.js`:

```js
import { createClient } from "@insforge/sdk";
import { getInsforgeAnonKey, getInsforgeBaseUrl } from "./config.js";

export const insforgeAuthClient = createClient(
  getInsforgeBaseUrl(),
  getInsforgeAnonKey()
);
```

**Step 4: Run test to verify it passes**

Run: `node --test test/dashboard-session-expired-banner.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add dashboard/src/lib/insforge-auth-client.js test/dashboard-session-expired-banner.test.js
git commit -m "feat(auth): add insforge auth client wrapper"
```

### Task 3: Landing login should target hosted auth routes

**Files:**
- Modify: `test/dashboard-session-expired-banner.test.js`
- Modify: `dashboard/src/App.jsx`
- Modify: `dashboard/src/pages/LandingPage.jsx`

**Step 1: Write the failing test**

Add a test that verifies the landing sign-in URL defaults to `/sign-in` when no safe redirect is provided.

```js
test("App uses hosted auth routes for Landing login", () => {
  const src = fs.readFileSync(
    path.resolve("dashboard/src/App.jsx"),
    "utf8"
  );
  expect(src).toContain("/sign-in");
  expect(src).toContain("/sign-up");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/dashboard-session-expired-banner.test.js`
Expected: FAIL because `/auth/sign-in` is still used.

**Step 3: Write minimal implementation**

In `dashboard/src/App.jsx`, set default landing links to `/sign-in` and `/sign-up`, but preserve the CLI safe-redirect flow using `buildAuthUrl` when `redirect` query is present.

```js
const hostedSignInUrl = "/sign-in";
const hostedSignUpUrl = "/sign-up";

const signInUrl = safeRedirect
  ? buildAuthUrl({ baseUrl: authBaseUrl, path: "/auth/sign-in", redirectUrl: safeRedirect })
  : hostedSignInUrl;

const signUpUrl = safeRedirect
  ? buildAuthUrl({ baseUrl: authBaseUrl, path: "/auth/sign-up", redirectUrl: safeRedirect })
  : hostedSignUpUrl;
```

LandingPage props stay the same (just different URLs).

**Step 4: Run test to verify it passes**

Run: `node --test test/dashboard-session-expired-banner.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add dashboard/src/App.jsx test/dashboard-session-expired-banner.test.js
git commit -m "feat(auth): route landing to hosted auth"
```

### Task 4: Switch signed-in gating to InsForge session (with fallback)

**Files:**
- Modify: `test/dashboard-session-expired-banner.test.js`
- Modify: `dashboard/src/App.jsx`
- Modify: `dashboard/src/hooks/use-auth.js`

**Step 1: Write the failing test**

Add a test that asserts App uses `@insforge/react-router` `useAuth` as the primary auth source.

```js
test("App uses InsForge auth hook for signed-in gating", () => {
  const src = fs.readFileSync(
    path.resolve("dashboard/src/App.jsx"),
    "utf8"
  );
  expect(src).toContain("@insforge/react-router");
  expect(src).toContain("useAuth");
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/dashboard-session-expired-banner.test.js`
Expected: FAIL.

**Step 3: Write minimal implementation**

Update `dashboard/src/App.jsx`:
- Import `useAuth` from `@insforge/react-router` as `useInsforgeAuth`.
- Keep existing local `useAuth` for fallback.
- Prefer InsForge session state when available (`isSignedIn` + `session?.accessToken`).
- If InsForge is signed in, clear legacy `sessionExpired` via `clearSessionExpired()`.

In `dashboard/src/hooks/use-auth.js`, export `clearSessionExpired` and `loadSessionExpired` if not already exposed.

**Step 4: Run test to verify it passes**

Run: `node --test test/dashboard-session-expired-banner.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add dashboard/src/App.jsx dashboard/src/hooks/use-auth.js test/dashboard-session-expired-banner.test.js
git commit -m "feat(auth): gate dashboard by insforge session"
```

### Task 5: Manual hosted-auth regression script

**Files:**
- Create: `docs/pr/2026-01-15-insforge-hosted-auth.md`

**Step 1: Write the manual regression steps**

Document the manual flow:
1. Open `https://www.vibeusage.cc/` in incognito.
2. Click “Login” and confirm hosted `/sign-in` loads.
3. Complete OAuth login and ensure you land back on `/` with dashboard visible.
4. Confirm network call uses `Authorization: Bearer <accessToken>` from InsForge session.

**Step 2: Commit**

```bash
git add docs/pr/2026-01-15-insforge-hosted-auth.md
git commit -m "docs(auth): add hosted auth manual regression"
```

### Task 6: Update OpenSpec tasks + architecture canvas status

**Files:**
- Modify: `openspec/changes/2026-01-15-adopt-insforge-hosted-auth/tasks.md`
- Modify: `architecture.canvas`

**Step 1: Mark tasks complete**

Set all `tasks.md` items to `[x]` after implementation.

**Step 2: Update canvas statuses**

Change `insforge-auth-router` node `Status: Implemented` and re-run:
`node scripts/ops/architecture-canvas.cjs --focus dashboard --out architecture.focus.canvas`

**Step 3: Commit**

```bash
git add openspec/changes/2026-01-15-adopt-insforge-hosted-auth/tasks.md architecture.canvas architecture.focus.canvas
git commit -m "docs(architecture): mark hosted auth implemented"
```
