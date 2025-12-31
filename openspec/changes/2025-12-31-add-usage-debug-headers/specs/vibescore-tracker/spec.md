## ADDED Requirements
### Requirement: Usage debug headers for slow-query validation
When a usage endpoint is called with `debug=1`, the response MUST include debug headers: `x-vibescore-request-id`, `x-vibescore-query-ms`, `x-vibescore-slow-threshold-ms`, and `x-vibescore-slow-query`. These headers MUST be absent when `debug` is not enabled. When debug headers are present, the response MUST include `Access-Control-Expose-Headers` listing the debug header names.

#### Scenario: Debug headers returned when enabled
- **WHEN** a client calls `GET /functions/vibescore-usage-summary?from=YYYY-MM-DD&to=YYYY-MM-DD&debug=1`
- **THEN** the response SHALL include the debug headers and `Access-Control-Expose-Headers`

#### Scenario: Debug headers omitted by default
- **WHEN** a client calls `GET /functions/vibescore-usage-summary?from=YYYY-MM-DD&to=YYYY-MM-DD`
- **THEN** the response SHALL NOT include any debug headers
