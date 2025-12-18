const fs = require('node:fs/promises');
const path = require('node:path');

const { ensureDir, readJson, writeJson } = require('./fs');

async function upsertCodexNotify({ codexConfigPath, notifyCmd, notifyOriginalPath }) {
  const originalText = await fs.readFile(codexConfigPath, 'utf8').catch(() => null);
  if (originalText == null) {
    throw new Error(`Codex config not found: ${codexConfigPath}`);
  }

  const existingNotify = extractNotify(originalText);
  const already = arraysEqual(existingNotify, notifyCmd);

  if (!already) {
    // Persist original notify once (for uninstall + chaining).
    if (existingNotify && existingNotify.length > 0) {
      await ensureDir(path.dirname(notifyOriginalPath));
      const existing = await readJson(notifyOriginalPath);
      if (!existing) {
        await writeJson(notifyOriginalPath, { notify: existingNotify, capturedAt: new Date().toISOString() });
      }
    }

    const updated = setNotify(originalText, notifyCmd);
    const backupPath = `${codexConfigPath}.bak.${new Date().toISOString().replace(/[:.]/g, '-')}`;
    await fs.copyFile(codexConfigPath, backupPath);
    await fs.writeFile(codexConfigPath, updated, 'utf8');
    return { changed: true, backupPath };
  }

  return { changed: false, backupPath: null };
}

async function restoreCodexNotify({ codexConfigPath, notifyOriginalPath }) {
  const text = await fs.readFile(codexConfigPath, 'utf8').catch(() => null);
  if (text == null) return;

  const original = await readJson(notifyOriginalPath);
  const originalNotify = Array.isArray(original?.notify) ? original.notify : null;

  const updated = originalNotify ? setNotify(text, originalNotify) : removeNotify(text);
  const backupPath = `${codexConfigPath}.bak.${new Date().toISOString().replace(/[:.]/g, '-')}`;
  await fs.copyFile(codexConfigPath, backupPath).catch(() => {});
  await fs.writeFile(codexConfigPath, updated, 'utf8');
}

async function loadCodexNotifyOriginal(notifyOriginalPath) {
  const original = await readJson(notifyOriginalPath);
  return Array.isArray(original?.notify) ? original.notify : null;
}

async function readCodexNotify(codexConfigPath) {
  const text = await fs.readFile(codexConfigPath, 'utf8').catch(() => null);
  if (text == null) return null;
  return extractNotify(text);
}

function extractNotify(text) {
  // Heuristic parse: find a line that starts with "notify =".
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*notify\s*=\s*(.+)\s*$/);
    if (m) {
      const rhs = m[1].trim();
      const parsed = parseTomlStringArray(rhs);
      if (parsed) return parsed;
    }
  }
  return null;
}

function setNotify(text, notifyCmd) {
  const lines = text.split(/\r?\n/);
  const notifyLine = `notify = ${formatTomlStringArray(notifyCmd)}`;

  const out = [];
  let replaced = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isNotify = /^\s*notify\s*=/.test(line);
    if (isNotify) {
      if (!replaced) {
        out.push(notifyLine);
        replaced = true;
      }
      continue;
    }
    out.push(line);
  }

  if (!replaced) {
    // Insert at top-level, before the first table header.
    const firstTableIdx = out.findIndex((l) => /^\s*\[/.test(l));
    const headerIdx = firstTableIdx === -1 ? out.length : firstTableIdx;
    out.splice(headerIdx, 0, notifyLine);
  }

  return out.join('\n').replace(/\n+$/, '\n');
}

function removeNotify(text) {
  const lines = text.split(/\r?\n/);
  const out = lines.filter((l) => !/^\s*notify\s*=/.test(l));
  return out.join('\n').replace(/\n+$/, '\n');
}

function parseTomlStringArray(rhs) {
  // Minimal parser for ["a", "b"] string arrays.
  // Assumes there are no escapes in strings (good enough for our usage).
  if (!rhs.startsWith('[') || !rhs.endsWith(']')) return null;
  const inner = rhs.slice(1, -1).trim();
  if (!inner) return [];

  const parts = [];
  let current = '';
  let inString = false;
  let quote = null;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (!inString) {
      if (ch === '"' || ch === "'") {
        inString = true;
        quote = ch;
        current = '';
      }
      continue;
    }
    if (ch === quote) {
      parts.push(current);
      inString = false;
      quote = null;
      continue;
    }
    current += ch;
  }

  return parts.length > 0 ? parts : null;
}

function formatTomlStringArray(arr) {
  return `[${arr.map((s) => JSON.stringify(String(s))).join(', ')}]`;
}

function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

module.exports = {
  upsertCodexNotify,
  restoreCodexNotify,
  loadCodexNotifyOriginal,
  readCodexNotify
};
