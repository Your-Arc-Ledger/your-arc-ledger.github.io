---

description: "Task list for Achievement & Setback Tracker implementation"
---

# Tasks: Achievement & Setback Tracker

**Input**: Design documents from `specs/001-achievement-tracker/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/sheets-schema.md ✓, quickstart.md ✓

**Tests**: Not included — no explicit TDD request in the feature specification. Testing infrastructure is set up in Phase 1; unit and integration tests may be added alongside implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every description

## Path Conventions

Single-project React SPA at repository root:
- Source: `src/` (components, hooks, services, context, models)
- Tests: `tests/unit/`, `tests/integration/`
- Config: `vite.config.js`, `package.json`, `.env`, `.github/workflows/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bootstrap the Vite React project, configure tooling, and create the source directory skeleton.

- [ ] T001 Bootstrap Vite React project: run `npm create vite@latest . -- --template react`; install dependencies with `npm install`; create the full `src/` directory hierarchy per plan.md (components/auth/, components/entry/, components/summary/, hooks/, services/, context/, models/)
- [ ] T002 Install testing dependencies: `npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
- [ ] T003 [P] Configure Vitest in `vite.config.js`: add `test: { environment: 'jsdom', setupFiles: './src/test-setup.js' }` block; add `test` script `"test": "vitest"` and `"test:run": "vitest run"` to `package.json`
- [ ] T004 [P] Create `src/test-setup.js` that imports `@testing-library/jest-dom` so all test files get the extended matchers automatically
- [ ] T005 [P] Configure ESLint and Prettier: install `eslint-config-prettier`, add Prettier config; verify `npm run lint` passes with zero errors on the generated scaffold
- [ ] T006 [P] Create `.env.example` with `VITE_GOOGLE_CLIENT_ID=` placeholder; create `.env` with a blank value; confirm `.env` is listed in `.gitignore`
- [ ] T007 Install `gh-pages` (`npm install --save-dev gh-pages`); add `"predeploy": "npm run build"` and `"deploy": "gh-pages -d dist"` scripts to `package.json`; set `base: '/achievement-diary/'` in `vite.config.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure shared by all user stories — state contexts, the Entry data model, the component library, and the App shell. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: All Phase 3+ tasks depend on this phase being complete.

- [ ] T008 Select and install a widely-adopted React component library per FR-012 (e.g. shadcn/ui, Chakra UI, or MUI); add to `package.json`; wrap the app root in any required provider in `src/main.jsx`
- [ ] T009 Create `src/context/AuthContext.jsx`: define auth state shape (`status: 'idle'|'authorising'|'authorised'|'error'`, `accessToken: string|null`, `error: string|null`); implement `useReducer` with actions `SET_AUTHORISING`, `SET_AUTHORISED`, `SET_ERROR`, `CLEAR`; export `AuthContext` and `AuthProvider`
- [ ] T010 Create `src/context/EntriesContext.jsx`: define entries state shape (`status: 'idle'|'loading'|'loaded'|'saving'|'error'`, `items: Entry[]`, `filter: 'all'|'achievement'|'setback'`, `error: string|null`); implement `useReducer` with actions `SET_LOADING`, `SET_ENTRIES`, `APPEND_ENTRY`, `SET_FILTER`, `SET_SAVING`, `SET_ERROR`; export `EntriesContext` and `EntriesProvider`
- [ ] T011 [P] Create `src/models/entry.js`: export `createEntry(fields)` that generates `id` (UUID v4 via `crypto.randomUUID()`), sets `createdAt` to current ISO datetime, merges provided fields; export `validateEntry(entry)` that checks required fields and value constraints per data-model.md
- [ ] T012 Update `src/App.jsx` to wrap the component tree in `<AuthProvider>` and `<EntriesProvider>`; render a placeholder `<main>` layout with slots for the auth gate, entry form, entry list, and summary panel

**Checkpoint**: State infrastructure is ready — user story components can now consume context hooks.

---

## Phase 3: User Story 1 — Log an Achievement or Setback (Priority: P1) 🎯 MVP

**Goal**: User opens the app, fills in the entry form, submits, and immediately sees the new entry in the history list. State is in-memory only (Google Sheets wired in US3).

