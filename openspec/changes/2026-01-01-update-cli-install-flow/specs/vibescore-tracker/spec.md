## MODIFIED Requirements
### Requirement: CLI installation and commands
The system SHALL provide a consent-driven, low-noise init experience that does not modify local files before explicit user confirmation (or explicit non-interactive override).

#### Scenario: Consent gate before changes
- **GIVEN** an interactive terminal and no `--yes` flag
- **WHEN** a user runs `npx --yes @vibescore/tracker init`
- **THEN** the CLI SHALL display a privacy notice and a menu before any filesystem changes
- **AND** selecting Exit SHALL leave the filesystem unchanged

#### Scenario: Non-interactive init proceeds safely
- **GIVEN** stdin is not a TTY OR the user passes `--yes`
- **WHEN** a user runs `npx --yes @vibescore/tracker init`
- **THEN** the CLI SHALL proceed without prompting and still show the privacy notice

#### Scenario: Transparency report after setup
- **WHEN** local setup completes
- **THEN** the CLI SHALL print a summary list of integrations updated or skipped
- **AND** if account linking is required, the CLI SHALL show an explicit next step to open the browser

## ADDED Requirements
### Requirement: Dry-run preview mode
The system SHALL provide a dry-run mode for `init` that reports planned changes without modifying local files.

#### Scenario: Dry-run makes no changes
- **GIVEN** a user runs `npx --yes @vibescore/tracker init --dry-run`
- **THEN** the CLI SHALL NOT write to local config or install hooks
- **AND** the output SHALL indicate a preview-only run
