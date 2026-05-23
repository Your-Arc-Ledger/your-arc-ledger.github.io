---

description: "Task list for Achievement & Setback Tracker implementation"
---

# Tasks: Achievement & Setback Tracker

**Input**: Design documents from `specs/001-achievement-tracker/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/sheets-schema.md ✓, quickstart.md ✓

**Tests**: Included per constitution §II. Test tasks precede every implementation sub-section. Tests MUST be written first and MUST FAIL before the corresponding implementation task begins (Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every description

## Path Conventions

Single-project React SPA at repository root:
- Source: `src/` (components, hooks, services, context, models)
- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- Config: `vite.config.js`, `package.json`, `.env`, `.github/workflows/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bootstrap the Vite React project, configure tooling, and create the source directory skeleton.

- [ ] T001 Bootstrap Vite React project: run `npm create vite@latest . -- --template react`; install dependencies with `npm install`; create the full `src/` directory hierarchy per plan.md (components/auth/, components/entry/, components/summary/, hooks/, services/, context/, models/)
- [ ] T002 Install testing dependencies: `npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`; create `tests/unit/` and `tests/integration/` directory structure
- [ ] T003 [P] Configure Vitest in `vite.config.js`: add `test: { environment: 'jsdom', setupFiles: './src/test-setup.js' }` block; add `"test": "vitest"` and `"test:run": "vitest run"` scripts to `package.json`
- [ ] T004 [P] Create `src/test-setup.js` that imports `@testing-library/jest-dom` so all test files get the extended matchers automatically
- [ ] T005 [P] Configure ESLint and Prettier: install `eslint-config-prettier`, add Prettier config; verify `npm run lint` passes with zero errors on the generated scaffold
- [ ] T006 [P] Create `.env.example` with `VITE_GOOGLE_CLIENT_ID=` placeholder; create `.env` with a blank value; confirm `.env` is listed in `.gitignore`
- [ ] T007 Install `gh-pages` (`npm install --save-dev gh-pages`); add `"predeploy": "npm run build"` and `"deploy": "gh-pages -d dist"` scripts to `package.json`; set `base: '/achievement-diary/'` in `vite.config.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure shared by all user stories — component library, state contexts, the Entry data model, and the App shell. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: All Phase 3+ tasks depend on this phase being complete.

- [ ] T008 Install and configure **shadcn/ui**: run `npx shadcn@latest init`; add Tailwind CSS; install the core components that will be used across the app (Button, Input, Textarea, Select, Card, Badge, Form, Label); verify components render in `src/App.jsx` with a smoke test
- [ ] T009 Create `src/context/AuthContext.jsx`: define auth state shape (`status: 'idle'|'authorising'|'authorised'|'error'`, `accessToken: string|null`, `error: string|null`); implement `useReducer` with actions `SET_AUTHORISING`, `SET_AUTHORISED`, `SET_ERROR`, `CLEAR`; export `AuthContext` and `AuthProvider`
- [ ] T010 Create `src/context/EntriesContext.jsx`: define entries state shape (`status: 'idle'|'loading'|'loaded'|'saving'|'error'`, `items: Entry[]`, `filter: 'all'|'achievement'|'setback'`, `error: string|null`); implement `useReducer` with actions `SET_LOADING`, `SET_ENTRIES`, `APPEND_ENTRY`, `SET_FILTER`, `SET_SAVING`, `SET_ERROR`; export `EntriesContext` and `EntriesProvider`
- [ ] T011 [P] Create `src/models/entry.js`: export `createEntry(fields)` that generates `id` (UUID v4 via `crypto.randomUUID()`), sets `createdAt` to current ISO datetime, merges provided fields; export `validateEntry(entry)` that checks required fields and value constraints per data-model.md (blank title, invalid type, invalid date, field length limits)
- [ ] T012 Update `src/App.jsx` to wrap the component tree in `<AuthProvider>` and `<EntriesProvider>`; render a placeholder `<main>` layout with slots for the auth gate, entry form, entry list, and summary panel

**Checkpoint**: State infrastructure is ready — user story components can now consume context hooks.

---

## Phase 3: User Story 1 — Log an Achievement or Setback (Priority: P1) 🎯 MVP

**Goal**: User opens the app, fills in the entry form, submits, and immediately sees the new entry in the history list. State is in-memory only (Google Sheets wired in US3).

**Independent Test**: Record a single entry using the form; confirm it appears at the top of the entry list with the correct type, title, and date. Confirm that submitting an empty form shows validation errors and does not add an entry.

### Tests for User Story 1

> **⚠️ Write these tests FIRST. They MUST FAIL before beginning any T016+ implementation task.**

- [ ] T013 [P] [US1] Write unit tests for `src/models/entry.js` in `tests/unit/models/entry.test.js`: `createEntry()` generates a valid UUID v4 `id` and ISO datetime `createdAt` and merges provided fields; `validateEntry()` rejects blank title (post-trim), invalid `type` values, title > 200 chars, description > 2000 chars, category > 50 chars, and invalid dates
- [ ] T014 [P] [US1] Write unit tests for `src/components/entry/EntryForm.jsx` in `tests/unit/components/EntryForm.test.jsx`: form renders all 5 fields (type, title, description, category, date); submitting empty form shows validation error on title and does NOT call `onSubmit`; valid submission calls `onSubmit` with correctly shaped fields; date field defaults to today
- [ ] T015 [P] [US1] Write unit tests in `tests/unit/components/EntryList.test.jsx` and `tests/unit/hooks/useEntries.test.js`: `EntryList` renders entries in reverse-chronological order; `EntryList` shows an empty-state message when `items` is empty; `addEntry` dispatches `APPEND_ENTRY` and the new entry appears first in the list; `addEntry` calls `validateEntry` and rejects invalid fields without dispatching

### Implementation for User Story 1

- [ ] T016 [P] [US1] Create `src/components/entry/EntryForm.jsx`: render a form using shadcn/ui Form, Input, Textarea, Select, and Label components with fields for type (achievement/setback), required title (max 200 chars), optional description (max 2000 chars), optional category (max 50 chars), and date (defaults to today); expose `onSubmit(entryFields)` prop; display inline validation errors (using shadcn/ui FormMessage) when required fields fail — errors must appear without clearing entered values
- [ ] T017 [P] [US1] Create `src/components/entry/EntryCard.jsx`: display a single entry's type badge, title, category, date, and description using shadcn/ui Card and Badge; visually distinguish achievement entries from setback entries via badge colour or icon
- [ ] T018 [US1] Create `src/components/entry/EntryList.jsx`: render entries from `EntriesContext` in reverse-chronological order (newest first) using `EntryCard`; show a clear actionable empty-state message when no entries exist; include a loading skeleton while `status === 'loading'`
- [ ] T019 [US1] Implement `src/hooks/useEntries.js`: consume `EntriesContext`; expose `addEntry(fields)` that calls `validateEntry`, creates the entry via `createEntry`, and dispatches `APPEND_ENTRY` to the reducer (in-memory only at this stage); expose `entries`, `filter`, `status`, and `error`
- [ ] T020 [US1] Wire `EntryForm` submit handler to `useEntries.addEntry` in `src/App.jsx`; on validation failure show field-level errors without clearing form; on success clear the form and confirm the new entry appears at the top of `EntryList` immediately
- [ ] T021 [US1] Add error-state handling: when `status === 'error'`, `EntryList` shows a user-readable error message and a Retry button; `EntryForm` preserves all field values after a failed save so the user can retry without re-entering data (FR-008)
- [ ] T022 [US1] Render `EntryForm` and `EntryList` side-by-side (or stacked on mobile) in `src/App.jsx`; run `npm run dev` and manually verify the complete log-and-view flow end-to-end

**Checkpoint**: User Story 1 is fully functional with in-memory state. All T013–T015 tests pass.

---

## Phase 4: User Story 2 — View Entries in a Digestible Summary (Priority: P2)

**Goal**: The entry list can be filtered by type and category; a summary panel shows achievement and setback counts for the last 30 days.

**Independent Test**: Pre-load the in-memory context with sample entries spanning multiple types and categories; confirm the list renders newest-first; apply the achievements filter and verify only achievements show; check that the summary panel counts match expected 30-day totals.

### Tests for User Story 2

> **⚠️ Write these tests FIRST. They MUST FAIL before beginning any T025+ implementation task.**

- [ ] T023 [P] [US2] Write unit tests for the `EntriesContext` filter reducer in `tests/unit/context/EntriesContext.test.js`: `SET_FILTER 'achievement'` shows only achievements; `SET_FILTER 'setback'` shows only setbacks; `SET_FILTER 'all'` shows all entries; type and category filters compose correctly; master `items` array is never mutated by a filter action
- [ ] T024 [P] [US2] Write unit tests for `src/components/summary/EntrySummary.jsx` in `tests/unit/components/EntrySummary.test.jsx`: correctly counts achievements and setbacks within the last 30 days; excludes entries older than 30 days; displays zero counts when no entries exist

### Implementation for User Story 2

- [ ] T025 [P] [US2] Add type filter controls (All / Achievements / Setbacks) to `src/components/entry/EntryList.jsx` using shadcn/ui Tabs or ToggleGroup; dispatch `SET_FILTER` to `EntriesContext` on selection change
- [ ] T026 [US2] Implement filter logic in `EntriesContext` reducer: when `filter` is `'achievement'` or `'setback'`, derive the displayed list by filtering `items`; when `filter` is `'all'`, return the full list; `items` always stores the unfiltered master list
- [ ] T027 [P] [US2] Create `src/components/summary/EntrySummary.jsx`: compute `achievementCount` and `setbackCount` from `EntriesContext.items` where the entry `date` falls within the last 30 days; display counts using shadcn/ui Card and Badge; update reactively when new entries are added
- [ ] T028 [US2] Add a category filter combobox to `src/components/entry/EntryList.jsx`: populate options from the unique categories present in `items`; implement category filtering in `EntriesContext` reducer composable with the type filter
- [ ] T029 [US2] Render `EntrySummary` in `src/App.jsx` above the entry list; verify that summary counts update immediately when a new entry is logged and that both type and category filters work correctly together

**Checkpoint**: User Stories 1 and 2 are both functional. All T023–T024 tests pass.

---

## Phase 5: User Story 3 — Connect Personal Storage (Priority: P3)

**Goal**: Users connect their Google account via OAuth 2.0 (GIS token model); entries are read from and written to a Google Sheets document; a button creates the sheet on first run; session expiry shows an explicit reconnect prompt.

**Independent Test**: Click "Create new spreadsheet" → confirm new sheet appears in Google Drive → log an entry → close the browser → reopen and reconnect using the spreadsheet URL → confirm the entry is still present. Simulate a 401 response → confirm "Session expired — Reconnect" prompt; no silent re-auth.

### Tests for User Story 3

> **⚠️ Write these tests FIRST. They MUST FAIL before beginning any T032+ implementation task.**

- [ ] T030 [P] [US3] Write integration tests for `src/services/googleSheets.js` in `tests/integration/googleSheets.test.js` using `vi.mock` to mock `globalThis.fetch`: `readEntries()` skips the header row and maps rows to correctly shaped Entry objects; `readEntries()` returns an empty array when `values` is absent; `appendEntry()` calls fetch with the correct Sheets API URL, `Authorization` header, and 7-element row payload; `appendEntry()` retries once on network error and throws a user-readable error on second failure; `initSheet()` calls batchUpdate and values.append when the Entries sheet is absent
- [ ] T031 [P] [US3] Write unit tests for `src/hooks/useGoogleAuth.js` in `tests/unit/hooks/useGoogleAuth.test.js`: `initiateAuth()` calls `google.accounts.oauth2.initTokenClient` with the correct client ID and scope; a successful token callback dispatches `SET_AUTHORISED` with the access token; detecting a 401 error dispatches `SET_ERROR` with a "Session expired — Reconnect" message

### Implementation for User Story 3

- [ ] T032 [P] [US3] Implement `readEntries(spreadsheetId, accessToken)` in `src/services/googleSheets.js`: call `GET https://sheets.googleapis.com/v4/spreadsheets/{id}/values/Entries!A:G` with `Authorization: Bearer {accessToken}`; skip the header row; map each data row to an `Entry` object per the column order in `contracts/sheets-schema.md`; return an empty array if `values` is absent or contains only the header
- [ ] T033 [P] [US3] Implement `appendEntry(spreadsheetId, accessToken, entry)` in `src/services/googleSheets.js`: call `POST …/values/Entries!A:G:append?valueInputOption=RAW` with the entry serialised as a 7-element array `[id, type, title, description, category, date, createdAt]`; on network error retry once after 2 seconds; throw a user-readable error object on second failure
- [ ] T034 [US3] Implement `initSheet(spreadsheetId, accessToken)` in `src/services/googleSheets.js`: call `GET spreadsheets/{id}` to check if the `Entries` sheet exists; if not, call `batchUpdate` to add it and append the header row `["id","type","title","description","category","date","createdAt"]` via `values.append`
- [ ] T035 [US3] Implement `src/hooks/useGoogleAuth.js`: dynamically load the GIS script (`accounts.google.com/gsi/client`); expose `initiateAuth()` that calls `google.accounts.oauth2.initTokenClient` with `VITE_GOOGLE_CLIENT_ID` and scope `https://www.googleapis.com/auth/spreadsheets`; on token callback, dispatch `SET_AUTHORISED` to `AuthContext`; detect 401 API responses and dispatch `SET_ERROR` with "Session expired — Reconnect"
- [ ] T036 [US3] Create `src/components/auth/AuthGate.jsx`: if `AuthContext.status` is not `'authorised'`, render a connect prompt with a "Connect Google Account" button that calls `useGoogleAuth.initiateAuth()`; if `status === 'error'` with session-expiry message, render "Session expired — Reconnect" prompt (FR-011); render `children` when `status === 'authorised'`
- [ ] T037 [US3] Implement the spreadsheet selection flow in `AuthGate`: after OAuth succeeds, render two options — (1) **"Create new spreadsheet"** button that calls `initSheet` on a newly created Google Sheets document and stores the resulting spreadsheet ID in `localStorage`; (2) a URL input for returning users to reconnect to an existing spreadsheet; validate the URL format (must contain `/spreadsheets/d/{id}/`); extract and store the spreadsheet ID in `localStorage`; if the format is unexpected, show an actionable error with options to fix the URL or create a new sheet (FR-007)
- [ ] T038 [US3] Update `src/hooks/useEntries.js` to call `googleSheets.readEntries` on auth success (dispatch `SET_LOADING` then `SET_ENTRIES`); call `googleSheets.appendEntry` on `addEntry` (dispatch `SET_SAVING` before the call, `APPEND_ENTRY` on success, `SET_ERROR` on failure); read spreadsheet ID from `localStorage`; pass access token from `AuthContext`
- [ ] T039 [US3] Handle Google Sheets API error scenarios in `src/hooks/useEntries.js` and `src/services/googleSheets.js`: quota exceeded (HTTP 429) → "Storage quota exceeded — try again later"; externally deleted spreadsheet (404) → "Spreadsheet not found — reconnect or create a new one"; unexpected sheet format → surface the error from `initSheet`; all errors must produce actionable, human-readable messages (FR-008)
- [ ] T040 [US3] Wrap `src/App.jsx` content with `<AuthGate>`; run `npm run dev` and verify the full flow: connect prompt → authorise → create spreadsheet → log entry → entry appears in list → close tab → reopen → reconnect with URL → entry persists

