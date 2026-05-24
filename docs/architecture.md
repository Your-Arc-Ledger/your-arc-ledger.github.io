# Architecture

Domain terms, data types, and architectural concepts used throughout this codebase.

---

## Domain

**Arc Ledger** — The name given to the Google Spreadsheet that Arc creates in the user's Google Drive. Referred to in code as the backing store for all entries.

**Entry** — The core data record. Represents a single achievement or lesson logged by the user. Defined at `src/models/entry.ts`.

**Achievement** — An `Entry` of `type: 'achievement'`. Represents something the user accomplished.

**Lesson** — An `Entry` of `type: 'lesson'`. Represents something the user learned, typically from a setback or mistake.

**Category** — One of potentially many labels on an `Entry` used to group related entries. Stored as `categories: string[]` on `Entry` and serialised to the Sheets `category` column as a JSON array (e.g. `["Work","Health"]`). Legacy entries that stored a plain string are read back as a single-element array. Each value is max 50 characters. Available values are surfaced from the Lookups sheet and from the unique categories already present in loaded entries.

**SheetRef** — A lightweight pointer (`{ id: string; title: string }`) to the user's Google Spreadsheet, persisted in `localStorage` under the key `arc-spreadsheet:v1`. Defined at `src/lib/storage.ts`. Avoids re-prompting for the spreadsheet ID on every page load. Legacy entries stored under `arc-spreadsheet` (no version suffix) are migrated to `arc-spreadsheet:v1` on first load.

**spreadsheetId** — The Google Sheets document identifier, extracted from the spreadsheet URL (`/spreadsheets/d/<spreadsheetId>/`). Used as the primary key for all Sheets API calls.

**Entries sheet** — The tab named `"Entries"` inside the Arc Ledger spreadsheet. `initSheet` creates it on first use if absent. Columns: `id | type | title | description | category | date | createdAt`.

**Lookups sheet** — The tab named `"Lookups"` inside the Arc Ledger spreadsheet. `initSheet` creates it on first use if absent. Columns: `type | value`. Stores managed lookup values keyed by type (e.g. `type = "category"` for category options). Extensible for future lookup kinds without schema changes.

---

## Data Model (`src/models/entry.ts`)

**`Entry`** — Full persisted record. Fields: `id` (UUID), `type`, `title`, `description`, `categories` (string array), `date` (user-supplied date string), `createdAt` (ISO timestamp set at creation).

**`EntryFields`** — The subset of `Entry` accepted as user input when creating a new entry. `description` and `category` are optional here.

**`ValidationResult`** — Return type of `validateEntry` when all fields are valid: `{ valid: true }`.

**`ValidationFailure`** — Return type of `validateEntry` when one or more fields fail: `{ valid: false; errors: Partial<Record<keyof EntryFields, string>> }`.

**`createEntry(fields)`** — Factory function. Merges `EntryFields` with a generated UUID and `createdAt` timestamp to produce a full `Entry`.

**`validateEntry(entry)`** — Pure validation function. Returns `ValidationResult | ValidationFailure`. Does not throw.

---

## State Machines

### Auth (`src/context/AuthContext.tsx`)

| Status | Meaning |
|---|---|
| `idle` | No auth attempt made yet |
| `authorising` | OAuth popup is open / token request in flight |
| `authorised` | Access token received and stored |
| `error` | Auth attempt failed |

**`accessToken`** — Short-lived Google OAuth 2.0 bearer token. Scoped to `https://www.googleapis.com/auth/spreadsheets`. Held in memory only (never persisted); expires after ~1 hour.

### Entries (`src/context/EntriesContext.tsx`)

| Status | Meaning |
|---|---|
| `idle` | Not yet attempted to load |
| `loading` | `readEntries` fetch in flight |
| `loaded` | Entries fetched and stored in `items` |
| `saving` | `appendEntry` fetch in flight |
| `error` | Last operation failed; `error` field contains the message |

---

## Architecture

**`AuthContext` / `AuthProvider`** (`src/context/AuthContext.tsx`) — React context holding auth state and dispatch. Must wrap the entire app; accessed via `useAuth()`.

**`EntriesContext` / `EntriesProvider`** (`src/context/EntriesContext.tsx`) — React context holding entries state and dispatch. Accessed via `useEntriesContext()`. State is managed with `useReducer`.

**`useGoogleAuth`** (`src/hooks/useGoogleAuth.ts`) — Hook that lazily loads the Google Identity Services (GIS) script and exposes `initiateAuth()` to trigger the OAuth token flow.

**`useEntries`** (`src/hooks/useEntries.ts`) — Primary data hook. On mount (when authorised), fetches entries from the Sheets API. Exposes `addEntry(fields)` which validates, creates, and appends an entry both locally and to the spreadsheet.

**`useCategories`** (`src/hooks/useCategories.ts`) — Hook that fetches category values from the Lookups sheet on auth and exposes `addCategory(name)`. New categories are added optimistically to local state and persisted to the sheet; failures roll back the local state.

**`googleSheets` service** (`src/services/googleSheets.ts`) — Thin wrapper over the Google Sheets REST API. Exported functions:
- `readEntries(spreadsheetId, accessToken)` — GET the `Entries` range; maps rows to `Entry` objects.
- `appendEntry(spreadsheetId, accessToken, entry)` — POST a new row; retries once after 2 s on failure.
- `updateEntry(spreadsheetId, accessToken, entry)` — Reads the sheet to find the row index, then PUTs the updated row.
- `readCategories(spreadsheetId, accessToken)` — GET the `Lookups` range; returns `string[]` of values where `type === "category"`.
- `appendCategory(spreadsheetId, accessToken, category)` — POST a new category row to the Lookups sheet.
- `initSheet(spreadsheetId, accessToken)` — Ensures both the `Entries` and `Lookups` tabs and their header rows exist; idempotent.

**`storage`** (`src/lib/storage.ts`) — `localStorage` helpers for `SheetRef`. `loadSheetRef()` parses and validates; `saveSheetRef(ref)` serialises. Key: `arc-spreadsheet`.

**GIS (Google Identity Services)** — Google's client-side OAuth library loaded via `https://accounts.google.com/gsi/client`. Used to obtain short-lived access tokens without a backend.

---

## Development Process

**Constitution** — The governance document embedded in `CLAUDE.md` that defines code quality, testing, UX, and performance standards. All PRs must pass its Quality Gates.

**spec.md** — Written before any implementation code. Documents what a feature should do.

**plan.md** — Derived from `spec.md`. Includes implementation steps, a Constitution Check gate, and performance targets. Stored under `docs/superpowers/plans/`.

**Constitution Check** — A review step inside `plan.md` that explicitly verifies the planned approach complies with each principle of the Arc Constitution before implementation begins.

**Red-Green-Refactor** — The required TDD cycle: write a failing test (red), implement until it passes (green), then clean up (refactor). Skipping the failing-test step is a Constitution violation.

**Feature branch naming** — Branches must follow the pattern `###-feature-name` (e.g. `001-sheet-ref-local-storage`).
