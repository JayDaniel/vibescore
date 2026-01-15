# Spec: ci-cd

## ADDED Requirements

### Requirement: CI coverage for all modules
The system SHALL run CI on pull requests and main, executing tests, guardrails, and build checks for CLI, dashboard, and Insforge functions.

#### Scenario: CI on pull request
- **WHEN** a pull request is opened or updated
- **THEN** CI SHALL run `npm test`, guardrails validation, `npm run build:insforge:check`, and `npm run dashboard:build`
- **AND** any failure SHALL block merge

### Requirement: Automated CLI release on main
The system SHALL publish the CLI package to npm automatically on main when the version is new, and SHALL skip publishing when the version already exists.

#### Scenario: Publish new version
- **WHEN** main is updated with a version not yet published to npm
- **THEN** the release workflow SHALL publish the package
- **AND** the workflow SHALL report success

#### Scenario: Skip existing version
- **WHEN** main is updated but the version already exists in npm
- **THEN** the workflow SHALL skip publishing
- **AND** the workflow SHALL report a no-op

### Requirement: Dashboard deploy via Vercel integration
The system SHALL deploy the dashboard via Vercel Git integration on main and SHALL expose the Vercel status check on the commit.

#### Scenario: Vercel status check
- **WHEN** main is updated
- **THEN** Vercel SHALL deploy the dashboard
- **AND** the Vercel status check SHALL be visible on the commit

### Requirement: Manual MCP deployment gate for functions
The system SHALL require manual confirmation of MCP deployment when Insforge functions change on main.

#### Scenario: Functions changed
- **WHEN** changes touch insforge-src/functions or insforge-functions
- **THEN** the release workflow SHALL require manual MCP confirmation
- **AND** release completion SHALL be blocked until confirmation is provided

### Requirement: Preflight database checks before release
The system SHALL run preflight checks that validate required database tables exist before release completion.

#### Scenario: Preflight check fails
- **WHEN** scripts/acceptance/model-identity-alias-table.cjs fails
- **THEN** the release workflow SHALL fail
- **AND** release completion SHALL be blocked

### Requirement: Release evidence recorded
The system SHALL record release evidence in docs/deployment/freeze.md for each release that includes functions or dashboard changes.

#### Scenario: Freeze record entry
- **WHEN** a release completes
- **THEN** docs/deployment/freeze.md SHALL include scope, commands, and verification evidence