**Checkpoint**: Full application is functional end-to-end with Google Sheets persistence. All T030–T031 tests pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Deployment automation with CI performance enforcement, mobile responsiveness, integration test documentation, and end-to-end validation.

- [ ] T041 [P] Create `.github/workflows/deploy.yml` GitHub Actions workflow: trigger on push to `main`; steps — checkout, setup-node@v4 (Node 20), `npm ci`, `npm run test:run` (all tests must pass), `npm run build` (with `VITE_GOOGLE_CLIENT_ID` from repository secrets), `vite preview &` then `npx lhci autorun` with performance budgets (page load ≤ 2 s, TTI ≤ 3 s) as blocking assertions, deploy `dist/` to GitHub Pages using `peaceiris/actions-gh-pages@v4`; failing Lighthouse CI budgets MUST block the deploy
- [ ] T042 Create `tests/integration/auth-and-persistence.md` manual integration test script (complement to the automated tests) covering: full first-run auth and sheet creation via button; entry logging and immediate display; session persistence across browser restarts (reconnect with spreadsheet URL); session expiry handling ("Session expired — Reconnect" prompt); invalid spreadsheet URL error and recovery; failed save retry flow
- [ ] T043 [P] Apply mobile-responsive styles to `src/components/entry/EntryForm.jsx`, `src/components/entry/EntryList.jsx`, and `src/components/summary/EntrySummary.jsx` using shadcn/ui responsive utilities and Tailwind breakpoint classes; test on a ≤ 375 px viewport in browser dev tools
- [ ] T044 Run the full `quickstart.md` validation sequence: bootstrap, install dependencies, configure `VITE_GOOGLE_CLIENT_ID` in `.env`, `npm run dev`, verify connect → create sheet → log entry → view entry locally, `npm run test:run` (all green), `npm run deploy`, confirm the deployed app loads within 2 s on GitHub Pages and the entry round-trip completes within 4 s

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **User Stories (Phases 3–5)**: All depend on Phase 2 completion; proceed in priority order (US1 → US2 → US3) because US2 builds on US1 components and US3 wires US1/US2 to real storage
- **Polish (Phase 6)**: Depends on Phase 5 completion

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: `EntryList` (T018) and `EntriesContext` filter action (T010) are prerequisites; start after US1 is complete; `EntrySummary` (T027) and filter controls (T025) are independently buildable in parallel
- **US3 (P3)**: The service layer (T032–T034) is independently buildable after Phase 2; wiring to state (T038) requires `useEntries` from US1

