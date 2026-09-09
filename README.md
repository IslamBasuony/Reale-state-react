# AqarWeb — Full-Stack Real Estate Platform

> Repository: [`Reale-state-react`](https://github.com/IslamBasuony/Reale-state-react)

## Overview

AqarWeb is a full-stack real estate platform with an Arabic-first frontend, an admin dashboard, and a PostgreSQL-backed REST API. Two apps live in one repository — `backend/` (Express API) and `frontend/` (React SPA).

## Live Demo

Production deployment is configured for [Render](https://render.com) via `render.yaml` (target URL: `https://reale-state.onrender.com`). The service must be provisioned with an external Supabase PostgreSQL database before the app is publicly available. See [Deployment & Production](#deployment--production) for setup steps.

## Screenshots

No README screenshots are checked in yet. Recommended captures for portfolio presentation:

1. Homepage (Arabic / English)
2. Property listing with filters
3. Property details page
4. Login / registration
5. Admin dashboard
6. Mobile responsive layout

## Features

- Bilingual property listings (`ar` / `en`) served through a single API
- Sale / Rent pages with purpose and location filtering
- Property details, areas, projects, news, and agents pages
- Client registration, login, logout, and profile
- Password reset with secure token flow
- Favorites with per-user scoped localStorage
- Property comparison page
- Admin dashboard with:
  - Property, agent, client, contact, inquiry, and subscriber management
  - Audit logs
  - Reports and charts (bar, donut, line)
- SEO support via `react-helmet-async` and JSON-LD
- Server-side sessions (PostgreSQL-backed) with httpOnly + sameSite:strict cookies

## Architecture

```
Browser ──▶ React SPA (frontend/)     ── fetch (credentials) ──▶ Express API (backend/)
                                                                      │
                                                                      ├── Passport + express-session
                                                                      ├── REST routes (/api/*, /auth/*)
                                                                      └── PostgreSQL (pg pool, schema + migrations)
```

In production, Express serves the built React app from `frontend/build/` on the same HTTPS origin as the API so session cookies remain same-site.

## Tech Stack

### Frontend
- **React 19** (Create React App, JSX sources)
- **React Router v6** (client-side routing)
- **Bootstrap 5** + Bootstrap Icons
- **Font Awesome 7**
- **react-helmet-async** (SEO)

### Backend
- **Express 5** (ESM, `"type": "module"`)
- **Passport.js** (local strategy) + **express-session** with `connect-pg-simple`
- **bcrypt** (password hashing, 10 rounds)
- **Helmet** (security headers)
- **Multer** (file uploads)
- **express-validator** (input validation)

### PostgreSQL
- Database layer through `pg` connection pool
- ENUM types for status, purpose, currency, price period, property type, and viewing status
- Views (`vw_properties_full`, `vw_agent_performance`)
- `updated_at` triggers, performance indexes, and incremental migrations

### Testing
- **Backend:** Vitest + Supertest (hits a live PostgreSQL test DB)
- **Frontend:** Jest + React Testing Library (jsdom)

## Authentication

- Backend: session-based auth handled by the real API at `/auth/register`, `/auth/login`, `/auth/logout`, and `/auth/me`
- Passport local strategy authenticates by email; bcrypt hashes passwords (10 rounds)
- Sessions are stored server-side in the `sessions` table via `connect-pg-simple`
- Session fixation protection via `req.session.regenerate`
- Session cookie is httpOnly with `sameSite: strict`
- Frontend delegates auth to the backend; the session cookie (`connect.sid`) is the source of truth — no credentials in localStorage
- `AuthContext` restores the session on mount via `getCurrentUser()`

## Project Structure

```
reale-state/
├── backend/                   # Express API server
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   ├── models/            # Database queries
│   │   ├── routes/            # Express routers
│   │   ├── middlewares/       # Auth, validation, error handling
│   │   ├── db/
│   │   │   ├── schema.sql     # Full DB schema (DDL)
│   │   │   ├── seed.js        # Destructive dev-only seeder
│   │   │   ├── schema.js      # Schema creation/validation
│   │   │   ├── pool.js        # PostgreSQL connection pool
│   │   │   ├── migrations/    # Incremental migrations
│   │   │   ├── ArabicSeeds/   # Arabic seed data (JSON)
│   │   │   └── EnglishSeeds/  # English seed data (JSON)
│   │   ├── scripts/           # Utility scripts
│   │   ├── utils/             # Shared helpers
│   │   └── __tests__/         # API tests (vitest)
│   ├── app.js                 # Express app setup
│   ├── server.js              # Server bootstrap
│   ├── eslint.config.js       # ESLint flat config
│   └── vitest.config.js       # Vitest configuration
├── frontend/                  # React SPA
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── pages/             # Route-level components
│   │   ├── components/        # Shared UI components
│   │   ├── admin/             # Admin dashboard (pages, components, styles)
│   │   ├── context/           # React contexts (Auth, Favorites, Listings)
│   │   ├── api/               # API client + normalization
│   │   ├── data/              # Fallback/static data
│   │   ├── utils/             # Auth helpers, formatters
│   │   ├── styles/            # Global CSS
│   │   └── __tests__/         # Frontend tests (jest)
│   └── package.json
├── .env.example               # Required environment variables
├── .gitignore                 # Git ignore rules
└── README.md
```

## Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **npm**

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd reale-state
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env` from the example:

```bash
cp ../.env.example .env
```

Edit `backend/.env` with your actual database credentials and session secret.

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Prod | `development` | `production` in deployed environments (enables Secure cookies, proxies, static SPA serving) |
| `PORT` | No | `5000` | HTTP port for the Express server (the host sets this via its platform env) |
| `DB_HOST` | Yes* | `localhost` | PostgreSQL host |
| `DB_PORT` | Yes* | `5432` | PostgreSQL port |
| `DB_NAME` | Yes* | `real_estate_db` | Database name |
| `DB_USER` | Yes* | `postgres` | Database user |
| `DB_PASSWORD` | Yes* | `password` (dev) | Database password |
| `TEST_DB_HOST` | For tests | `localhost` | Test database host |
| `TEST_DB_PORT` | For tests | `5432` | Test database port |
| `TEST_DB_NAME` | For tests | `real_estate_db_test` | Test database name |
| `TEST_DB_USER` | For tests | `postgres` | Test database user |
| `TEST_DB_PASSWORD` | For tests | — | Test database password |
| `SESSION_SECRET_KEY` | Yes | — | Express session secret (server won't start without it) |
| `CLIENT_URL` | Yes* | `http://localhost:3000` | Allowed credentialed CORS origin — must be the public HTTPS app URL in production |

\* Dev defaults are provided for `DB_*` only when `NODE_ENV` is not `production` — always set real credentials explicitly in production. `CLIENT_URL` has no production default.

## Database Setup

### Create the database

```sql
CREATE DATABASE real_estate_db;
CREATE DATABASE real_estate_db_test;
```

### Apply the schema

The development and production schemas are defined in `backend/src/db/schema.sql`. Existing installations can apply incremental changes with the SQL files in `backend/src/db/migrations/`.

### Seed (development only)

```bash
cd backend
npm run seed
```

> **Warning:** `npm run seed` is **destructive** — it drops and recreates all tables, then re-seeds with Arabic and English sample data. Never run this against a production database.

> **Note:** seed files contain plaintext development-only credentials (admin and demo user passwords). These are sample data for local development; change them before any real deployment.

## Development

### Backend (port 5000)

```bash
cd backend
npm start
```

`npm start` only boots the server — it never touches the database. Run `npm run seed` first on a fresh checkout.

### Frontend (port 3000)

```bash
cd frontend
npm start
```

The frontend proxies API requests to the backend via CRA's `proxy` setting (`http://localhost:5000`). On fetch failure, components fall back to local `src/data/` files so the UI renders even without a running backend.

## API

All API responses are wrapped as `{ success: boolean, data: any }`.

| Route | Method | Description |
|-------|--------|-------------|
| `/api/:lang/listings` | GET | List properties (`lang` = `en` or `ar`) |
| `/api/:lang/listings/:id` | GET | Get property details |
| `/api/:lang/brokers` | GET | List agents |
| `/api/:lang/users/:id` | GET | Get user profile (requires session) |
| `/api/:lang/newsletter` | POST | Newsletter subscription |
| `/api/:lang/contact` | POST | Contact form submission |
| `/api/:lang/inquiries` | POST | Project inquiry |
| `/auth/register` | POST | Register new user |
| `/auth/login` | POST | Login |
| `/auth/logout` | POST | Logout |
| `/auth/me` | GET | Current user (requires session) |
| `/auth/forgot-password` | POST | Request a password reset |
| `/auth/reset-password` | POST | Reset password with token |
| `/api/admin/*` | Various | Admin dashboard endpoints |

## Testing

The repository includes automated tests on both sides:

| Layer | Runner | Test files | Test cases (static count) |
|-------|--------|------------|---------------------------|
| Backend | Vitest + Supertest | 8 | 110 |
| Frontend | Jest + React Testing Library | 9 | 87 |

Re-run the counts after adding tests: `rg "^\s*(it|test)\(" backend/src/__tests__ frontend/src/__tests__ frontend/src/App.test.js`.

### Backend tests (requires running PostgreSQL)

```bash
cd backend
# Watch mode
npm test
# Single run
npx vitest run
# Single file
npx vitest run src/__tests__/getRoutes.test.js
```

Tests use the `real_estate_db_test` database — never the development database.

### Frontend tests

```bash
cd frontend
# Watch mode
npm test
# Single run
CI=true npm test
```

## Production Build

### Frontend

```bash
cd frontend
npm run build
```

The production bundle is emitted to `frontend/build/` (gitignored). In production, Express serves this build directly (same-origin), so no additional static host is required.

### Backend

```bash
cd backend
# Ensure NODE_ENV=production and all required env vars are set
npm start
```

## Deployment & Production

### Architecture

```
Browser ──HTTPS──▶ Express (Node)  ──pg──▶ Managed PostgreSQL
                    │
                    ├── /api/*, /auth/*, /uploads/*   (REST + sessions)
                    ├── /health                        (liveness probe)
                    └── frontend/build/*               (built React SPA)
```

One Node/Express instance serves both the API and the built React SPA on a single HTTPS origin. This is intentional: `express-session` cookies use `SameSite=strict` + `Secure`, which requires the frontend and API to share an origin (no reverse proxy, no serverless, no Redis needed).

### Recommended hosts

- **App (Node/Express + SPA):** one persistent web service (Render Web Service `reale-state` via `render.yaml`). Not serverless, because the backend uses long-lived sessions and disk uploads. The Blueprint creates **only** the web service — it does not create a database.
- **Database:** external **Supabase free PostgreSQL**. Copy the five values from Supabase → Project Settings → Database → Connection string into `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`. The production DB config enables SSL automatically (`rejectUnauthorized: false`), which satisfies Supabase's SSL requirement. There is **no `DATABASE_URL` support** — use the five `DB_*` variables. After applying `render.yaml`, fill these keys (declared with `sync: false`) in the service's Environment tab on Render.

### Required production environment variables

| Variable | Purpose |
|----------|---------|
| `NODE_ENV=production` | Secure cookies, trust-proxy, static SPA serving |
| `PORT` | Set by the platform (Render injects it) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Supabase PostgreSQL credentials (from Supabase dashboard → Connection string) |
| `SESSION_SECRET_KEY` | Session signing secret (server refuses to start without it) |
| `CLIENT_URL` | The app's public HTTPS origin — used for credentialed CORS |

No frontend build variable is required for the same-origin deployment (`/api` and `/auth` are relative). If you intentionally split the frontend to another origin, build it with `REACT_APP_API_BASE_URL=https://<api-host>/api` and set `CLIENT_URL` to the frontend origin.

### Provisioning the database (safe)

Run it against your Supabase database. **`NODE_ENV=production` is required** so the SSL-enabled production connection config is used (the Supabase host needs SSL):

```bash
cd backend
NODE_ENV=production DB_HOST=db.<project>.supabase.co DB_PORT=5432 \
DB_NAME=postgres DB_USER=postgres DB_PASSWORD=<password> npm run seed:demo
```

On Render this runs automatically via the `postDeploy` hook (`npm run seed:demo`) after each deploy, with the production app environment already set.

`seed:demo` is **non-destructive**: it applies `schema.sql` only if the database is empty, applies the idempotent migrations, validates all 16 tables, and seeds the Arabic/English demo data only if no properties exist yet. It never drops existing data and can be run repeatedly.

> **Warning:** never run `npm run seed` against production — it drops and recreates every table.

### HR Demo Accounts

These are the intentionally non-sensitive demo credentials seeded by `npm run seed:demo`:

| Role | Email | Password |
|------|-------|----------|
| Admin (HR demo) | `admin@aqarweb.com` | `Admin@12345` |
| Regular user (HR demo) | `ahmed.alkhatib@email.com` | `0923lkldspp3$%#39;ld0-2` |

All other seeded clients/agents share the same dev-only password. No real credentials are used anywhere in the seed data.

### Uploads storage limitation

Administrator-uploaded property images (Multer) write to the server's local `uploads/` directory. On free tiers this filesystem can be ephemeral (files may disappear on redeploy/restart). **Seeded demo images are not affected** — they are absolute external URLs (Cloudinary) and keep working regardless of storage. For durable admin uploads, use a paid plan with a persistent disk or back uploads with object storage.

### Health check

`GET /health` returns `200 {"success":true,"status":"ok"}` without exposing any internals.

## Linting

```bash
cd backend
npx eslint .
```

## Admin System

The platform includes a full admin dashboard with:
- Property management (CRUD)
- Agent management
- Client management
- Contact & inquiry management
- Newsletter subscribers
- Audit logs
- Dashboard with charts (bar, donut, line)
- Reports

## Security

- **Helmet** security headers on the Express app
- **bcrypt** password hashing (10 rounds)
- **express-validator** input validation on API routes
- **Session fixation protection** via `req.session.regenerate` on login
- **httpOnly** session cookies with `sameSite: strict` (and `secure` in production)
- Server-side sessions stored in PostgreSQL (`sessions` table via `connect-pg-simple`)
- No credentials stored in `localStorage`; the session cookie is the source of truth
- `.env.example` documents required variables; secrets are never committed

## Future Improvements

- Add README screenshots for key UI flows
- Persistent object storage for admin-uploaded property images (local disk is ephemeral on free hosting tiers)
- GitHub Actions CI with PostgreSQL service for backend integration tests

## Notes

- UI text and most code comments are in **Arabic**
- The frontend falls back to local `src/data/` files when the backend is unavailable
- `npm start` (backend) never touches the database — only `npm run seed` does
- Sessions are stored server-side in PostgreSQL (`sessions` table)
- Password hashing uses bcrypt with 10 rounds
- httpOnly + sameSite:strict cookies for session security

## License

ISC