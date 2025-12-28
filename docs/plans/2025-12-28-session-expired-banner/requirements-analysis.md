# Requirement Analysis

## Goal
- 在无法自动刷新会话的前提下，为已登录但会话失效的用户提供“非阻塞”提示，并保留首次未登录用户的 LandingPage 行为。

## Scope
- In scope:
  - 401 未授权时标记 session expired，并清理本地 auth。
  - session expired 时渲染 Dashboard + 顶部横幅提示（非阻塞）。
  - 首次未登录（无 session expired）仍展示 LandingPage。
  - 文案全部来自 `dashboard/src/content/copy.csv`。
- Out of scope:
  - 修改 InsForge Auth 域 / refresh cookie 机制。
  - 引入新的身份系统或长效 token。
  - 后端接口或 Edge Functions 变更。

## Users / Actors
- Dashboard Web 用户（外部用户）。

## Inputs
- Edge Function 请求返回的 401 状态。
- 本地 `localStorage` 中的 auth 与 session expired 标记。

## Outputs
- 顶部横幅提示 + 重新登录入口。
- Dashboard / LandingPage 之间的渲染分流。

## Business Rules
- 收到 401 时设置 session expired 标记，并清空本地 auth。
- session expired 为 true 时：
  - `signedIn` 视为 false。
  - 仍渲染 Dashboard，但显示顶部横幅提示。
- session expired 为 false 且未登录时：继续 LandingPage。
- 重新登录或显式登出时清除 session expired 标记。

## Assumptions
- InsForge 的 refresh cookie 无法落在当前 Functions 域。
- 401 是可靠的会话失效信号。

## Dependencies
- `dashboard/src/lib/auth-storage.js`
- `dashboard/src/lib/vibescore-api.js`
- `dashboard/src/hooks/use-auth.js`
- `dashboard/src/pages/DashboardPage.jsx`
- `dashboard/src/App.jsx`
- `dashboard/src/content/copy.csv`

## Risks
- 误判 401 导致用户被提前登出 → 仅在 401 时触发，避免 403 / 5xx 误伤。
- 用户体验下降 → 使用非阻塞横幅 + 保留页面骨架。
