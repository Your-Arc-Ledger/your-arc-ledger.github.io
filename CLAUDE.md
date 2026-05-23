# Arc Constitution

## Core Principles

### I. Code Quality

All production code MUST be clean, readable, and maintainable. Every function and module MUST have
a single, clear responsibility. Code MUST pass linting and static analysis with zero errors before
merge. Dependencies MUST be explicit and minimized; unused imports and dead code are not permitted.
Every abstraction beyond what the immediate task requires MUST be justified in the pull request
under a **Complexity Justification** section — undocumented complexity is a blocking review finding.

### II. Testing Standards

Tests MUST be written before implementation code (TDD). The Red-Green-Refactor cycle is
non-negotiable: failing tests are approved by the team, then implementation begins. Every feature
MUST include unit tests covering the happy path and all documented edge cases. Integration tests
MUST cover all cross-boundary interactions: API contracts, database writes, and external service
calls. Test coverage MUST NOT regress below the baseline established at the completion of each
feature; removing tests requires explicit documented justification and reviewer approval.

### III. User Experience Consistency

All UI interactions MUST follow the established design patterns and component conventions in use
across the product — no one-off patterns without documented rationale. Error messages MUST be
human-readable, actionable, and formatted consistently throughout the application. Every
user-facing flow MUST handle loading, empty, and error states; shipping a flow with unhandled
states is a defect, not a deferred task. User-facing changes MUST be validated end-to-end before
merge; reviewing individual screens in isolation is insufficient.

### IV. Performance Requirements

All user-facing operations MUST complete within defined latency budgets. Default budgets:
API responses ≤ 200 ms at p95; page or screen loads ≤ 2 s on a standard connection.
Performance regressions detected in CI MUST be treated as blocking defects, not warnings.
Background and batch operations are exempt from interactive latency budgets but MUST define
explicit throughput or completion-time targets before work starts.

## Quality Gates

Every pull request MUST pass all of the following before merge:

- Linting and static analysis: zero errors
- All existing tests pass; no test deletions without documented justification and approval
- New code has accompanying tests per Principle II (Testing Standards)
- No performance budget regressions (automated check required in CI)
- UX consistency review sign-off for any user-facing changes (Principle III)
- Zero unresolved `TODO(<FIELD_NAME>)` markers in code that ships to production
- Complexity Justification documented for any abstraction beyond the immediate task (Principle I)

## Git commits

Never include AI attribution in commit messages. Do not add `Co-Authored-By`, `Generated-by`, or any other trailer or note that identifies an AI tool as a contributor.

## Tech Stack

- **Framework**: React 19 + TypeScript, Vite 8
- **Styling**: Tailwind CSS 4, shadcn/ui components (`src/components/ui/`)
- **Forms**: react-hook-form + Zod validation
- **Auth**: Google OAuth (`src/hooks/useGoogleAuth.ts`)
- **Data**: Google Sheets API (`src/services/googleSheets.ts`)
- **Testing**: Vitest + Testing Library (`tests/unit/`, `tests/integration/`)
- **Deploy**: GitHub Pages (`npm run deploy`)

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Tests (watch) | `npm test` |
| Tests (CI) | `npm run test:run` |
| Lint | `npm run lint` |
| Build | `npm run build` |

## Source Layout

`src/components/` — UI components; `src/hooks/` — custom hooks; `src/services/` — external API clients; `src/context/` — React context providers; `src/models/` — data types; `src/lib/` — utilities and storage helpers.

## Architecture

Domain terms, data model types, state machine statuses, and architectural concepts are defined in [`docs/architecture.md`](docs/architecture.md). Consult it when uncertain about what a term means in this codebase.

During every session, actively maintain this document:
- **Reference it first** before making assumptions about domain terms, data shapes, or system behaviour.
- **Add new entries** when a concept, type, state, or architectural pattern is encountered that isn't already documented.
- **Correct existing entries** when code or behaviour contradicts what is written — the document must reflect the actual codebase, not intent.
- **Do not wait to be asked** — update the document as discoveries are made, not at the end of the session.

## Session Self-Evaluation

At the end of each session, evaluate how well these instructions served the work and offer concrete suggestions for improvement. Specifically consider:

- Were any instructions missing, ambiguous, or contradicted each other?
- Did you need to discover something (a command, a file location, a convention) that should be documented here?
- Did any instruction cause unnecessary friction or repeated tool calls?
- Is the tech stack, source layout, or commands section still accurate?

Present suggestions as specific proposed edits — not vague observations. The user decides whether to apply them.


## Testing conventions

Test files live under `tests/unit/` mirroring the `src/` structure. Import paths in test files are relative to the test file's own location — e.g. a test at `tests/unit/components/auth/Foo.test.tsx` imports source as `../../../../src/...`, not `../../../src/...`. Use `import type` for type-only imports alongside component imports.
