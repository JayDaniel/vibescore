# Copy Registry（网页文案表）

## 目的

把网页所有文案集中到一张表里，保证 **单一事实来源**，方便你直接改表而不是改代码，同时每条文案都有模块/页面/组件归属。

## 位置

- 文案表：`dashboard/src/content/copy.csv`
- 运行时读取：`dashboard/src/lib/copy.js`

## 表结构（CSV 列）

必填列：
- `key`：稳定的引用 key（例如 `dashboard.footer.right`）
- `module`：模块（例如 `landing` / `dashboard` / `connect` / `ui`）
- `page`：页面或范围（例如 `LandingPage` / `DashboardPage` / `*`）
- `component`：组件名（例如 `MatrixShell` / `ActivityHeatmap`）
- `slot`：用途/位置（例如 `title` / `subtitle` / `label`）
- `text`：实际展示文案

可选列：
- `notes`：备注或使用约束
- `status`：状态（建议 `active` / `deprecated`）

## 插值与换行

- 支持模板变量：`{{name}}`（例如 `Range: {{range}}`）
- 需要换行时使用 `\n`（会在运行时转成真正换行）

## 修改流程

1. 直接编辑 `dashboard/src/content/copy.csv`
2. 保持 `key` 稳定（不要随意改动 key）
3. 新增文案时：新增一行 + 明确 module/page/component/slot
4. 运行校验脚本：

```bash
npm run validate:copy
# 或
node scripts/validate-copy-registry.cjs
```

## 校验规则

- 所有 `copy("key")` 引用必须在表里存在
- 表内每行必须填 `module/page/component/slot/text`
- 重复 key 会报错
- 未使用的 key 会给出 warning

