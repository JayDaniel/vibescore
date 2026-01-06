// Edge function: vibescore-usage-model-breakdown
// Returns per-source, per-model usage aggregates for the authenticated user over a date range.

'use strict';

const { handleOptions, json } = require('../shared/http');
const { getBearerToken, getEdgeClientAndUserIdFast } = require('../shared/auth');
const { getBaseUrl } = require('../shared/env');
const { getSourceParam, normalizeSource } = require('../shared/source');
const { normalizeModel } = require('../shared/model');
const { normalizeUsageModelKey } = require('../shared/model-identity');
const { applyCanaryFilter } = require('../shared/canary');
const {
  addDatePartsDays,
  getUsageMaxDays,
  getUsageTimeZoneContext,
  listDateStrings,
  localDatePartsToUtc,
  normalizeDateRangeLocal,
  parseDateParts
} = require('../shared/date');
const { toBigInt } = require('../shared/numbers');
const { forEachPage } = require('../shared/pagination');
const {
  buildPricingMetadata,
  computeUsageCost,
  formatUsdFromMicros,
  resolvePricingProfile
} = require('../shared/pricing');
const { logSlowQuery, withRequestLogging } = require('../shared/logging');
const { isDebugEnabled, withSlowQueryDebugPayload } = require('../shared/debug');

const DEFAULT_SOURCE = 'codex';
const DEFAULT_MODEL = 'unknown';