**Independent Test**: Record a single entry using the form; confirm it appears at the top of the entry list with the correct type, title, and date. Close and reopen the tab — entry is gone (expected: persistence comes in US3). Confirm that submitting an empty form shows validation errors and does not add an entry.

### Implementation for User Story 1

- [ ] T013 [P] [US1] Create `src/components/entry/EntryForm.jsx`: render a form with type selector (achievement / setback), required title input (max 200 chars), optional description textarea (max 2000 chars), optional category input (max 50 chars), and date picker (defaults to today); use component library form primitives; expose `onSubmit(entryFields)` prop
- [ ] T014 [P] [US1] Create `src/components/entry/EntryCard.jsx`: display a single entry's type badge, title, category, date, and description; visually distinguish achievement entries from setback entries (e.g. colour or icon) using component library card and badge components
- [ ] T015 [US1] Create `src/components/entry/EntryList.jsx`: render entries from `EntriesContext` in reverse-chronological order (newest first) using `EntryCard`; show a clear empty-state message when no entries exist; include a loading skeleton while `status === 'loading'`
- [ ] T016 [US1] Implement `src/hooks/useEntries.js`: consume `EntriesContext`; expose `addEntry(fields)` that calls `validateEntry`, creates the entry via `createEntry`, and dispatches `APPEND_ENTRY` to the reducer (in-memory only at this stage); expose `entries`, `filter`, and `status`
- [ ] T017 [US1] Wire `EntryForm` submit handler to `useEntries.addEntry` in `src/App.jsx`; display field-level validation errors returned by `validateEntry` on the form without submitting; confirm the new entry appears at the top of `EntryList` immediately after a successful save
- [ ] T018 [US1] Add error state handling to `EntryList` and `EntryForm`: when `status === 'error'`, show a user-readable error message and a Retry button; keep all form field values intact so the user can retry without re-entering data (FR-008)
- [ ] T019 [US1] Render `EntryForm` and `EntryList` side by side (or stacked on mobile) in `src/App.jsx`; manually verify the complete log-and-view flow in the dev server (`npm run dev`) end-to-end

**Checkpoint**: User Story 1 is fully functional with in-memory state. Log entries, view them in the list, see validation errors on bad input, and retry after a simulated error.

---

## Phase 4: User Story 2 — View Entries in a Digestible Summary (Priority: P2)

**Goal**: The entry list can be filtered by type and category; a summary panel shows achievement and setback counts for the last 30 days.

**Independent Test**: Pre-load the in-memory context with sample entries spanning multiple types and categories; confirm the list renders in chronological order; apply the achievements filter and verify only achievements show; check that the summary panel counts match the expected 30-day totals.

### Implementation for User Story 2

- [ ] T020 [P] [US2] Add type filter controls (All / Achievements / Setbacks) to `src/components/entry/EntryList.jsx` using component library tab or button-group primitives; call `EntriesContext`'s `SET_FILTER` dispatch on selection change
- [ ] T021 [US2] Implement filter logic in `EntriesContext` reducer: when `filter` is `'achievement'` or `'setback'`, derive the displayed list by filtering `items`; when `filter` is `'all'`, return the full list; ensure `items` always stores the unfiltered master list
- [ ] T022 [P] [US2] Create `src/components/summary/EntrySummary.jsx`: compute `achievementCount` and `setbackCount` from `EntriesContext.items` where the entry `date` falls within the last 30 days; display counts using component library stat or badge components; update reactively when new entries are added
- [ ] T023 [US2] Add a category filter select/combobox to `src/components/entry/EntryList.jsx`: populate options from the unique categories present in `items`; implement category filtering in `EntriesContext` reducer (composable with type filter)
- [ ] T024 [US2] Render `EntrySummary` in `src/App.jsx` above or beside the entry list; verify that summary counts update immediately when a new entry is logged and that both type and category filters work correctly together

**Checkpoint**: User Stories 1 and 2 are both functional. The complete read/filter/summarise flow works with in-memory data.

---

## Phase 5: User Story 3 — Connect Personal Storage (Priority: P3)

**Goal**: Users connect their Google account via OAuth 2.0 (GIS token model); entries are read from and written to a Google Sheets document; the auth gate guards the app; session expiry is handled with an explicit reconnect prompt.

