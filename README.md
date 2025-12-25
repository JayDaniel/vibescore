<div align="center">

# 🟢 VIBESCORE

**QUANTIFY YOUR AI OUTPUT**  
_Real-time AI Analytics for Codex CLI_

[**www.vibescore.space**](https://www.vibescore.space)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js Support](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/Platform-macOS-lightgrey.svg)](https://www.apple.com/macos/)

[**English**](README.md) • [**中文说明**](README.zh-CN.md)

[**Documentation**](docs/) • [**Dashboard**](dashboard/) • [**Backend API**](BACKEND_API.md)

<br/>

<img src="docs/screenshots/dashboard.png" width="900" alt="VibeScore Dashboard Preview"/>

</div>

---

## 🌌 Overview

**VibeScore** is an intelligent token usage tracking system designed specifically for macOS developers. It monitors Codex CLI output in real-time, transforming your **AI Output** into quantifiable metrics via a high-fidelity, **Matrix-themed** dashboard.

> [!TIP] > **Core Index**: Our signature metric that reflects your flow state by analyzing token consumption rates and patterns.

## 🔒 Privacy-First Architecture (Stealth Protocol)

We believe your code and thoughts are your own. VibeScore is built with strict privacy pillars to ensure your data never leaves your control.

- 🛡️ **Zero Code Infiltration**: We never touch your source code or prompts. Our sniffer only extracts numeric token counts (Input, Output, Reasoning, Cached).
- 📡 **Local Aggregation**: All token consumption analysis happens on your machine. We only relay quantized 30-minute usage buckets to the cloud.
- 🔐 **Hashed Identity**: Device tokens are hashed using SHA-256 server-side. Your raw credentials never exist in our database.
- 🔦 **Full Transparency**: Audit the sync logic yourself in `src/lib/rollout.js`. We literally only capture numbers and timestamps.

## 🚀 Key Features

- 📡 **Live Sniffer**: Real-time interception of Codex CLI pipes using low-level hooks to capture every completion event.
- 🧭 **Multi-source Ingestion**: Supports Codex CLI and Every Code (tagged as `source=every-code`) without modifying Every Code.
- 📊 **Matrix Dashboard**: A high-performance React + Vite dashboard featuring heatmaps, trend charts, and live logs.
- ⚡ **AI Analytics**: Deep analysis of Input/Output tokens, with dedicated tracking for Cached and Reasoning components.
- 🔒 **Identity Core**: Robust authentication and permission management to secure your development data.

### 🌌 Visual Preview

<img src="docs/screenshots/landing.png" width="900" alt="VibeScore Landing Preview"/>

## 🛠️ Quick Start

### Installation

Initialize your environment with a single command:

```bash
npx --yes @vibescore/tracker init
```

Note: If `~/.code/config.toml` exists (or `CODE_HOME`), `init` also configures Every Code `notify` automatically; it will not create the file when missing.
Init also kicks off a best-effort background sync without blocking installation.

### Sync & Status

```bash
# Sync latest local session data
npx --yes @vibescore/tracker sync

# Check current link status
npx --yes @vibescore/tracker status
```

### Sources

- Codex CLI logs: `~/.codex/sessions/**/rollout-*.jsonl` (override with `CODEX_HOME`)
- Every Code logs: `~/.code/sessions/**/rollout-*.jsonl` (override with `CODE_HOME`)

## 🔧 Environment Variables

- `VIBESCORE_HTTP_TIMEOUT_MS`: CLI HTTP timeout in ms (default `20000`, `0` disables, clamped to `1000..120000`).
- `VITE_VIBESCORE_HTTP_TIMEOUT_MS`: Dashboard request timeout in ms (default `15000`, `0` disables, clamped to `1000..30000`).

## 🧰 Troubleshooting

### Streak shows 0 days while totals look correct

- Streak is defined as consecutive days ending today. If today's total is 0, streak will be 0.
- If you expect a non-zero streak, clear cached auth/heatmap data and sign in again:

```js
localStorage.removeItem("vibescore.dashboard.auth.v1");
Object.keys(localStorage)
  .filter((k) => k.startsWith("vibescore.heatmap."))
  .forEach((k) => localStorage.removeItem(k));
location.reload();
```

- Complete the landing page sign-in flow again after reload.
- Note: `insforge-auth-token` is not used by the dashboard; use `vibescore.dashboard.auth.v1`.

## 🏗️ Architecture

```mermaid
graph TD
    A[Codex CLI] -->|Rollout Logs| B(Tracker CLI)
    B -->|AI Tokens| C{Core Relay}
    C --> D[VibeScore Dashboard]
    C --> E[AI Analytics Engine]
```

## 💻 Developer Guide

To run locally or contribute:

### Dashboard Development

```bash
# Install dependencies
cd dashboard
npm install

# Start dev server
npm run dev
```

### Architecture Validation

```bash
# Validate Copy Registry
npm run validate:copy

# Run smoke tests
npm run smoke
```

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <b>System_Ready // 2024 VibeScore OS</b><br/>
  <i>"More Tokens. More Vibe."</i>
</div>
