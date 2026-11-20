# Momento

A memory box for the little things you keep. Scan a birthday card, a ticket, a pressed
flower or an old photo, front and back, and keep it safe even if the original is lost.

**Live site:** https://nikitapxtel.github.io/momento/

## What it does

- **Your box**: a 3D carousel of your memories. The one in front faces you; click it to open
  it in place and swipe sideways through its sides (a card opens to show the message inside).
- **Scan or upload** each side of a memory with your phone camera or a photo. Photos are
  cleaned on your device first: location and camera details are removed.
- **Privacy you control**: profiles are private by default, and every memory is hidden by
  default. Someone else can see a memory only if your profile is public _and_ you've chosen
  to show that memory.
- **Explore** other people's public boxes.
- **Weather sky**: the background follows the weather for your time zone's city, with no
  location prompt. Click the weather to use your exact location instead (rounded to about
  11 km, never stored). Light and dark themes.

## Tech

| Part          | Choice                                                   |
| ------------- | -------------------------------------------------------- |
| App           | React 19 + TypeScript (strict) + Vite                    |
| Backend       | Supabase: auth (email magic link), Postgres, storage     |
| Security      | Row Level Security on every table and the storage bucket |
| Hosting       | GitHub Pages, deployed by GitHub Actions                 |
| Tests         | Vitest + Testing Library, Playwright, SQL privacy tests  |
| Quality gates | oxlint, Prettier, `tsc`, `npm audit`, CodeQL, Dependabot |

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: add your Supabase URL and publishable key
npm run dev
```

Without Supabase settings the app runs in **demo mode** with a sample box, so you can work on
the design without a backend.

## Scripts

| Command                    | What it does                                          |
| -------------------------- | ----------------------------------------------------- |
| `npm run dev`              | Local dev server with instant reload                  |
| `npm run check`            | Lint, format check, type check and unit tests         |
| `npm run test:e2e`         | Browser tests (desktop + mobile) against a real build |
| `scripts/test-db-local.sh` | Database privacy tests against a local Postgres       |
| `npm run build`            | Production build into `dist/`                         |

## Project layout

```
src/
  app/          app-wide state: theme, auth, weather
  components/   Carousel, 3D MemoryObject, OpenView, Header, Sky
  pages/        MyBox, Explore, PublicBox, AddMemory, Settings, SignIn
  lib/          pure logic + data access (each with *.test.ts beside it)
supabase/
  migrations/   schema, Row Level Security and storage rules
  tests/        SQL tests proving who can see what
tests/e2e/      Playwright browser tests
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for coding conventions,
[SECURITY.md](SECURITY.md) for the security model, and
[supabase/SETUP.md](supabase/SETUP.md) to connect a Supabase project.