**Independent Test**: Connect Google account → confirm new spreadsheet is created → log an entry → close the browser → reopen and reconnect with the same spreadsheet URL → confirm the entry is still present. Also: let the token expire (or simulate 401) → confirm "Session expired — Reconnect" prompt appears; no silent re-auth.

### Implementation for User Story 3

- [ ] T025 [P] [US3] Implement `readEntries(spreadsheetId, accessToken)` in `src/services/googleSheets.js`: call `GET https://sheets.googleapis.com/v4/spreadsheets/{id}/values/Entries!A:G` with `Authorization: Bearer {accessToken}`; skip the header row; map each data row to an `Entry` object using the column order from `contracts/sheets-schema.md`; return an empty array if `values` is absent or contains only the header
- [ ] T026 [P] [US3] Implement `appendEntry(spreadsheetId, accessToken, entry)` in `src/services/googleSheets.js`: call `POST …/values/Entries!A:G:append?valueInputOption=RAW` with the entry serialised as a 7-element array `[id, type, title, description, category, date, createdAt]`; on network error, retry once after 2 seconds; throw a user-readable error object on second failure
- [ ] T027 [US3] Implement `initSheet(spreadsheetId, accessToken)` in `src/services/googleSheets.js`: call `GET spreadsheets/{id}` to check if the `Entries` sheet exists; if not, call `batchUpdate` to add it and then append the header row `["id","type","title","description","category","date","createdAt"]` via `values.append`
- [ ] T028 [US3] Implement `src/hooks/useGoogleAuth.js`: dynamically load the GIS script (`accounts.google.com/gsi/client`); expose `initiateAuth()` that calls `google.accounts.oauth2.initTokenClient` with `VITE_GOOGLE_CLIENT_ID` and scope `https://www.googleapis.com/auth/spreadsheets`; on token callback, dispatch `SET_AUTHORISED` to `AuthContext`; detect token expiry by catching 401 responses and dispatching `SET_ERROR` with a "Session expired — Reconnect" message
- [ ] T029 [US3] Create `src/components/auth/AuthGate.jsx`: if `AuthContext.status` is not `'authorised'`, render a connect prompt (call-to-action button that triggers `useGoogleAuth.initiateAuth()`); if `status === 'error'` and the error indicates expiry, render "Session expired — Reconnect" prompt (FR-011); render `children` when `status === 'authorised'`
- [ ] T030 [US3] Implement spreadsheet URL flow in `AuthGate`: after successful auth, if `status === 'authorised'` and no spreadsheet is configured, present two options — "Create new spreadsheet" (calls `initSheet` with a newly created spreadsheet) and "Enter existing spreadsheet URL"; validate the supplied URL format (must contain `/spreadsheets/d/{id}/`); extract the spreadsheet ID; if the sheet format is unexpected after loading, display an error with options to fix the header row or choose a different spreadsheet (FR-007)
- [ ] T031 [US3] Update `src/hooks/useEntries.js` to call `googleSheets.readEntries` on auth success (dispatch `SET_LOADING` then `SET_ENTRIES`); call `googleSheets.appendEntry` on `addEntry` (dispatch `SET_SAVING` before, `APPEND_ENTRY` on success, `SET_ERROR` on failure); pass spreadsheet ID and access token from `AuthContext`
- [ ] T032 [US3] Handle Google Sheets API error scenarios in `src/hooks/useEntries.js` and `src/services/googleSheets.js`: storage quota exceeded (HTTP 429 / quota error) → "Storage quota exceeded — try again later"; externally deleted spreadsheet (404) → "Spreadsheet not found — reconnect or choose a different one"; unexpected sheet format → surface error from `initSheet`; all errors must produce actionable, human-readable messages (FR-008)
- [ ] T033 [US3] Wrap `src/App.jsx` content with `<AuthGate>`; confirm full flow: open app → see connect prompt → authorise → create/connect spreadsheet → log entry → entry appears in list → close tab → reopen → reconnect → entry persists

**Checkpoint**: Full application is functional end-to-end with Google Sheets persistence. All three user stories are independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Deployment automation, mobile responsiveness, integration test documentation, and end-to-end validation.

