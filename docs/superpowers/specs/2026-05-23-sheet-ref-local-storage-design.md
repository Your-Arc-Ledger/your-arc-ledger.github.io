# Sheet Reference Local Storage

**Date:** 2026-05-23
**Status:** Approved

## Problem

When a Google OAuth session expires the error screen shows "Session expired — Reconnect" with no
indication of which spreadsheet was in use. The user cannot tell at a glance whether they are
reconnecting to the right sheet.

## Goal

Persist a `{ id, title }` sheet reference to `localStorage` when the user connects their
spreadsheet. Surface the title on the session-expired screen so the user can immediately identify
which sheet they are reconnecting to.

---

## Storage Layer

**New file:** `src/lib/storage.ts`

```ts
export interface SheetRef {
  id: string
  title: string
}
```

Two exported functions:

| Function | Behaviour |
|---|---|
| `loadSheetRef()` | Reads `arc-spreadsheet` from `localStorage`, parses JSON, returns `SheetRef \| null`. Returns `null` if absent or malformed. |
| `saveSheetRef(ref: SheetRef)` | Serialises ref as JSON and writes to `arc-spreadsheet`. |

**`src/lib/constants.ts`** — remove `SPREADSHEET_STORAGE_KEY`; it is replaced by the `'arc-spreadsheet'` key used internally in `storage.ts`. No migration from the old `arc-spreadsheet-id` key is required (app is pre-launch).

---

## Connection Flow (`src/components/auth/AuthGate.tsx`)

### Create path

The `POST /v4/spreadsheets` response body includes `properties.title`. Read it and call
`saveSheetRef({ id: data.spreadsheetId, title: data.properties.title })`. No extra request needed.

### Connect path (URL entry)

After extracting the `id` from the pasted URL, call:

```
GET https://sheets.googleapis.com/v4/spreadsheets/{id}?fields=properties.title
```

using the existing `accessToken` prop. On success call `saveSheetRef({ id, title })`. If the
request fails, surface the error and block navigation — no partial ref is saved.

---

## Error State UI (`src/components/auth/AuthGate.tsx`)

When `state.status === 'error'`:

1. Call `loadSheetRef()`.
2. If a ref exists, render:
   ```
   Session expired
   Your spreadsheet "Arc" is still connected.
   [ Reconnect Google Account ]
   ```
3. If no ref exists, render the existing generic error message and button.

---

## `useEntries.ts`

Replace `getSpreadsheetId()` with `loadSheetRef()?.id`. No other logic changes.

---

## Tests

| Test | Location |
|---|---|
| `loadSheetRef` / `saveSheetRef` roundtrip | `tests/unit/lib/storage.test.ts` |
| `loadSheetRef` returns null when absent | `tests/unit/lib/storage.test.ts` |
| `loadSheetRef` returns null for malformed JSON | `tests/unit/lib/storage.test.ts` |
| `handleConnect` calls `saveSheetRef` with fetched title | `tests/unit/components/auth/AuthGate.test.tsx` |
| `handleConnect` shows error when title fetch fails | `tests/unit/components/auth/AuthGate.test.tsx` |
| Error state shows sheet title when ref is in localStorage | `tests/unit/components/auth/AuthGate.test.tsx` |
| Error state shows generic fallback when no ref in localStorage | `tests/unit/components/auth/AuthGate.test.tsx` |
