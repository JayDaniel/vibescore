'use strict';

const { getSlowQueryThresholdMs } = require('./logging');

function isDebugEnabled(url) {
  if (!url) return false;
  if (typeof url === 'string') {
    try {
      const parsed = new URL(url);
      return parsed.searchParams.get('debug') === '1';
    } catch (_e) {
      return false;
    }
  }
  return url?.searchParams?.get('debug') === '1';
}

function buildSlowQueryDebugPayload({ logger, durationMs, status } = {}) {
  const safeDuration = Number.isFinite(durationMs) ? Math.max(0, Math.round(durationMs)) : 0;
  const thresholdMs = getSlowQueryThresholdMs();
  if (logger?.log) {
    logger.log({
      stage: 'debug_payload',
      status: typeof status === 'number' ? status : null,
      query_ms: safeDuration,
      slow_threshold_ms: thresholdMs,
      slow_query: safeDuration >= thresholdMs ? 1 : 0
    });
  }
  return {
    request_id: logger?.requestId || '',
    status: typeof status === 'number' ? status : null,
    query_ms: safeDuration,
    slow_threshold_ms: thresholdMs,
    slow_query: safeDuration >= thresholdMs
  };
}

function withSlowQueryDebugPayload(body, options) {
  if (!body || typeof body !== 'object') return body;
  if (body.debug) return body;
  return {
    ...body,
    debug: buildSlowQueryDebugPayload(options)
  };
}

module.exports = {
  isDebugEnabled,
  buildSlowQueryDebugPayload,
  withSlowQueryDebugPayload
};
