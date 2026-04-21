# TripBites Frontend

TripBites is a Next.js (App Router) frontend for a travel intelligence app. Users ask about a city and receive a concise briefing grounded in live weather, recent local headlines, and risk/disruption context from a backend service.

## Local setup

Prereqs:
- Node.js 20+
- npm (lockfile-driven installs via `npm ci`)

Steps:
1. Install dependencies: `npm ci`
2. Create local env file: copy `.env.example` to `.env.local` and fill in real values
3. Start dev server: `npm run dev`
4. Open `http://localhost:3000`

## Auth model (how requests are authenticated)

The browser never calls third-party services directly.

Instead it calls Next.js API routes in this frontend:
- `POST /api/chat`
- `GET /api/weather?place=...`
- `GET /api/news?place=...`

Those API routes run server-side and forward requests to the backend with:
- `x-api-key: EXTERNAL_API_KEY`

Chat also uses a backend session:
- `POST /api/chat` creates/refreshes a backend session and stores it in HttpOnly cookies: `tb_sid`, `tb_stk`
- Those cookies are then sent by the browser on subsequent chat requests

## Environment variables

All required variables are server-side only (used by `app/api/*`).

- `BACKEND_URL` (example: `http://localhost:8000`)
- `EXTERNAL_API_KEY` (backend API key used in `x-api-key` header)
- `BACKEND_TIMEOUT_MS` (request timeout in milliseconds, default `15000`)

See `.env.example` for the full list.

## Project structure

- `app/` — routes, layout, page entry, API proxy routes
- `components/` — UI components (chat, message bubbles, quick cards)
- `lib/` — client request helpers and typed errors
- `public/` — static assets (logo, SVGs)

## Scripts

- `npm run dev` — local dev server
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript typecheck
- `npm run build` — production build
- `npm run start` — run production server

## Deployment

### Vercel (recommended)

Set the same environment variables from `.env.example` in your Vercel project settings, then deploy.

### Docker

Build:
- `docker build -t tripbites-frontend .`

Run (example):
- `docker run --rm -p 3000:3000 --env-file .env.local tripbites-frontend`

## Screenshots

### Main Interface

![TripBites Main](https://raw.githubusercontent.com/rnx2024/tripbites/main/public/tripbites-main.png)

### Chat Interface

<table>
  <tr>
    <td align="center" width="50%">
      <img src="https://raw.githubusercontent.com/rnx2024/tripbites/main/public/chatbox.png" alt="TripBites Chat" width="100%" />
      <br />
      <strong>Chat Interface</strong>
    </td>
    <td align="center" width="50%">
      <img src="https://raw.githubusercontent.com/rnx2024/tripbites/main/public/disruption-analysis.png" alt="TripBites Analysis" width="100%" />
      <br />
      <strong>Disruption Analysis</strong>
    </td>
  </tr>
</table>


## Releases (automated)

This repo uses Release Please.

- Use Conventional Commits (e.g. `feat: ...`, `fix: ...`)
- On pushes to `main`, Release Please opens a release PR that updates `CHANGELOG.md` and version metadata
- Merging the release PR creates a `vX.Y.Z` tag and GitHub Release
