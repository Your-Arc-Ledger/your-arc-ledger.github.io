# Feature Specification: Achievement & Setback Tracker

**Feature Branch**: `001-achievement-tracker`

**Created**: 2026-05-23

**Status**: Draft

**Input**: User description: "I want to build a tool that will allow a user to track their achievements, and their setbacks. They will also be able to view these in a digestable way."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Log an Achievement or Setback (Priority: P1)

A user opens the application and records a new entry — either an achievement they are proud of or a setback they want to acknowledge. They provide a title, a short description, select the entry type (achievement or setback), and optionally assign a category. The entry is saved and immediately appears in their history.

**Why this priority**: This is the core capability of the tool. Without it, no other feature has value.

**Independent Test**: Can be fully tested by recording a single entry and confirming it appears in the entry list — delivers the minimum viable diary functionality.

**Acceptance Scenarios**:

1. **Given** the application is open, **When** the user fills in the entry form and submits, **Then** the new entry appears at the top of the history with the correct type, title, and date.
2. **Given** the user submits a form with missing required fields, **When** they attempt to save, **Then** the system highlights the missing fields and does not save the entry.
3. **Given** the user records an entry, **When** they close and reopen the application, **Then** the entry is still present.

---

### User Story 2 - View Entries in a Digestible Summary (Priority: P2)

A user wants to review their history of achievements and setbacks. They can view a chronological list that clearly distinguishes between the two types, along with a simple summary showing totals and recent activity. Entries can be filtered by type or category to focus on a subset.

**Why this priority**: Viewing history in a meaningful way is the core value proposition beyond simple logging. Without it, the tool is just a list.

**Independent Test**: Can be fully tested by pre-loading sample entries and confirming the list, summary counts, and filter controls all render correctly.

**Acceptance Scenarios**:

1. **Given** the user has recorded multiple entries, **When** they open the main view, **Then** entries appear in chronological order with clear visual distinction between achievements and setbacks.
2. **Given** the user filters by type "achievements", **When** the filter is applied, **Then** only achievement entries are displayed.
3. **Given** the user has recorded entries across multiple weeks, **When** they view the summary, **Then** they can see a count of achievements and setbacks for a recent period (e.g., last 30 days).

---

### User Story 3 - Connect Personal Storage (Priority: P3)

A user connects their personal cloud storage account so that their data persists securely and is accessible across devices. They authorise the application to read and write a specific file, and all entries are stored there going forward.

**Why this priority**: Without persistent storage, entries are lost on page refresh, making the tool unusable in practice. However, a local/temporary store may suffice for early testing.

**Independent Test**: Can be fully tested by connecting storage, logging an entry, then reopening the app in a new browser session and confirming the entry is still present.

**Acceptance Scenarios**:

1. **Given** the user has not yet connected storage, **When** they open the app, **Then** they are prompted to connect their Google account before logging entries.
2. **Given** the user authorises for the first time, **When** the connection succeeds, **Then** the app creates a new spreadsheet automatically and takes the user to the main view.
3. **Given** the user is a returning user with an existing spreadsheet, **When** they connect, **Then** they can supply their spreadsheet URL to load their existing data.
4. **Given** the user supplies a spreadsheet URL, **When** the format is unexpected or invalid, **Then** the system informs them and offers to fix the format or choose a different spreadsheet.
5. **Given** the storage connection expires or is revoked, **When** the user attempts to save or load entries, **Then** a visible "Session expired — Reconnect" prompt is shown; no silent background re-auth is attempted.

---

### Edge Cases

- What happens when the user's storage quota is full?
- How does the system handle a failed save (network error during write)?
- What if the user's storage file is deleted externally?
- What if the user attempts to log an entry with a very long description (character limits)?
- What happens when the user has zero entries — is the empty state clear and actionable?

## Clarifications

### Session 2026-05-23

