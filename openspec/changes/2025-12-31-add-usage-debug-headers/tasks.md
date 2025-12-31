## 1. Implementation
- [x] 1.1 Add debug header helper (threshold + duration + request id) gated by `debug=1`.
- [x] 1.2 Apply debug headers to usage endpoints (summary/daily/hourly/monthly/heatmap/model-breakdown).
- [x] 1.3 Rebuild `insforge-functions/` artifacts.
- [x] 1.4 Update backend docs for debug headers.

## 2. Tests
- [x] 2.1 Add unit test for debug headers on a usage endpoint.
- [x] 2.2 Run regression tests (at least the updated test file).

## 3. Verification
- [x] 3.1 Verify debug headers appear only when `debug=1` and are absent otherwise.
