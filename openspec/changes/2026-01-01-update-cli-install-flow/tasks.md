## 1. Implementation
- [x] Add consent-first init UI (menu + privacy header) with non-interactive fallback.
- [x] Improve interactive menu to support arrow key navigation.
- [x] Add spinner phase and suppress verbose logs during setup.
- [x] Collect integration results and render a transparency report (updated vs skipped).
- [x] Add explicit final-step prompt to open browser; render success box after auth.
- [x] Add `--yes` and `--dry-run` flags; update CLI help output.
- [x] Replace background sync spawn errors with a user-facing warning.
- [x] (Optional) Add `prompts`, `ora`, `boxen` or equivalent internal helpers.

## 2. Tests
- [x] Update `test/init-uninstall.test.js` to run init with `--yes` (no prompts).
- [x] Update acceptance scripts to pass `--yes` and avoid TTY hangs.
- [ ] Add regression check for dry-run no-write behavior (if kept).

## 3. Verification
- [x] Run `node --test test/init-uninstall.test.js test/init-spawn-error.test.js`.
- [x] Run `node scripts/acceptance/gemini-hook-install.cjs`.
- [x] Run `node scripts/acceptance/opencode-plugin-install.cjs`.
- [x] Manual smoke: `npx --yes @vibescore/tracker init --no-open` (no-auth and link-code paths).

## 4. Docs
- [x] Update CLI install copy in `README.md` and `README.zh-CN.md`.
- [ ] (Optional) Update dashboard install copy in `dashboard/src/content/copy.csv`.
