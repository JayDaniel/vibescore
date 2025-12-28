# Test Strategy

## Objectives
- 验证 401 会触发 session expired 标记。
- 验证 Dashboard/ LandingPage 渲染分流逻辑。
- 验证顶部横幅与文案键存在并被引用。

## Test Levels
- Unit:
  - 静态断言 `auth-storage`/`use-auth`/`App`/`DashboardPage` 的关键逻辑存在。
- Integration:
  - `vibescore-api` 在 401 时调用 session expired 标记（静态断言）。
- Regression:
  - 现有 Dashboard 渲染与 copy registry 测试继续通过。
- Performance:
  - 无新增性能测试（纯前端状态/文案改动）。

## Test Matrix
- Requirement 1 -> Unit/Integration -> Frontend -> new test file
- Requirement 2 -> Unit -> Frontend -> new test file
- Requirement 3 -> Unit -> Frontend -> new test file
- Requirement 4 -> Unit -> Frontend -> new test file

## Environments
- Node test runner (`node --test test/*.test.js`).

## Automation Plan
- 新增 1 个前端静态测试文件覆盖本次行为。
- 运行 `node scripts/validate-copy-registry.cjs` 校验文案表。

## Entry / Exit Criteria
- Entry:
  - OpenSpec 变更提案已创建并获批准。
- Exit:
  - 新增测试先失败后通过。
  - `npm test` 通过。
  - 文案校验通过。

## Coverage Risks
- 静态测试无法覆盖运行时交互 → 通过最小手工验证补充。