### Within Each Phase

- **Test tasks MUST precede implementation tasks** (TDD: Red-Green-Refactor)
- Models/services before hooks, hooks before components, components before App.jsx integration
- Each phase ends with an App.jsx integration step that verifies the story end-to-end

### Parallel Opportunities

- Phase 1: T003, T004, T005, T006 in parallel after T001+T002
- Phase 2: T011 in parallel with T009 and T010
- Phase 3: T013, T014, T015 in parallel (test tasks, all different files); T016 and T017 in parallel (different component files)
- Phase 4: T023 and T024 in parallel (test tasks); T025 and T027 in parallel (different files)
- Phase 5: T030 and T031 in parallel (test tasks); T032 and T033 in parallel (different service functions); T035 in parallel with T032/T033/T034
- Phase 6: T041 and T043 in parallel

---

## Parallel Example: User Story 1

```bash
# Write all test files in parallel (TDD — must fail first):
Task T013: tests/unit/models/entry.test.js
Task T014: tests/unit/components/EntryForm.test.jsx
Task T015: tests/unit/components/EntryList.test.jsx + tests/unit/hooks/useEntries.test.js

# Then implement in parallel where possible:
Task T016: src/components/entry/EntryForm.jsx
Task T017: src/components/entry/EntryCard.jsx

# Then sequentially:
Task T018: src/components/entry/EntryList.jsx   (depends on EntryCard)
Task T019: src/hooks/useEntries.js
Task T020: Wire form + list in App.jsx
```

