# Acceptance Criteria

## Feature: Session expired non-blocking banner

### Requirement: The dashboard SHALL mark session expired and clear local auth on 401 responses from authenticated API calls.
- Rationale: 避免无效 token 反复请求与错误定位。

#### Scenario: Mark expired on unauthorized
- WHEN an authenticated Edge Function request returns HTTP 401
- THEN the client SHALL set a session-expired flag in local storage
- AND the client SHALL clear stored auth token

### Requirement: The dashboard SHALL render the Dashboard with a non-blocking banner when session expired is true.
- Rationale: 为外部用户提供明确的重新登录提示，同时保留页面骨架。

#### Scenario: Session expired renders banner
- WHEN session expired is true and the user is not signed in
- THEN the Dashboard page SHALL render with a top banner
- AND the auth_required gate SHALL NOT block the page

### Requirement: The LandingPage SHALL remain the default for users without session expired.
- Rationale: 保持首次访问体验不被改变。

#### Scenario: Fresh unauthenticated user sees LandingPage
- WHEN session expired is false and the user is not signed in
- THEN the LandingPage SHALL render

### Requirement: The banner text SHALL be sourced from the copy registry.
- Rationale: 遵守文案治理规则。

#### Scenario: Copy registry keys are used
- WHEN the banner renders
- THEN the title/body strings SHALL come from `dashboard/src/content/copy.csv`
