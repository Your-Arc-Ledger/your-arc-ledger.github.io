# Quickstart: Achievement & Setback Tracker

**Date**: 2026-05-23 | **Plan**: [plan.md](plan.md)

## Prerequisites

- Node.js 20+ and npm
- A Google account
- A Google Cloud project with the Google Sheets API enabled
- A GitHub repository with GitHub Pages enabled

## 1. Bootstrap the Project

```sh
npm create vite@latest achievement-diary -- --template react
cd achievement-diary
npm install
```

## 2. Install Testing Dependencies

```sh
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Add to `vite.config.js`:
```js
test: {
  environment: 'jsdom',
  setupFiles: './src/test-setup.js',
}
```

## 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID — Application type: **Web application**
3. Add Authorised JavaScript Origins: `http://localhost:5173` (dev) and your GitHub Pages URL (e.g., `https://username.github.io`)
4. Copy the Client ID into a `.env` file:

```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

> The Client ID is not a secret — it is safe to commit in `.env.example` but keep the actual `.env` out of git.

## 4. First-Time Setup: Google Sheet

The app manages your spreadsheet for you — no manual sheet creation needed.

- **First-time users**: After connecting your Google account (step 5), click the **"Create new spreadsheet"** button in the app. The app creates a `Entries` sheet in your Drive automatically and stores the spreadsheet ID in your browser's local storage.
- **Returning users**: After connecting, enter your existing spreadsheet URL in the app. The URL format is:
  `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

## 5. Run Locally

```sh
npm run dev
# Open http://localhost:5173
```

On first load, the app prompts you to connect your Google account. After authorising, first-time users see a **"Create new spreadsheet"** button; returning users can enter their spreadsheet URL to reconnect.

## 6. Run Tests

```sh
npm test
```

Tests run in watch mode by default. For CI:

```sh
npm run test -- --run
```

## 7. Deploy to GitHub Pages

Install the deploy helper:

```sh
npm install --save-dev gh-pages
```

Add to `package.json`:

```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

Set the `base` in `vite.config.js` to your repo name:

```js
base: '/achievement-diary/',
```

Deploy:

```sh
npm run deploy
```

GitHub Pages will serve your app from `https://username.github.io/achievement-diary/`.

## 8. Automated Deployment (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
        env:
          VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Add `VITE_GOOGLE_CLIENT_ID` as a repository secret in GitHub Settings → Secrets. The spreadsheet ID is entered by the user at runtime — it is not a build-time secret.
