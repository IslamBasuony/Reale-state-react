# AGENTS.md

Real estate platform: two independent apps in one repo. No root workspace or shared scripts — run each from its own directory.

## Layout
- `backend/` — Express 5, ESM (`"type": "module"`), PostgreSQL, passport/session auth. API lives here.
- `frontend/` — Create React App (react-scripts 5, React 19, JSX sources). UI text and most code comments are Arabic.

## Backend
- Setup: `backend/.env` is gitignored and not committed; create one before running anything. Required: `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` (defaults: `localhost:5432`, `real_estate_db`, `postgres`/`password`) and `SESSION_SECRET_KEY` (express-session throws without it). Config resolved in `src/db/schema.js` per `NODE_ENV`.
- **`npm start` never touches the database** — it only boots the server (`node server.js`). No schema changes, no data reset.
- **`npm run seed` is the explicit reset command** (`node ./src/db/seed.js`): it runs `schema.sql` which DROPs all tables/views/triggers/functions/enums, then recreates and reseeds Arabic + English data. It only runs when invoked directly (seed.js has a run-as-main guard), so importing it is side-effect free. **Never run `npm run seed` against a production database** — it is a destructive dev-only tool. A fresh checkout needs `npm run seed` once before `npm start`.
- Tests: vitest + supertest. They hit a **live Postgres** (real pool, register users, `TRUNCATE clients, sessions`), so a running DB is required. `vitest.config.js` pins `test.env.NODE_ENV=test`, so the suite always connects to the `real_estate_db_test` database and **never touches the dev DB**. `npm test` is watch mode — use `npx vitest run` for one-shot, or `npx vitest run src/__tests__/getRoutes.test.js` for a single file.
- API contract: mounted at `/api/:lang/listings` and `/api/:lang/listings/:id`; `lang` must be `en` or `ar` (anything else → 406). `/api/:lang/users/:id` requires a session cookie. Auth routes at `/auth/register|login|logout` (+ `/auth/forgot-password|reset-password|me`). All responses wrap payloads as `{ success, data }`.
- ESM imports must include the `.js` extension (`import x from "./model.js"`), including in test files. Lint: `npx eslint .` (flat config, no npm script).

## Frontend
- `npm start` runs on port 3000 (CRA default). `npm test` is jest watch mode (react-scripts handles CSS/asset mocks automatically), and `src/setupTests.js` polyfills `ResizeObserver`/`matchMedia`/`scrollTo` for jsdom.
- **Frontend talks to the backend through the CRA proxy.** `frontend/package.json` sets `"proxy": "http://localhost:5000"`, and `src/api/api.js` calls the real routes `/api/:lang/listings` over a relative `/api` base (`DEFAULT_LANG` is `ar` because the UI is fully Arabic; keep exported signatures stable if a language system is added). `src/api/normalize.js` (`normalizeProperty`) unifies the API shape into a defensive frontend shape. Backend defaults to port 5000 (`server.js`) and CORS defaults to `http://localhost:3000` (`app.js`). On fetch failure, components silently fall back to `src/data/fallbackProperty.js` (`PropertyDetails.jsx`) and `src/data/fallbackListings.js` (`Sale.jsx`, `Rent.jsx`, `AreaDetails.jsx`, `SearchResults.jsx`, `Favorites.jsx`, `Compare.jsx`), so the UI renders even with no backend running.
- Frontend auth (`src/utils/auth.js`) delegates to **real backend** `/auth/register|login|logout|me` routes via `src/api/api.js`. Session cookie (`connect.sid`) is the source of truth — no localStorage. `context/AuthContext.js` restores the session on mount via `getCurrentUser()`. Password hashing (bcrypt 10 rounds), session fixation protection (`req.session.regenerate`), httpOnly + sameSite:strict cookies, helmet, CORS — all handled server-side.
- Components live in `src/components/`, pages in `src/pages/`.
