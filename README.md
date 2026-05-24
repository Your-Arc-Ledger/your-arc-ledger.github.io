# Arc

A personal achievement and setback tracker. Logs entries to a Google Sheet in your own Google Drive — no backend, fully static.

## Prerequisites

- Node.js 22+
- A Google account
- Two Google Cloud credentials — see [Google Cloud Setup](docs/google-cloud-setup.md)

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure credentials

Copy `.env.example` to `.env` and fill in both values:

```env
VITE_GOOGLE_CLIENT_ID=<your-oauth-client-id>.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=<your-api-key>
```

See [docs/google-cloud-setup.md](docs/google-cloud-setup.md) for how to obtain these.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). On first run you will be prompted to sign in with Google and either create a new spreadsheet or pick an existing one from your Drive.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build (output in `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once (CI) |

## Deployment

The app deploys to GitHub Pages via GitHub Actions on every push to `main`.

Before the first deploy:

1. Add `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_API_KEY` as repository secrets (Settings → Secrets and variables → Actions → Secrets)
2. Add your Pages URL (e.g. `https://<username>.github.io`) to the **Authorised JavaScript origins** of your OAuth client in Google Cloud Console
3. Add the same origin to the HTTP referrer restrictions on your API key

Subsequent deploys are automatic on push.