module.exports = withRequestLogging('vibescore-usage-model-breakdown', async function(request, logger) {
  const opt = handleOptions(request);
  if (opt) return opt;

  const url = new URL(request.url);
  const debugEnabled = isDebugEnabled(url);
  const respond = (body, status, durationMs) => json(
    debugEnabled ? withSlowQueryDebugPayload(body, { logger, durationMs, status }) : body,
    status
  );

  if (request.method !== 'GET') return respond({ error: 'Method not allowed' }, 405, 0);

  const bearer = getBearerToken(request.headers.get('Authorization'));
  if (!bearer) return respond({ error: 'Missing bearer token' }, 401, 0);

  const baseUrl = getBaseUrl();
  const auth = await getEdgeClientAndUserIdFast({ baseUrl, bearer });
  if (!auth.ok) return respond({ error: 'Unauthorized' }, 401, 0);
  const tzContext = getUsageTimeZoneContext(url);
  const sourceResult = getSourceParam(url);
  if (!sourceResult.ok) return respond({ error: sourceResult.error }, 400, 0);
  const sourceFilter = sourceResult.source;

  const { from, to } = normalizeDateRangeLocal(
    url.searchParams.get('from'),
    url.searchParams.get('to'),
    tzContext
  );

  const dayKeys = listDateStrings(from, to);
  const maxDays = getUsageMaxDays();
  if (dayKeys.length > maxDays) {
    return respond({ error: `Date range too large (max ${maxDays} days)` }, 400, 0);
  }

  const startParts = parseDateParts(from);
  const endParts = parseDateParts(to);
  if (!startParts || !endParts) return respond({ error: 'Invalid date range' }, 400, 0);

  const startUtc = localDatePartsToUtc(startParts, tzContext);
  const endUtc = localDatePartsToUtc(addDatePartsDays(endParts, 1), tzContext);
  const startIso = startUtc.toISOString();
  const endIso = endUtc.toISOString();

  const rowsBuffer = [];
  const distinctModels = new Set();

  const queryStartMs = Date.now();
  let rowCount = 0;
  const { error } = await forEachPage({
    createQuery: () => {
      let query = auth.edgeClient.database
        .from('vibescore_tracker_hourly')
        .select(
          'hour_start,source,model,total_tokens,input_tokens,cached_input_tokens,output_tokens,reasoning_output_tokens'
        )
        .eq('user_id', auth.userId);
      if (sourceFilter) query = query.eq('source', sourceFilter);
      query = applyCanaryFilter(query, { source: sourceFilter, model: null });
      return query
        .gte('hour_start', startIso)
        .lt('hour_start', endIso)
        .order('hour_start', { ascending: true })
        .order('device_id', { ascending: true })
        .order('source', { ascending: true })
        .order('model', { ascending: true });
    },
    onPage: (rows) => {
      const pageRows = Array.isArray(rows) ? rows : [];
      rowCount += pageRows.length;
      for (const row of pageRows) {
        const source = normalizeSource(row?.source) || DEFAULT_SOURCE;
        const model = normalizeModel(row?.model) || DEFAULT_MODEL;
        const usageKey = normalizeUsageModelKey(model);
        rowsBuffer.push({
          source,
          model,
          usageKey,
          hour_start: row?.hour_start,
          total_tokens: row?.total_tokens,
          input_tokens: row?.input_tokens,
          cached_input_tokens: row?.cached_input_tokens,
          output_tokens: row?.output_tokens,
          reasoning_output_tokens: row?.reasoning_output_tokens
        });
        if (usageKey && usageKey !== DEFAULT_MODEL) {
          distinctModels.add(usageKey);
        }
      }
    }
  });
  const queryDurationMs = Date.now() - queryStartMs;
  logSlowQuery(logger, {
    query_label: 'usage_model_breakdown',
    duration_ms: queryDurationMs,
    row_count: rowCount,
    range_days: dayKeys.length,
    source: sourceFilter || null,
    tz: tzContext?.timeZone || null,
    tz_offset_minutes: Number.isFinite(tzContext?.offsetMinutes) ? tzContext.offsetMinutes : null
  });

  if (error) return respond({ error: error.message }, 500, queryDurationMs);

  const usageModels = Array.from(distinctModels.values());
  const aliasRows = await fetchAliasRows({
    edgeClient: auth.edgeClient,
    usageModels,
    effectiveDate: to
  });
  const aliasTimeline = buildAliasTimeline({ usageModels, aliasRows });

  const sourcesMap = new Map();
  const canonicalModels = new Set();
  const grandTotals = createTotals();

  for (const row of rowsBuffer) {
    const sourceEntry = getSourceEntry(sourcesMap, row.source);
    addTotals(sourceEntry.totals, row);
    addTotals(grandTotals, row);
    const dateKey = extractDateKey(row.hour_start) || to;
    const identity = resolveIdentityAtDate({
      rawModel: row.model,
      usageKey: row.usageKey,
      dateKey,
      timeline: aliasTimeline
    });
    if (identity.model_id && identity.model_id !== DEFAULT_MODEL) {
      canonicalModels.add(identity.model_id);
    }
    const canonicalEntry = getCanonicalEntry(sourceEntry.models, identity);
    addTotals(canonicalEntry.totals, row);
  }

  const pricingModel = canonicalModels.size === 1 ? Array.from(canonicalModels)[0] : null;
  const pricingProfile = await resolvePricingProfile({
    edgeClient: auth.edgeClient,
    model: pricingModel,
    effectiveDate: to
  });

  const sources = Array.from(sourcesMap.values())
    .map((entry) => {
      const models = Array.from(entry.models.values())
        .map((modelEntry) => formatTotals(modelEntry, pricingProfile))
        .sort(compareTotals);
      const totals = formatTotals(entry, pricingProfile).totals;
      return {
        source: entry.source,
        totals,
        models
      };
    })
    .sort((a, b) => a.source.localeCompare(b.source));

  const overallCost = computeUsageCost(grandTotals, pricingProfile);

  return respond(
    {
      from,
      to,
      days: dayKeys.length,
      sources,
      pricing: buildPricingMetadata({
        profile: overallCost.profile,
        pricingMode: overallCost.pricing_mode
      })
    },
    200,
    queryDurationMs
  );
});

function createTotals() {
  return {
    total_tokens: 0n,
    input_tokens: 0n,
    cached_input_tokens: 0n,
    output_tokens: 0n,
    reasoning_output_tokens: 0n
  };
}

function addTotals(target, row) {
  if (!target || !row) return;
  target.total_tokens = toBigInt(target.total_tokens) + toBigInt(row.total_tokens);
  target.input_tokens = toBigInt(target.input_tokens) + toBigInt(row.input_tokens);
  target.cached_input_tokens =
    toBigInt(target.cached_input_tokens) + toBigInt(row.cached_input_tokens);
  target.output_tokens = toBigInt(target.output_tokens) + toBigInt(row.output_tokens);
  target.reasoning_output_tokens =
    toBigInt(target.reasoning_output_tokens) + toBigInt(row.reasoning_output_tokens);
}

function getSourceEntry(map, source) {
  if (map.has(source)) return map.get(source);
  const entry = {
    source,
    totals: createTotals(),
    models: new Map()
  };
  map.set(source, entry);
  return entry;
}

