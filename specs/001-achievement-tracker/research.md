# Research: Achievement & Setback Tracker

**Phase**: 0 | **Date**: 2026-05-23 | **Plan**: [plan.md](plan.md)

## 1. Google OAuth 2.0 for Client-Side Apps

**Decision**: Use Google Identity Services (GIS) with the OAuth 2.0 implicit flow (token model) — not PKCE, which requires a redirect URI capable of receiving the code.

**Rationale**: GitHub Pages serves static files only. The GIS JavaScript library (`accounts.google.com/gsi/client`) supports the token model for browser-only apps: the user clicks "Sign in with Google", grants consent, and the library returns an access token directly in the browser. No server-side token exchange is required. PKCE requires a redirect handler that can exchange the auth code; a static page cannot do this reliably without a backend or a proxy.

**Alternatives Considered**:
- **PKCE with a redirect handler**: Would require a small cloud function or proxy; adds infrastructure complexity that conflicts with the GitHub Pages-only constraint.
- **Service Account with shared credentials**: Not viable for a personal tool — credentials would be embedded in public source and grant access to the developer's account, not the user's.

**Key Implementation Note**: The GIS token model issues short-lived access tokens (~1 hour). The app must detect token expiry and prompt re-authorisation. This is required handling for the FR-010 / auth-expiry edge case.

**Required OAuth Scope**: `https://www.googleapis.com/auth/spreadsheets` (read and write to Sheets)

---

## 2. Google Sheets API v4 — Reading and Writing Entries

**Decision**: Use the Google Sheets API v4 REST interface directly from the browser (no SDK wrapper library).

**Rationale**: The `googleapis` npm package is a Node.js library; it does not work in the browser without significant bundling complexity. The REST API is straightforward and well-documented. Calls are made with `fetch` using the access token from GIS. This keeps the dependency count low (constitution Principle I) and avoids bundling a large SDK.

**Spreadsheet Structure**: A single sheet named `Entries`. Columns are fixed (see contracts/sheets-schema.md). Reads use `values.get` on the full range; writes use `values.append` for new entries. Updates (edit/delete) use `values.update` on a specific row.

**Alternatives Considered**:
- **`gapi.client.sheets`**: Older Google API JavaScript client; still works but is being phased out in favour of GIS + direct fetch.
- **Firebase Firestore**: Would require a Firebase project and additional auth layer; higher operational complexity than the user-owned Sheets approach.
- **localStorage**: Does not persist across devices and is browser-scoped; does not meet the cross-session persistence requirement.

**Latency Note**: Google Sheets API write latency is typically 500ms–2s per call over standard broadband. The user-visible save target of ≤ 4s accounts for this. The UI must show an in-progress state during writes (constitution Principle III).

---

## 3. GitHub Pages Deployment

**Decision**: Build with Vite and deploy to GitHub Pages via the `gh-pages` npm package, triggered by a GitHub Actions workflow on push to `main`.

**Rationale**: Vite produces an optimised static bundle suitable for GitHub Pages. The `gh-pages` package pushes the `dist/` output to the `gh-pages` branch, which GitHub Pages serves. This is the simplest reliable deployment path for a React SPA on GitHub Pages.

**Routing Note**: GitHub Pages does not support server-side redirects. React Router's `BrowserRouter` will break on direct URL access (non-root paths 404). Since this app has no deep-linked routes (it is a single-page tool), using a single route at `/` is sufficient and avoids the 404 problem entirely. If routing is later needed, `HashRouter` is the GitHub Pages-compatible alternative.

**Alternatives Considered**:
- **GitHub Actions direct deploy (upload-artifact)**: More steps; `gh-pages` is simpler for this use case.
- **Netlify / Vercel**: Would work but adds external hosting dependency beyond the GitHub Pages requirement.

---

## 4. React State Management

**Decision**: React Context + `useReducer` for global state. No third-party state library.

**Rationale**: The application has two state domains: authentication state (token, user info) and entries state (the list of entries, loading/error flags). Both fit cleanly into Context + useReducer without the overhead of Zustand, Redux, or similar. The constitution (Principle I) requires justification for every abstraction; adding a state library for this scope is not justified.

**Alternatives Considered**:
- **Zustand**: Clean API but an unnecessary dependency for this scope.
- **Redux Toolkit**: Significant boilerplate overhead; not justified for a single-user personal tool with two state domains.
- **Component-local state only**: Insufficient — auth token and entries list are needed across multiple components.

---

## 5. Build Tooling and Project Bootstrap

**Decision**: Vite with the `react` template.

**Rationale**: Vite is the current standard for new React projects (Create React App is deprecated). It offers fast dev builds and optimised production output. The `react` template (JavaScript, not TypeScript) keeps the setup simple for a personal tool.

**Testing Setup**: Vitest (Vite-native test runner, compatible with Jest API) + React Testing Library. This avoids the jest/babel configuration complexity that arises when using Jest with Vite's ESM-first setup.

**Alternatives Considered**:
- **Create React App**: Deprecated; not recommended for new projects.
- **Next.js**: Server-side rendering not needed; adds complexity without benefit for a static GitHub Pages deployment.
- **Jest + Babel**: Works but requires extra config with Vite; Vitest is the natural choice.
