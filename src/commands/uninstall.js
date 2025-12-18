const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');

const { readJson } = require('../lib/fs');
const { restoreCodexNotify } = require('../lib/codex-config');

async function cmdUninstall(argv) {
  const opts = parseArgs(argv);
  const home = os.homedir();
  const trackerDir = path.join(home, '.vibescore', 'tracker');
  const binDir = path.join(home, '.vibescore', 'bin');
  const codexConfigPath = path.join(home, '.codex', 'config.toml');
  const notifyOriginalPath = path.join(trackerDir, 'codex_notify_original.json');

  await restoreCodexNotify({
    codexConfigPath,
    notifyOriginalPath
  });

  // Remove installed notify handler.
  const notifyPath = path.join(binDir, 'notify.cjs');
  await fs.unlink(notifyPath).catch(() => {});

  // Remove local app runtime (installed by init for notify-driven sync).
  await fs.rm(path.join(trackerDir, 'app'), { recursive: true, force: true }).catch(() => {});

  if (opts.purge) {
    await fs.rm(path.join(home, '.vibescore'), { recursive: true, force: true }).catch(() => {});
  }

  process.stdout.write(
    [
      'Uninstalled:',
      `- Codex notify restored: ${codexConfigPath}`,
      opts.purge ? `- Purged: ${path.join(home, '.vibescore')}` : '- Purge: skipped (use --purge)',
      ''
    ].join('\n')
  );
}

function parseArgs(argv) {
  const out = { purge: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--purge') out.purge = true;
    else throw new Error(`Unknown option: ${a}`);
  }
  return out;
}

module.exports = { cmdUninstall };
