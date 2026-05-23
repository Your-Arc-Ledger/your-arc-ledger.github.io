# Arc

A personal achievement and setback tracker. Logs entries to a Google Sheet in your own Google Drive — no backend, fully static.

## Prerequisites

- Node.js 18+
- A Google account
- A Google Cloud project with the Sheets API enabled and an OAuth 2.0 client ID configured

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Google OAuth

Create a `.env.local` file in the project root:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_SPREADSHEET_ID=your-google-sheet-id
```

- **Client ID**: from Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID (Web application type). Add `http://localhost:5173` to the Authorised JavaScript origins.
- **Spreadsheet ID**: the ID from the URL of your Google Sheet (`https://docs.google.com/spreadsheets/d/<ID>/edit`). The sheet will be initialised with the correct columns on first run.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build (output in `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run deploy` | Build and deploy to GitHub Pages |

## Deployment

The app is deployed to GitHub Pages. Ensure the OAuth client ID's Authorised JavaScript origins includes your Pages URL before deploying.

```bash
npm run deploy
```
