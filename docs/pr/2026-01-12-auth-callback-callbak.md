# PR Template (Minimal)

## PR Goal (one sentence)
Accept Insforge redirect typo /auth/callbak during dashboard auth callback.

## Commit Narrative
- fix(auth): accept /auth/callbak callback path
- test(auth): cover callbak auth callback parsing
- docs(freeze): record auth callback typo freeze gate
- docs(pr): record regression command and result

## Regression Test Gate
### Most likely regression surface
- Auth callback parsing and session restore.

### Verification method (choose at least one)
- [x] `node --test test/dashboard-session-expired-banner.test.js -t "callbak"` => PASS

### Uncovered scope
- Real Insforge login redirect in production.
