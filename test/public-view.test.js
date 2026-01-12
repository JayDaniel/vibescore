const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(rel) {
  return fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
}

test("App routes /share/:token to DashboardPage public mode", () => {
  const src = read("dashboard/src/App.jsx");
  assert.match(src, /share/i);
  assert.match(src, /publicMode/);
  assert.match(src, /publicToken/);
});

test("DashboardPage disables auth gate in public mode", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.match(src, /publicMode/);
  assert.match(src, /requireAuthGate/);
});

test("copy registry includes public view copy keys", () => {
  const src = read("dashboard/src/content/copy.csv");
  assert.ok(src.includes("dashboard.public_view.title"));
  assert.ok(src.includes("dashboard.public_view.subtitle"));
  assert.ok(src.includes("dashboard.public_view.status.enabled"));
  assert.ok(src.includes("dashboard.public_view.status.disabled"));
  assert.ok(src.includes("dashboard.public_view.action.copy"));
  assert.ok(src.includes("dashboard.public_view.action.rotate"));
  assert.ok(src.includes("dashboard.public_view.action.revoke"));
  assert.ok(src.includes("dashboard.public_view.invalid.title"));
  assert.ok(src.includes("dashboard.public_view.invalid.body"));
});

test("share routes rewrite to share.html", () => {
  const raw = read("dashboard/vercel.json");
  const parsed = JSON.parse(raw);
  const rewrites = Array.isArray(parsed.rewrites) ? parsed.rewrites : [];
  const hasShare = rewrites.some((rule) =>
    String(rule.source || "").includes("/share")
  );
  assert.ok(hasShare);
});

test("public view edge functions are defined", () => {
  const issueSrc = read("insforge-src/functions/vibescore-public-view-issue.js");
  const revokeSrc = read("insforge-src/functions/vibescore-public-view-revoke.js");
  assert.match(issueSrc, /public view/i);
  assert.match(revokeSrc, /public view/i);
});
