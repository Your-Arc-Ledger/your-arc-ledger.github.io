# Implementation Plan: Achievement & Setback Tracker

**Branch**: `001-achievement-tracker` | **Date**: 2026-05-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-achievement-tracker/spec.md`

## Summary

A single-user React web application deployed to GitHub Pages that lets users log and review personal achievements and setbacks. Data is persisted to a Google Sheets document in the user's own Google Drive, accessed via the Google Sheets API v4 with client-side OAuth 2.0 (PKCE). The application is entirely static — no server-side component.

## Technical Context

**Language/Version**: JavaScript (ES2022+) with React 18

**Primary Dependencies**: React 18, Vite (build tool), Google Identity Services (OAuth 2.0 PKCE), Google Sheets API v4, React Testing Library, Jest

**Storage**: Google Sheets document in the user's Google Drive (one sheet, columnar schema)

**Testing**: Jest + React Testing Library (unit/component); Google Sheets API mocked via `vi.mock` / `jest.mock` for unit tests; manual integration test against a real test spreadsheet for the auth and persistence flows

**Target Platform**: Static web app on GitHub Pages (modern browsers; Chrome 110+, Firefox 110+, Safari 16+); mobile browser support in scope

**Project Type**: Single-page React application (client-side only)

**Performance Goals**:
- Initial page load (cold): ≤ 2 s on standard broadband (constitution default)
- Entry list render after data loads: ≤ 1 s
- Save confirmation visible to user: ≤ 4 s (Google Sheets API write round-trip; see Constitution Check note)

**Constraints**:
- GitHub Pages requires a fully static build — no Node.js server, no backend API
- All OAuth credentials are public-facing (client ID only; no client secret in client-side PKCE flow)
- Google Sheets is the sole data store; no local database or backend cache
- Single user at a time; no conflict resolution needed

**Scale/Scope**: Personal tool for one user; expected data volume ≤ 1,000 entries over the life of the tool

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I — Code Quality | Zero ESLint errors; single-responsibility components; no dead code | PASS | ESLint + Prettier configured at project init; Vite template enforces this |
| I — Code Quality | Every abstraction beyond immediate task justified in PR | PASS | Plan and PR will carry Complexity Justification if needed |
| II — Testing Standards | TDD (Red-Green-Refactor) enforced | PASS | RTL + Jest; failing tests written first per workflow |
| II — Testing Standards | Unit tests for happy path and all edge cases | PASS | Google Sheets service layer fully mockable |
| II — Testing Standards | Integration tests cover cross-boundary interactions | PASS | Auth flow and Sheets write/read covered by integration scenario (manual or automated against test sheet) |
| III — UX Consistency | Loading, empty, and error states for all flows | PASS | Required for: initial data load, save operation, auth flow, auth expiry |
| III — UX Consistency | Human-readable, actionable error messages | PASS | All Google API errors mapped to user-friendly messages |
| IV — Performance | Page load ≤ 2 s on standard connection | PASS | Static React build served from GitHub Pages CDN |
| IV — Performance | Per-feature performance targets defined in plan.md | PASS | Defined above; save confirmation ≤ 4 s |
| IV — Performance | API responses ≤ 200 ms p95 | N/A — see note | This project does not build a server API. The budget applies to APIs we serve; Google Sheets is an external third-party service. Save round-trip target is 4 s (user-visible); this is documented as an intentional relaxation due to external dependency, not a violation. |

**Post-Phase-1 re-check**: Re-evaluate after data-model.md and contracts are defined. Specifically verify that the Sheets schema does not introduce additional latency (e.g., large spreadsheet scan on every read).

## Project Structure

### Documentation (this feature)

```text
specs/001-achievement-tracker/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── sheets-schema.md
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── auth/
│   │   └── AuthGate.jsx         # Wraps app; shows connect prompt if not authorised
│   ├── entry/
│   │   ├── EntryForm.jsx        # New entry form (title, type, description, category, date)
│   │   ├── EntryList.jsx        # Chronological list of all entries
│   │   └── EntryCard.jsx        # Single entry display (achievement vs setback styled)
│   └── summary/
│       └── EntrySummary.jsx     # 30-day counts panel
├── hooks/
│   ├── useEntries.js            # Entries state; read/write via sheets service
│   └── useGoogleAuth.js         # OAuth 2.0 token lifecycle
├── services/
│   └── googleSheets.js          # All Google Sheets API calls (isolated for mocking)
├── App.jsx
└── main.jsx

tests/
├── unit/
│   ├── components/
│   └── services/
└── integration/
    └── auth-and-persistence.md  # Manual integration test script (automated where feasible)
```

**Structure Decision**: Single-project React SPA. No backend directory needed — the Google Sheets API is consumed directly from the browser. Services layer isolates all external API calls to keep components testable.

## Complexity Tracking

> No constitution violations requiring justification at this stage.
