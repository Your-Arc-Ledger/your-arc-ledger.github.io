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

**`Input` component quirk**: `src/components/ui/input.tsx` wraps `@base-ui/react/input`, not a native `<input>`. It does **not** forward all native HTML attributes — the `list` attribute for `<datalist>` is a known casualty. When a field needs a non-standard HTML attribute that the wrapper may not forward, use a native element (`<input>`, `<select>`, etc.) with explicit Tailwind classes instead of the `Input` wrapper.

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

## Design Conventions

**Field cardinality must be decided before implementation.** Any field that could logically be "one or many" (a label, tag, category, priority, etc.) must be explicitly decided as `string` or `string[]` before writing any code. Changing cardinality after the fact requires updating the data model, Sheets serialisation, every UI component, and every test that constructs an `Entry` — a wide blast radius. If a request is ambiguous, ask.

**Managed lookup options must be derived from two sources.** When a UI field offers a dropdown of managed values (e.g. categories), the option list must be the union of: (1) values stored in the Lookups sheet, and (2) values already present in loaded entries for that field. Relying on only the Lookups sheet leaves all pre-existing entry data invisible to the dropdown until manually re-entered.

**`initSheet` must be called on every path that connects a spreadsheet.** This includes both "create new spreadsheet" and "connect existing spreadsheet" inside `AuthGate.tsx`. Any future auth flow that saves a `SheetRef` must also call `initSheet` so all required sheet tabs and headers are guaranteed to exist.

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

Present suggestions as specific proposed edits — not vague observations.

**Committing self-improvement suggestions**: When a suggestion is a pure addition (new section, new rule, new convention — no existing text modified or removed) and you are certain it is correct and beneficial, apply the edit to CLAUDE.md and commit it immediately without asking. If the change modifies or removes any existing content, show the diff to the user and wait for approval before committing.


## Testing conventions

Test files live under `tests/unit/` mirroring the `src/` structure. Import paths in test files are relative to the test file's own location — e.g. a test at `tests/unit/components/auth/Foo.test.tsx` imports source as `../../../../src/...`, not `../../../src/...`. Use `import type` for type-only imports alongside component imports.

**Mocking modules**: use relative paths in `vi.mock()` calls — do not use the `@/` alias. The alias resolves correctly at runtime but may not match mock registrations in all Vitest versions. Example: `vi.mock('../../../src/services/googleSheets', ...)` not `vi.mock('@/services/googleSheets', ...)`.

**Hook tests with async effects**: when a hook fires an async effect on mount (e.g. a data fetch), the effect's promise may not be settled before the first explicit `act` in the test. Flush pending microtasks with `await act(async () => {})` after `renderHook` before asserting on state that depends on the fetch, or before calling a function that would race with it.
