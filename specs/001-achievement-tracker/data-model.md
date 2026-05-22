# Data Model: Achievement & Setback Tracker

**Phase**: 1 | **Date**: 2026-05-23 | **Plan**: [plan.md](plan.md)

## Entities

### Entry

The core record of a single logged achievement or setback.

| Field        | Type     | Required | Constraints                                      |
|--------------|----------|----------|--------------------------------------------------|
| `id`         | string   | Yes      | UUID v4; generated client-side at creation time  |
| `type`       | string   | Yes      | Enum: `"achievement"` or `"setback"`             |
| `title`      | string   | Yes      | 1–200 characters                                 |
| `description`| string   | No       | 0–2000 characters; defaults to empty string      |
| `category`   | string   | No       | Free-text label; 0–50 characters                 |
| `date`       | string   | Yes      | ISO 8601 date (`YYYY-MM-DD`); defaults to today  |
| `createdAt`  | string   | Yes      | ISO 8601 datetime; set at creation, never updated|

**Relationships**: None (entries are independent; no parent-child hierarchy in v1)

**State Transitions**: Entries are created once and read many times. In-place editing is out of scope for v1. Deletion is out of scope for v1.

**Validation Rules**:
- `type` must be exactly `"achievement"` or `"setback"` — reject any other value
- `title` must not be blank after trimming whitespace
- `date` must be a valid calendar date; future dates are allowed (e.g., logging something planned)
- `id` and `createdAt` are system-generated; the user never provides them

---

### Summary (Derived — Not Stored)

A computed snapshot of entry counts for a given time window, shown in the summary panel.

| Field                  | Type   | Computed From                                      |
|------------------------|--------|----------------------------------------------------|
| `achievementCount`     | number | Count of entries with `type === "achievement"` in window |
| `setbackCount`         | number | Count of entries with `type === "setback"` in window     |
| `windowDays`           | number | Fixed at 30 (days prior to and including today)    |

---

## Application State Shape

```
AppState
├── auth
│   ├── status: "idle" | "authorising" | "authorised" | "error"
│   ├── accessToken: string | null
│   └── error: string | null
└── entries
    ├── status: "idle" | "loading" | "loaded" | "saving" | "error"
    ├── items: Entry[]         (sorted descending by date, then createdAt)
    ├── filter: "all" | "achievement" | "setback"
    └── error: string | null
```

---

## Google Sheets Storage Schema

Entries are stored in a Google Sheets document with a single sheet named `Entries`.

Row 1 is a fixed header row (never modified). Each subsequent row is one Entry.

| Column | Header       | Maps To      | Notes                                      |
|--------|--------------|--------------|--------------------------------------------|
| A      | `id`         | `id`         | UUID; used as row identifier for updates   |
| B      | `type`       | `type`       | `"achievement"` or `"setback"`             |
| C      | `title`      | `title`      | Plain text                                 |
| D      | `description`| `description`| Plain text; empty string if not provided   |
| E      | `category`   | `category`   | Plain text; empty string if not provided   |
| F      | `date`       | `date`       | `YYYY-MM-DD`                               |
| G      | `createdAt`  | `createdAt`  | ISO 8601 datetime string                   |

**Read strategy**: `GET values/{spreadsheetId}/values/Entries!A:G` — returns all rows including header; header row is skipped during parsing.

**Write strategy (new entry)**: `POST values/{spreadsheetId}/values/Entries!A:G:append` with `valueInputOption=RAW`.

**Spreadsheet Initialisation**: If the `Entries` sheet does not exist or the header row is missing, the app creates it automatically on first authorised load.
