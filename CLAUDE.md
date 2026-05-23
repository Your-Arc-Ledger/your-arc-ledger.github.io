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

`src/components/` — UI components; `src/hooks/` — custom hooks; `src/services/` — external API clients; `src/context/` — React context providers; `src/models/` — data types.

## Session Self-Evaluation

At the end of each session, evaluate how well these instructions served the work and offer concrete suggestions for improvement. Specifically consider:

- Were any instructions missing, ambiguous, or contradicted each other?
- Did you need to discover something (a command, a file location, a convention) that should be documented here?
- Did any instruction cause unnecessary friction or repeated tool calls?
- Is the tech stack, source layout, or commands section still accurate?

Present suggestions as specific proposed edits — not vague observations. The user decides whether to apply them.

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
Per-feature performance targets MUST be defined in `plan.md` before implementation begins.
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

## Development Workflow

1. Create a feature branch from `main` following the `###-feature-name` naming convention.
2. Write or update `spec.md` before writing any implementation code.
3. Generate `plan.md` with a Constitution Check gate; performance targets MUST be defined here.
4. Write failing tests first; get team approval that they correctly specify behavior; then implement
   until tests pass (Red-Green-Refactor).
5. Open a pull request against `main`; all Quality Gates MUST pass before merge.
6. Performance targets from `plan.md` MUST be verified (automated benchmark or documented manual
   measurement) before the PR is approved.

## Governance

This constitution supersedes all prior team conventions. Amendments require:

1. A pull request proposing the change with written rationale.
2. At least one reviewer approval.
3. A migration plan if existing code or process must change to comply with the amendment.

**Versioning policy** (semantic versioning):
- **MAJOR**: Backward-incompatible change — principle removal, redefinition, or governance overhaul.
- **MINOR**: New principle or section added, or material guidance expansion.
- **PATCH**: Clarification, wording fix, or non-semantic refinement.

All PRs and code reviews MUST verify compliance with this constitution. Non-compliance is a
blocking comment, not a suggestion. Use `plan.md` Constitution Check gates to surface violations
before implementation begins.

**Version**: 1.0.0 | **Ratified**: 2026-05-23 | **Last Amended**: 2026-05-23
<!-- CONSTITUTION END -->