## Parallel Example: User Story 3

```bash
# Write all test files in parallel (TDD — must fail first):
Task T030: tests/integration/googleSheets.test.js
Task T031: tests/unit/hooks/useGoogleAuth.test.js

# Implement service functions in parallel:
Task T032: readEntries() in googleSheets.js
Task T033: appendEntry() in googleSheets.js
Task T035: useGoogleAuth.js

# Then sequentially:
Task T034: initSheet() in googleSheets.js
Task T036: AuthGate.jsx
Task T037: Spreadsheet selection flow in AuthGate
Task T038: Wire useEntries to googleSheets
Task T039: Error handling
Task T040: Integrate AuthGate in App.jsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — **CRITICAL, blocks everything**
3. Write tests T013–T015 (must fail)
4. Complete Phase 3: User Story 1
5. **STOP and VALIDATE**: All T013–T015 tests pass; log an entry, see it in list, test validation and retry
6. Optional: demo before continuing to US2

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1 tests → impl) → In-memory log and list → **MVP demo**
3. Phase 4 (US2 tests → impl) → Filters and summary panel → richer view
4. Phase 5 (US3 tests → impl) → Google Sheets persistence → production-ready
5. Phase 6 (Polish) → Deployment automation, Lighthouse CI, mobile polish → ship

---

## Notes

- `[P]` tasks operate on different files with no blocking dependencies — safe to run simultaneously
- `[Story]` label maps each task to a user story for traceability
- Test tasks MUST be written before the implementation tasks they cover — verify they fail first
- Commit after each task or logical group
- Stop at any phase checkpoint to validate the story independently before moving on
- Total tasks: **44** (7 setup + 5 foundational + 10 US1 + 7 US2 + 11 US3 + 4 polish)
