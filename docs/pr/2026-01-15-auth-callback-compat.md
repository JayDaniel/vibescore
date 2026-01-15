# PR Template (Minimal)

## PR Goal (one sentence)
Accept /callback as a legacy auth callback path for the dashboard.

## Commit Narrative
- fix(auth): accept /callback auth callback path
- test(auth): lock in explicit callback path list
- docs(pr): record regression command and result

## Regression Test Gate
### Most likely regression surface
- Auth callback parsing and session restore.

### Verification method (choose at least one)
- [x] `node --test test/dashboard-session-expired-banner.test.js` => PASS

### Uncovered scope
- Real Insforge login redirect in production.
