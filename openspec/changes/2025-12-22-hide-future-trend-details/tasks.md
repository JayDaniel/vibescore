## 1. Implementation
- [x] 1.1 TREND 数据源过滤 `future` 桶（仅展示已发生部分）。
- [x] 1.2 DETAILS（日表）过滤 `future` 行。
- [x] 1.3 保持 `missing`（未同步）在已发生区间的标识不变。

## 2. Verification
- [ ] 2.1 Dashboard week/month：TREND 不显示未来桶（无空线/零值）。
- [ ] 2.2 DETAILS 不显示未来日期行。
- [ ] 2.3 `?mock=1` 下验证行为一致。
