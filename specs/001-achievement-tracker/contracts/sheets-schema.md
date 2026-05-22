# Contract: Google Sheets Storage Schema

**Type**: Storage interface contract | **Date**: 2026-05-23 | **Plan**: [../plan.md](../plan.md)

## Purpose

This document defines the contract between the application and the user's Google Sheets document. It is the single source of truth for how data is laid out in the spreadsheet. Any change to this schema is a breaking change and requires a migration strategy.

## Spreadsheet Structure

- **Document**: One Google Sheets document per user (created manually or initialised by the app)
- **Sheet name**: `Entries` (exact casing; the app targets this sheet by name)
- **Header row**: Row 1 (always present; never used as data)

## Column Schema

| Column | Header Name  | Data Type | Required | Format / Constraints                          |
|--------|--------------|-----------|----------|-----------------------------------------------|
| A      | `id`         | String    | Yes      | UUID v4 (`xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx`) |
| B      | `type`       | String    | Yes      | Exactly `achievement` or `setback`            |
| C      | `title`      | String    | Yes      | Plain text; 1–200 characters                  |
| D      | `description`| String    | No       | Plain text; may be empty; up to 2000 characters|
| E      | `category`   | String    | No       | Plain text; may be empty; up to 50 characters |
| F      | `date`       | String    | Yes      | `YYYY-MM-DD` (ISO 8601 date, no time)         |
| G      | `createdAt`  | String    | Yes      | ISO 8601 datetime (`YYYY-MM-DDTHH:mm:ss.sssZ`)|

## API Operations

### Read All Entries

```
GET https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/Entries!A:G
Authorization: Bearer {accessToken}
```

**Response**: `{ "values": [["id","type","title",...], ["uuid","achievement","My title",...], ...] }`

The first element of `values` is the header row — skip it when parsing entries.

**Empty sheet**: If `values` is absent or contains only the header row, the entry list is empty.

### Append a New Entry

```
POST https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/Entries!A:G:append?valueInputOption=RAW
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "values": [["<id>", "<type>", "<title>", "<description>", "<category>", "<date>", "<createdAt>"]]
}
```

**Success**: HTTP 200 with `updatedRange` in response body.

**Failure handling**: Retry once after 2 seconds on network error; surface a user-readable error on second failure.

### Initialise Sheet (if missing)

If the `Entries` sheet does not exist in the document, the app creates it and writes the header row:

```
POST https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/batchUpdate
  → addSheet: { "title": "Entries" }

POST .../values/Entries!A1:G1:append?valueInputOption=RAW
  → values: [["id","type","title","description","category","date","createdAt"]]
```

## Breaking vs Non-Breaking Changes

| Change | Classification | Action Required |
|--------|---------------|-----------------|
| Add a new column (H+) | Non-breaking (app reads A:G only) | Update schema version; update read range |
| Rename an existing column | Breaking | Migration script required |
| Reorder existing columns | Breaking | Migration script required |
| Change a value format (e.g., date format) | Breaking | Migration script required |

## Schema Version

**Current**: 1.0.0

The schema version is not stored in the spreadsheet itself. If a breaking migration is introduced, a `_meta` sheet will be added to record the version.
