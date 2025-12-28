const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pagePath = path.join(
  __dirname,
  '..',
  'dashboard',
  'src',
  'pages',
  'DashboardPage.jsx'
);

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('DashboardPage maps auth savedAt to identity start date label', () => {
  const src = readFile(pagePath);
  assert.ok(src.includes('identityStartDate'), 'expected identity start date helper');
  assert.ok(src.includes('auth?.savedAt'), 'expected auth savedAt usage');
  assert.ok(src.includes('formatDateLocal'), 'expected yyyy-mm-dd formatting');
});
