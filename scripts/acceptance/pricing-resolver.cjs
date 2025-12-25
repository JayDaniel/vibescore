#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');

const { getDefaultPricingProfile, resolvePricingProfile } = require('../../insforge-src/shared/pricing');

class DatabaseStub {
  constructor(rows = []) {
    this.rows = rows;
  }

  from() {
    return this;
  }

  select() {
    return this;
  }

  eq() {
    return this;
  }

  lte() {
    return this;
  }

  order() {
    return this;
  }

  limit() {
    return { data: this.rows, error: null };
  }
}

async function main() {
  const profileRow = {
    model: 'gpt-5.2-codex',
    source: 'openrouter',
    effective_from: '2025-12-23',
    input_rate_micro_per_million: 1750000,
    cached_input_rate_micro_per_million: 175000,
    output_rate_micro_per_million: 14000000,
    reasoning_output_rate_micro_per_million: 14000000
  };

  const edgeClient = { database: new DatabaseStub([profileRow]) };
  const resolved = await resolvePricingProfile({ edgeClient, effectiveDate: '2025-12-25' });

  assert.equal(resolved.model, profileRow.model);
  assert.equal(resolved.source, profileRow.source);
  assert.equal(resolved.effective_from, profileRow.effective_from);
  assert.equal(resolved.rates_micro_per_million.input, profileRow.input_rate_micro_per_million);
  assert.equal(
    resolved.rates_micro_per_million.cached_input,
    profileRow.cached_input_rate_micro_per_million
  );
  assert.equal(
    resolved.rates_micro_per_million.output,
    profileRow.output_rate_micro_per_million
  );
  assert.equal(
    resolved.rates_micro_per_million.reasoning_output,
    profileRow.reasoning_output_rate_micro_per_million
  );

  const fallbackClient = { database: new DatabaseStub([]) };
  const fallback = await resolvePricingProfile({ edgeClient: fallbackClient, effectiveDate: '2025-12-25' });
  const defaultProfile = getDefaultPricingProfile();

  assert.deepEqual(fallback, defaultProfile);

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        resolved_model: resolved.model,
        fallback_model: fallback.model
      },
      null,
      2
    ) + '\n'
  );
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
