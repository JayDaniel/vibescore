const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const { buildDoctorReport } = require('../src/lib/doctor');

test('doctor treats any HTTP response as reachable', async () => {
  const report = await buildDoctorReport({
    runtime: { baseUrl: 'https://example' },
    fetch: async () => ({ status: 401 })
  });
  const check = report.checks.find((c) => c.id === 'network.base_url');

  assert.equal(check.status, 'ok');
  assert.equal(check.meta.status_code, 401);
});

test('doctor warns when base_url is missing', async () => {
  const report = await buildDoctorReport({
    runtime: {},
    fetch: async () => ({ status: 200 })
  });
  const check = report.checks.find((c) => c.id === 'network.base_url');

  assert.equal(check.status, 'warn');
  assert.equal(report.summary.warn, 2);
  assert.equal(report.summary.fail, 1);
  assert.equal(report.ok, true);
});

test('doctor marks network errors as fail', async () => {
  const report = await buildDoctorReport({
    runtime: { baseUrl: 'https://example' },
    fetch: async () => {
      throw new Error('nope');
    }
  });
  const check = report.checks.find((c) => c.id === 'network.base_url');

  assert.equal(check.status, 'fail');
  assert.equal(report.summary.fail, 1);
  assert.equal(report.summary.warn, 1);
  assert.equal(report.ok, true);
});

test('doctor reports runtime config status', async () => {
  const report = await buildDoctorReport({
    runtime: { baseUrl: 'https://example', deviceToken: 'token' },
    fetch: async () => ({ status: 200 })
  });
  const baseCheck = report.checks.find((c) => c.id === 'runtime.base_url');
  const tokenCheck = report.checks.find((c) => c.id === 'runtime.device_token');

  assert.equal(baseCheck.status, 'ok');
  assert.equal(tokenCheck.status, 'ok');
});

test('doctor marks invalid config.json as critical', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibeusage-doctor-'));
  const trackerDir = path.join(tmp, '.vibeusage', 'tracker');
  await fs.mkdir(trackerDir, { recursive: true });
  const configPath = path.join(trackerDir, 'config.json');
  await fs.writeFile(configPath, '{bad', 'utf8');

  const report = await buildDoctorReport({
    runtime: { baseUrl: 'https://example' },
    fetch: async () => ({ status: 200 }),
    paths: { trackerDir, configPath }
  });
  const configCheck = report.checks.find((c) => c.id === 'fs.config_json');

  assert.equal(configCheck.status, 'fail');
  assert.equal(configCheck.critical, true);
});
