const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const { test } = require('node:test');

const { cmdSync } = require('../src/commands/sync');

test('sync --auto schedules retry when throttled and pending', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibeusage-auto-retry-'));
  const prevHome = process.env.HOME;
  const prevCodexHome = process.env.CODEX_HOME;
  const prevNoSpawn = process.env.VIBEUSAGE_AUTO_RETRY_NO_SPAWN;

  try {
    process.env.HOME = tmp;
    process.env.CODEX_HOME = path.join(tmp, '.codex');
    process.env.VIBEUSAGE_AUTO_RETRY_NO_SPAWN = '1';

    const trackerDir = path.join(tmp, '.vibeusage', 'tracker');
    await fs.mkdir(trackerDir, { recursive: true });
    await fs.mkdir(process.env.CODEX_HOME, { recursive: true });

    await fs.writeFile(
      path.join(trackerDir, 'config.json'),
      JSON.stringify({ baseUrl: 'https://example.invalid', deviceToken: 'token', deviceId: 'device' }, null, 2) + '\n',
      'utf8'
    );

    const queueLine = JSON.stringify({
      hour_start: '2025-12-23T00:00:00.000Z',
      input_tokens: 1,
      cached_input_tokens: 0,
      output_tokens: 0,
      reasoning_output_tokens: 0,
      total_tokens: 1
    });
    await fs.writeFile(path.join(trackerDir, 'queue.jsonl'), queueLine + '\n', 'utf8');
    await fs.writeFile(path.join(trackerDir, 'queue.state.json'), JSON.stringify({ offset: 0 }) + '\n', 'utf8');

    const nextAllowedAtMs = Date.now() + 60_000;
    await fs.writeFile(
      path.join(trackerDir, 'upload.throttle.json'),
      JSON.stringify({ version: 1, lastSuccessMs: 0, nextAllowedAtMs, backoffUntilMs: 0, backoffStep: 0 }, null, 2) + '\n',
      'utf8'
    );

    await cmdSync(['--auto']);

    const retryRaw = await fs.readFile(path.join(trackerDir, 'auto.retry.json'), 'utf8');
    const retry = JSON.parse(retryRaw);

    assert.ok(Number.isFinite(retry.retryAtMs), 'retryAtMs should be set');
    assert.ok(retry.retryAtMs >= nextAllowedAtMs, 'retryAtMs should be at or after nextAllowedAtMs');
    assert.equal(retry.reason, 'throttled');
    assert.equal(retry.pendingBytes > 0, true);
  } finally {
    if (prevHome === undefined) delete process.env.HOME;
    else process.env.HOME = prevHome;
    if (prevCodexHome === undefined) delete process.env.CODEX_HOME;
    else process.env.CODEX_HOME = prevCodexHome;
    if (prevNoSpawn === undefined) delete process.env.VIBEUSAGE_AUTO_RETRY_NO_SPAWN;
    else process.env.VIBEUSAGE_AUTO_RETRY_NO_SPAWN = prevNoSpawn;
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
