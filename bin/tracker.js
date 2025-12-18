#!/usr/bin/env node
/* eslint-disable no-console */

const { run } = require('../src/cli');

run(process.argv.slice(2)).catch((err) => {
  console.error(err?.stack || String(err));
  process.exitCode = 1;
});

