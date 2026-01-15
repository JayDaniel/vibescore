## 1. Implementation
- [x] 1.1 Add InsForge provider + React Router entry in `dashboard/src/main.jsx`.
- [x] 1.2 Inject hosted auth routes and set `afterSignInUrl`/`afterSignUpUrl`.
- [x] 1.3 Route Landing login/sign-up actions to hosted auth routes.
- [x] 1.4 Switch dashboard signed-in gating to InsForge SDK session state.
- [x] 1.5 Keep `use-auth` fallback behind an explicit migration guard (temporary).
- [x] 1.6 Update copy registry if any visible auth copy changes.

## 2. Tests
- [x] 2.1 Add regression test to verify router/provider and hosted routes are wired.
- [x] 2.2 Add regression test to verify Landing login goes to `/sign-in`.
- [x] 2.3 Add a cold manual regression script for the real hosted auth flow.

## 3. Verification
- [x] 3.1 Run targeted tests and record commands/results in PR notes.
- [x] 3.2 Re-run architecture canvas generator and ensure proposed nodes are updated.
