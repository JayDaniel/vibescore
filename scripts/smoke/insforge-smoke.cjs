#!/usr/bin/env node
'use strict';

/**
 * Developer smoke test (requires a verified email/password account).
 *
 * Env:
 * - VIBESCORE_INSFORGE_BASE_URL (default https://5tmappuk.us-east.insforge.app)
 * - VIBESCORE_SMOKE_EMAIL (required)
 * - VIBESCORE_SMOKE_PASSWORD (required)
 */

const assert = require('node:assert/strict');

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});

async function main() {
  const baseUrl = process.env.VIBESCORE_INSFORGE_BASE_URL || 'https://5tmappuk.us-east.insforge.app';
  const email = process.env.VIBESCORE_SMOKE_EMAIL || '';
  const password = process.env.VIBESCORE_SMOKE_PASSWORD || '';

  if (!email || !password) {
    throw new Error('Missing env: VIBESCORE_SMOKE_EMAIL / VIBESCORE_SMOKE_PASSWORD');
  }

  const accessToken = await signInWithPassword({ baseUrl, email, password });
  const device = await issueDeviceToken({ baseUrl, accessToken, deviceName: `smoke-${Date.now()}` });

  const ev = buildEvent();
  const first = await ingest({ baseUrl, deviceToken: device.token, events: [ev] });
  const second = await ingest({ baseUrl, deviceToken: device.token, events: [ev] });

  assert.equal(first.success, true);
  assert.equal(second.success, true);
  assert.equal(first.inserted, 1);
  assert.equal(first.skipped, 0);
  assert.equal(second.inserted, 0);
  assert.equal(second.skipped, 1);

  const summary = await usageSummary({ baseUrl, accessToken });
  assert.ok(summary && summary.totals && typeof summary.totals.total_tokens === 'string');

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl,
        deviceId: device.deviceId,
        ingest: { first, second },
        summary: summary.totals
      },
      null,
      2
    )
  );
}

function buildEvent() {
  const now = new Date();
  const id = `smoke_${now.toISOString()}_${Math.random().toString(16).slice(2)}`;
  return {
    event_id: id,
    token_timestamp: now.toISOString(),
    model: 'smoke',
    input_tokens: 1,
    cached_input_tokens: 0,
    output_tokens: 2,
    reasoning_output_tokens: 0,
    total_tokens: 3
  };
}

async function signInWithPassword({ baseUrl, email, password }) {
  const url = new URL('/api/auth/sessions', baseUrl).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const { data, error } = await readJson(res);
  if (!res.ok) throw new Error(`Sign-in failed: ${error || `HTTP ${res.status}`}`);

  const accessToken = data?.accessToken;
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    throw new Error('Sign-in failed: missing accessToken');
  }

  return accessToken;
}

async function issueDeviceToken({ baseUrl, accessToken, deviceName }) {
  const url = new URL('/functions/vibescore-device-token-issue', baseUrl).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_name: deviceName, platform: 'macos' })
  });

  const { data, error } = await readJson(res);
  if (!res.ok) throw new Error(`Device token issue failed: ${error || `HTTP ${res.status}`}`);

  const token = data?.token;
  const deviceId = data?.device_id;
  if (typeof token !== 'string' || token.length === 0) throw new Error('Device token issue failed: missing token');
  if (typeof deviceId !== 'string' || deviceId.length === 0) throw new Error('Device token issue failed: missing device_id');

  return { token, deviceId };
}

async function ingest({ baseUrl, deviceToken, events }) {
  const url = new URL('/functions/vibescore-ingest', baseUrl).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${deviceToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ events })
  });

  const { data, error } = await readJson(res);
  if (!res.ok) throw new Error(`Ingest failed: ${error || `HTTP ${res.status}`}`);

  return data;
}

async function usageSummary({ baseUrl, accessToken }) {
  const url = new URL('/functions/vibescore-usage-summary', baseUrl).toString();
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const { data, error } = await readJson(res);
  if (!res.ok) throw new Error(`Usage summary failed: ${error || `HTTP ${res.status}`}`);

  return data;
}

async function readJson(res) {
  const text = await res.text();
  if (!text) return { data: null, error: null };
  try {
    const parsed = JSON.parse(text);
    return { data: parsed, error: parsed?.error || parsed?.message || null };
  } catch (_e) {
    return { data: null, error: text.slice(0, 300) };
  }
}