- Q: How does the deployed app know which Google Spreadsheet to use? → A: App creates a new spreadsheet automatically on first auth (idempotent — only if one doesn't exist yet). Returning users can supply their own spreadsheet URL. If the spreadsheet is found but in an unexpected format, the user is informed and offered options to fix or choose a different sheet.
- Q: Can users edit or delete entries after creation? → A: No — entries are permanent once saved (append-only diary). No edit or delete in v1.
- Q: If a save fails and retries are exhausted, is the pending entry preserved or lost? → A: Entry is preserved in memory for the current session; the user can retry manually at any time while the tab remains open.
- Q: When the OAuth token expires (~1 hour), should re-auth be silent or require user action? → A: Explicit "Session expired — Reconnect" prompt shown to user; no silent background re-auth.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create entries with a type (achievement or setback), a title, a date, an optional description, and an optional category.
- **FR-002**: System MUST display all entries in reverse-chronological order by default.
- **FR-003**: System MUST visually distinguish achievement entries from setback entries.
- **FR-004**: Users MUST be able to filter the entry list by type (all / achievements / setbacks).
- **FR-005**: System MUST display a summary showing the count of achievements and setbacks recorded in the last 30 days.
- **FR-006**: System MUST persist all entries to the user's connected storage so data survives page refreshes and browser restarts.
- **FR-007**: System MUST allow users to connect their Google account via an authorisation flow. On first run, the app prompts the user to create a new Google Sheets document via a single button click. Returning users MUST be able to supply an existing spreadsheet URL to reconnect to their previous data. If the target spreadsheet is in an unexpected format, the system MUST inform the user and offer options to fix or select a different spreadsheet.
- **FR-008**: System MUST inform the user when a save fails and allow them to retry without losing their input. The pending entry MUST remain accessible in the form until the user successfully saves or explicitly discards it. If the tab is closed before a successful save, the entry is lost (no local persistence beyond the session).
- **FR-009**: Users MUST be able to assign an optional category to each entry for later filtering.
- **FR-010**: System MUST handle the unauthenticated state gracefully — prompting connection before allowing data entry.
- **FR-011**: When the OAuth session expires, the system MUST display an explicit "Session expired — Reconnect" prompt. The app MUST NOT attempt silent background re-authorisation.
- **FR-012**: All interactive UI elements (buttons, inputs, form fields, cards, navigation) MUST be sourced from a single, widely-adopted component library to ensure a consistent visual language and accessible baseline behaviour across the application.

### Key Entities

- **Entry**: Represents a single logged moment — has a unique ID, type (achievement or setback), title (required), description (optional), category (optional), and a date (defaults to today). Entries are append-only; once saved they cannot be edited or deleted.
- **Summary**: A derived view of entries — not stored independently; computed from the entry list for a given time window.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can log a new entry in under 60 seconds from opening the application.
- **SC-002**: The entry list loads and is interactive within 3 seconds on a standard broadband connection.
- **SC-003**: 100% of entries logged during a session are retrievable in a subsequent session (zero data loss on normal save).
- **SC-004**: Users can connect their storage account and complete the authorisation flow in under 2 minutes without external help.
- **SC-005**: The summary view correctly reflects the most recently logged entry without requiring a manual refresh.

## Assumptions

- This is a single-user personal tool; there is no account system, login screen, or multi-user sharing.
- Users have a modern web browser and a stable internet connection.
- The "digestible" view means a reverse-chronological list (newest first) with a summary panel showing counts — not charts or graphs (those are a future enhancement).
- Categories are free-text labels entered by the user; no predefined taxonomy is provided.
- Mobile browser support is in scope; native mobile apps are out of scope.
- All UI elements (buttons, forms, cards, typography) are sourced from an established, widely-adopted component library to ensure visual consistency and accessibility baseline. No custom-built base components are created where a library equivalent exists.
- The application will be used by a single person at a time; no real-time sync or conflict resolution is required.
- The user's connected storage account is already set up before using the application.