- [ ] T034 [P] Create `.github/workflows/deploy.yml` GitHub Actions workflow: trigger on push to `main`; steps — checkout, setup-node@v4 (Node 20), `npm ci`, `npm run build` (with `VITE_GOOGLE_CLIENT_ID` and `VITE_SPREADSHEET_ID` from repository secrets), deploy `dist/` to GitHub Pages using `peaceiris/actions-gh-pages@v4`
- [ ] T035 Create `tests/integration/auth-and-persistence.md` manual integration test script covering: first-run auth and sheet creation; entry logging and immediate display; session persistence across browser restarts (reconnect with existing spreadsheet URL); session expiry handling ("Session expired — Reconnect" prompt); invalid spreadsheet URL error and recovery; failed save retry flow
- [ ] T036 [P] Apply mobile-responsive styles to `EntryForm`, `EntryList`, and `EntrySummary` using the component library's responsive utilities; test on narrow viewport (≤ 375 px) in browser dev tools
- [ ] T037 Run the full `quickstart.md` validation sequence: bootstrap, install dependencies, configure OAuth credentials in `.env`, `npm run dev`, verify log-and-view flow locally, `npm run deploy`, confirm the deployed app loads within 2 s on GitHub Pages and the entry round-trip completes within 4 s

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **User Stories (Phases 3–5)**: All depend on Phase 2 completion; stories proceed in priority order (US1 → US2 → US3) because US2 builds on US1 components and US3 wires US1/US2 to real storage
- **Polish (Phase 6)**: Depends on Phase 5 completion

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: Requires EntryList (T015) and EntriesContext filter action (T010) from US1/Phase 2 — best started after US1 is complete, but filter logic and EntrySummary (T022) are independently buildable
- **US3 (P3)**: The service layer (T025–T027) is independently buildable; wiring to state (T031) requires useEntries from US1

### Within Each Phase

- Models and services before hooks
- Hooks before components
- Components before wiring into App.jsx
- Each phase ends with an App.jsx integration step that verifies the story works end-to-end

### Parallel Opportunities

- Phase 1: T003, T004, T005, T006 can all run in parallel after T001+T002
- Phase 2: T011 can run in parallel with T009 and T010
- Phase 3: T013 and T014 can run in parallel (different files, no shared dependency)
- Phase 4: T020 and T022 can run in parallel (EntryList filter controls and EntrySummary are separate files)
- Phase 5: T025 and T026 can run in parallel (separate functions in googleSheets.js, or split into separate PRs); T028 can run in parallel with T025/T026/T027
- Phase 6: T034 and T036 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Run in parallel (different files, no cross-dependency):
Task T013: Create src/components/entry/EntryForm.jsx
Task T014: Create src/components/entry/EntryCard.jsx

# Then sequentially:
Task T015: Create src/components/entry/EntryList.jsx  (depends on EntryCard)
Task T016: Implement src/hooks/useEntries.js
Task T017: Wire form + list in App.jsx
```

## Parallel Example: User Story 3

```bash
# Run in parallel (all in googleSheets.js but different functions, or separate modules):
Task T025: Implement readEntries()
Task T026: Implement appendEntry()
Task T028: Implement useGoogleAuth.js

# Then sequentially:
Task T027: Implement initSheet()          (depends on readEntries pattern)
Task T029: Create AuthGate.jsx            (depends on useGoogleAuth)
Task T030: Spreadsheet URL flow in AuthGate
Task T031: Wire useEntries to googleSheets
Task T032: Error handling
Task T033: Integrate AuthGate in App.jsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — **CRITICAL, blocks everything**
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Log an entry, see it in the list, test validation errors and retry
5. Optional: demo or share before continuing to US2

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1) → In-memory log and list → **MVP demo**
3. Phase 4 (US2) → Filters and summary panel → richer view
4. Phase 5 (US3) → Google Sheets persistence → production-ready
5. Phase 6 (Polish) → Deployment automation and mobile polish → ship

### Single Developer Strategy

Work sequentially through phases. Within each phase, use parallel tasks to batch independent file work — then integrate in App.jsx at the end of each phase to validate the story.

---

## Notes

- `[P]` tasks operate on different files with no blocking dependencies — safe to run simultaneously
- `[Story]` label maps each task to a user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any phase checkpoint to validate the story independently before moving on
- Avoid editing the same file from two parallel tasks — split work along file boundaries
