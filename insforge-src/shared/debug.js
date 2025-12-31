'use strict';

const { getSlowQueryThresholdMs } = require('./logging');

const DEBUG_HEADER_NAMES = [
  'x-vibescore-request-id',
  'x-vibescore-query-ms',
  'x-vibescore-slow-threshold-ms',
  'x-vibescore-slow-query'
];

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

function buildSlowQueryDebugHeaders({ logger, durationMs } = {}) {
  const safeDuration = Number.isFinite(durationMs) ? Math.max(0, Math.round(durationMs)) : 0;
  const thresholdMs = getSlowQueryThresholdMs();
  return {
    'Access-Control-Expose-Headers': DEBUG_HEADER_NAMES.join(', '),
    'x-vibescore-request-id': logger?.requestId || '',
    'x-vibescore-query-ms': String(safeDuration),
    'x-vibescore-slow-threshold-ms': String(thresholdMs),
    'x-vibescore-slow-query': safeDuration >= thresholdMs ? '1' : '0'
  };
}

module.exports = {
  DEBUG_HEADER_NAMES,
  isDebugEnabled,
  buildSlowQueryDebugHeaders
};