function getCanonicalEntry(map, identity) {
  const key = identity?.model_id || DEFAULT_MODEL;
  if (map.has(key)) return map.get(key);
  const entry = {
    model_id: key,
    model: identity?.model || key,
    totals: createTotals()
  };
  map.set(key, entry);
  return entry;
}

function extractDateKey(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && value.length >= 10) return value.slice(0, 10);
  return null;
}

function resolveIdentityAtDate({ rawModel, usageKey, dateKey, timeline } = {}) {
  const normalized = usageKey || normalizeUsageModelKey(rawModel) || DEFAULT_MODEL;
  const entries = timeline && typeof timeline.get === 'function' ? timeline.get(normalized) : null;
  if (Array.isArray(entries)) {
    let match = null;
    for (const entry of entries) {
      if (entry.effective_from && entry.effective_from <= dateKey) {
        match = entry;
      } else if (entry.effective_from && entry.effective_from > dateKey) {
        break;
      }
    }
    if (match) {
      return { model_id: match.model_id, model: match.model };
    }
  }
  const display = normalizeModel(rawModel) || DEFAULT_MODEL;
  return { model_id: normalized, model: display };
}

function buildAliasTimeline({ usageModels, aliasRows } = {}) {
  const normalized = new Set(
    Array.isArray(usageModels)
      ? usageModels.map((model) => normalizeUsageModelKey(model)).filter(Boolean)
      : []
  );
  const timeline = new Map();
  const rows = Array.isArray(aliasRows) ? aliasRows : [];
  for (const row of rows) {
    const usageKey = normalizeUsageModelKey(row?.usage_model);
    const canonical = normalizeUsageModelKey(row?.canonical_model);
    if (!usageKey || !canonical) continue;
    if (normalized.size && !normalized.has(usageKey)) continue;
    const display = normalizeModel(row?.display_name) || canonical;
    const effective = String(row?.effective_from || '');
    if (!effective) continue;
    const entry = {
      model_id: canonical,
      model: display,
      effective_from: effective
    };
    const list = timeline.get(usageKey);
    if (list) {
      list.push(entry);
    } else {
      timeline.set(usageKey, [entry]);
    }
  }
  for (const list of timeline.values()) {
    list.sort((a, b) => String(a.effective_from).localeCompare(String(b.effective_from)));
  }
  return timeline;
}

async function fetchAliasRows({ edgeClient, usageModels, effectiveDate } = {}) {
  const models = Array.isArray(usageModels)
    ? usageModels.map((model) => normalizeUsageModelKey(model)).filter(Boolean)
    : [];
  if (!models.length || !edgeClient || !edgeClient.database) return [];

  const dateKey =
    typeof effectiveDate === 'string' && effectiveDate.trim()
      ? effectiveDate.trim()
      : new Date().toISOString().slice(0, 10);

  const query = edgeClient.database
    .from('vibescore_model_aliases')
    .select('usage_model,canonical_model,display_name,effective_from')
    .eq('active', true)
    .in('usage_model', models)
    .lte('effective_from', dateKey)
    .order('effective_from', { ascending: true });

  const result = await query;
  const data = Array.isArray(result?.data)
    ? result.data
    : Array.isArray(query?.data)
      ? query.data
      : null;
  if (!Array.isArray(data) || result?.error || query?.error) return [];
  return data;
}

function formatTotals(entry, pricingProfile) {
  const totals = entry.totals;
  const cost = computeUsageCost(totals, pricingProfile);
  return {
    ...entry,
    totals: {
      total_tokens: totals.total_tokens.toString(),
      input_tokens: totals.input_tokens.toString(),
      cached_input_tokens: totals.cached_input_tokens.toString(),
      output_tokens: totals.output_tokens.toString(),
      reasoning_output_tokens: totals.reasoning_output_tokens.toString(),
      total_cost_usd: formatUsdFromMicros(cost.cost_micros)
    }
  };
}

function compareTotals(a, b) {
  const aTotal = toBigInt(a?.totals?.total_tokens);
  const bTotal = toBigInt(b?.totals?.total_tokens);
  if (aTotal === bTotal) return String(a?.model || '').localeCompare(String(b?.model || ''));
  return aTotal > bTotal ? -1 : 1;
}
