#!/usr/bin/env node
'use strict';

/**
 * Online regression check for usage cost consistency.
 *
 * Env:
 * - VIBEUSAGE_INSFORGE_BASE_URL (default https://5tmappuk.us-east.insforge.app)
 * - VIBEUSAGE_BEARER_TOKEN (required)
 * - VIBEUSAGE_FROM (optional, default today UTC)
 * - VIBEUSAGE_TO (optional, default VIBEUSAGE_FROM)
 * - VIBEUSAGE_TZ (optional, default UTC)
 * - VIBEUSAGE_TZ_OFFSET_MINUTES (optional, default 0)
 * - VIBEUSAGE_MODE (optional, default regression; options: regression|smoke)
 */

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});

async function main() {
  const config = readConfig();
  if (!config.token) {
    throw new Error('Missing env: VIBEUSAGE_BEARER_TOKEN');
  }

  const { baseUrl, mode } = config;
  const params = new URLSearchParams({
    from: config.from,
    to: config.to,
    tz: config.tz,
    tz_offset_minutes: String(config.tzOffsetMinutes)
  });

  const dailyUrl = new URL(`/functions/vibeusage-usage-daily?${params}`, baseUrl).toString();
  const summaryUrl = new URL(`/functions/vibeusage-usage-summary?${params}`, baseUrl).toString();
  const breakdownUrl = new URL(`/functions/vibeusage-usage-model-breakdown?${params}`, baseUrl).toString();

  const daily = await fetchJson(dailyUrl, config.token);
  const summary = await fetchJson(summaryUrl, config.token);
  const breakdown = await fetchJson(breakdownUrl, config.token);

  if (mode === 'smoke') {
    assertObject(daily?.summary?.totals, 'daily.summary.totals');
    assertObject(summary?.totals, 'summary.totals');
    if (!Array.isArray(breakdown?.sources)) {
      throw new Error('Expected breakdown.sources array');
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          mode,
          baseUrl,
          from: config.from,
          to: config.to,
          daily_cost: daily?.summary?.totals?.total_cost_usd || null,
          summary_cost: summary?.totals?.total_cost_usd || null,
          breakdown_sources: breakdown?.sources?.length || 0
        },
        null,
        2
      )
    );
    return;
  }

  const dailyCost = parseUsdToMicros(daily?.summary?.totals?.total_cost_usd, 'daily.summary.totals.total_cost_usd');
  const summaryCost = parseUsdToMicros(summary?.totals?.total_cost_usd, 'summary.totals.total_cost_usd');
  const breakdownCost = sumBreakdownCost(breakdown);

  if (dailyCost !== breakdownCost) {
    throw new Error(
      `Cost mismatch: daily=${formatUsdFromMicros(dailyCost)} breakdown=${formatUsdFromMicros(breakdownCost)}`
    );
  }
  if (summaryCost !== breakdownCost) {
    throw new Error(
      `Cost mismatch: summary=${formatUsdFromMicros(summaryCost)} breakdown=${formatUsdFromMicros(breakdownCost)}`
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode,
        baseUrl,
        from: config.from,
        to: config.to,
        daily_cost: formatUsdFromMicros(dailyCost),
        summary_cost: formatUsdFromMicros(summaryCost),
        breakdown_cost: formatUsdFromMicros(breakdownCost)
      },
      null,
      2
    )
  );
}

function readConfig() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = args.baseUrl || process.env.VIBEUSAGE_INSFORGE_BASE_URL || 'https://5tmappuk.us-east.insforge.app';
  const token = args.token || process.env.VIBEUSAGE_BEARER_TOKEN || '';
  const tz = args.tz || process.env.VIBEUSAGE_TZ || 'UTC';
  const tzOffsetMinutes = toNumber(
    args.tzOffsetMinutes ?? process.env.VIBEUSAGE_TZ_OFFSET_MINUTES,
    0
  );
  const from = args.from || process.env.VIBEUSAGE_FROM || todayUtc();
  const to = args.to || process.env.VIBEUSAGE_TO || from;
  const mode = (args.mode || process.env.VIBEUSAGE_MODE || 'regression').toLowerCase();
  if (!['regression', 'smoke'].includes(mode)) {
    throw new Error(`Invalid mode: ${mode}. Use regression|smoke.`);
  }
  return {
    baseUrl,
    token,
    from,
    to,
    tz,
    tzOffsetMinutes,
    mode
  };
}

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      result[keyToField(key)] = next;
      i += 1;
    } else {
      result[keyToField(key)] = true;
    }
  }
  return result;
}

function keyToField(key) {
  if (key === 'base-url') return 'baseUrl';
  if (key === 'tz-offset-minutes') return 'tzOffsetMinutes';
  return key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

async function fetchJson(url, token) {
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (_err) {
    body = text;
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}: ${JSON.stringify(body)}`);
  }
  return body;
}

function parseUsdToMicros(value, label) {
  if (typeof value !== 'string') {
    throw new Error(`Expected ${label} string, got ${typeof value}`);
  }
  const trimmed = value.trim();
  if (!/^[0-9]+(\.[0-9]+)?$/.test(trimmed)) {
    throw new Error(`Invalid USD string for ${label}: ${value}`);
  }
  const parts = trimmed.split('.');
  const whole = parts[0];
  const frac = (parts[1] || '').padEnd(6, '0').slice(0, 6);
  return BigInt(whole) * 1000000n + BigInt(frac);
}

function formatUsdFromMicros(value) {
  const dollars = value / 1000000n;
  const remainder = value % 1000000n;
  return `${dollars.toString()}.${remainder.toString().padStart(6, '0')}`;
}

function sumBreakdownCost(breakdown) {
  if (!Array.isArray(breakdown?.sources)) {
    throw new Error('Expected breakdown.sources array');
  }
  return breakdown.sources.reduce((sum, entry) => {
    const cost = parseUsdToMicros(entry?.totals?.total_cost_usd, 'breakdown.sources[].totals.total_cost_usd');
    return sum + cost;
  }, 0n);
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object') {
    throw new Error(`Expected ${label} object`);
  }
}
