# Backfill Codex Unknown Buckets

## 目的
当 dashboard 中 Codex 仍显示 `unknown`，但同一小时内已存在已知模型时，使用该脚本生成“修正入队”记录：
- `unknown` 置零
- 将 `unknown` 的 token 归并到该小时的主导模型（`total_tokens` 最大，平手按字典序）

**适用范围**：仅针对 `codex` 源。不会修改原始 rollout 日志，只写入本地队列并上传。

## 前置条件
- 已安装并配置 `@vibescore/tracker`
- 本地存在 `~/.vibescore/tracker/cursors.json`

## 运行方式

### 1) Dry‑run（默认）
仅打印将要修正的小时桶和合并结果，不写入队列。

```bash
node scripts/ops/backfill-codex-unknown.cjs
```

可选：
```bash
node scripts/ops/backfill-codex-unknown.cjs --summary
node scripts/ops/backfill-codex-unknown.cjs --limit 50
```

### 2) 追加修正记录并上传

```bash
node scripts/ops/backfill-codex-unknown.cjs --apply --sync
```

如果只想写入队列、不立即上传：
```bash
node scripts/ops/backfill-codex-unknown.cjs --apply
npx @vibescore/tracker sync --drain
```

## 可选参数
- `--tracker-dir <path>`：覆盖默认 `~/.vibescore/tracker`
- `--queue-path <path>`：覆盖 `queue.jsonl`
- `--cursors-path <path>`：覆盖 `cursors.json`
- `--dry-run` / `--apply` / `--sync`

## 预期结果
- dashboard 的 Codex `unknown` 归零或明显减少
- 脚本输出 `No codex unknown buckets require backfill.` 表示无需修正

## 注意事项
- 时间是 **UTC**，与本地时区可能存在偏差
- 重复执行 `--apply` 会追加相同记录（上传端按桶键去重，最终结果不变）
- 若要全量重算，请不要使用此脚本，改走完整重传流程
