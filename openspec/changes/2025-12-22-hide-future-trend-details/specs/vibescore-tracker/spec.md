## MODIFIED Requirements
### Requirement: Dashboard TREND truncates future buckets
The dashboard TREND chart SHALL NOT render or display any future local-calendar buckets (no line, no placeholder, no zero values), and SHALL visually distinguish "unsynced" buckets from true zero-usage buckets within the elapsed range.

#### Scenario: Current date does not cover full period
- **GIVEN** the current local date/time is within an active period (e.g., mid-week or mid-month)
- **WHEN** the dashboard renders the TREND chart for that period
- **THEN** the trend line SHALL render only through the last available local bucket
- **AND** future buckets SHALL NOT be rendered at all

#### Scenario: Unsynced buckets show missing markers
- **GIVEN** hourly data includes `missing: true` for recent hours
- **WHEN** the dashboard renders the day trend
- **THEN** it SHALL render missing markers (no line) for those hours
- **AND** it SHALL keep zero-usage buckets (`missing=false`) on the line

## ADDED Requirements
### Requirement: Dashboard DETAILS hides future rows
The dashboard DETAILS table SHALL NOT display rows for future local dates, even if the value is zero or missing.

#### Scenario: Future daily rows are not shown
- **GIVEN** the current local date is before the end of the selected period
- **WHEN** the DETAILS table renders daily rows
- **THEN** rows with dates after today SHALL NOT be rendered
