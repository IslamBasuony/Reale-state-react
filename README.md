# Real Estate React

A full-stack real estate listing platform with an Arabic-first frontend, an admin dashboard, and a PostgreSQL-backed REST API. Two independent apps live in one repository — `backend/` (Express API) and `frontend/` (React SPA).

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

## Tech Stack

### Frontend
- **React 19** (Create React App, JSX sources)
- **React Router v6** (client-side routing)
- **Bootstrap 5** + Bootstrap Icons
- **Swiper** (carousels)
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
| `DB_HOST` | Yes | `localhost` | PostgreSQL host |
| `DB_PORT` | Yes | `5432` | PostgreSQL port |
| `DB_NAME` | Yes | `real_estate_db` | Database name |
| `DB_USER` | Yes | `postgres` | Database user |
| `DB_PASSWORD` | Yes | — | Database password |
| `TEST_DB_HOST` | For tests | `localhost` | Test database host |
| `TEST_DB_PORT` | For tests | `5432` | Test database port |
| `TEST_DB_NAME` | For tests | `real_estate_db_test` | Test database name |
| `TEST_DB_USER` | For tests | `postgres` | Test database user |
| `TEST_DB_PASSWORD` | For tests | — | Test database password |
| `SESSION_SECRET_KEY` | Yes | — | Express session secret (server won't start without it) |
| `CLIENT_URL` | Yes | `http://localhost:3000` | Frontend URL for CORS |

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
| `/api/users/:id` | GET | Get user profile (requires session) |
| `/auth/register` | POST | Register new user |
| `/auth/login` | POST | Login |
| `/auth/logout` | POST | Logout |
| `/auth/me` | GET | Current user (requires session) |
| `/api/admin/*` | Various | Admin dashboard endpoints |
| `/api/newsletter/*` | POST | Newsletter subscription |
| `/api/contact/*` | POST | Contact form submission |
| `/api/projects/:id/inquiries` | POST | Project inquiry |

## Testing

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

The production bundle is emitted to `frontend/build/` (gitignored). Serve it with any static host or CDN.

### Backend

```bash
cd backend
# Ensure NODE_ENV=production and all required env vars are set
npm start
```

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

## Notes

- UI text and most code comments are in **Arabic**
- The frontend falls back to local `src/data/` files when the backend is unavailable
- `npm start` (backend) never touches the database — only `npm run seed` does
- Sessions are stored server-side in PostgreSQL (`sessions` table)
- Password hashing uses bcrypt with 10 rounds
- httpOnly + sameSite:strict cookies for session security

## License

ISC