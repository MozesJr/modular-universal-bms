# Modular BMS — Frontend

React + TypeScript + Vite dashboard for the Modular Universal BMS project. Built on top of the
[Dabang](https://github.com/themewagon/dabang) admin template (MUI v5), progressively rewired to
talk to the real backend in [`../backend`](../backend) instead of the template's dummy data.

## Requirements

- **Node 20** — this repo pins it via [`.nvmrc`](.nvmrc). If you use [nvm](https://github.com/nvm-sh/nvm):
  ```bash
  nvm use
  ```
  Building/running under Node 16 (a common system default) fails outright — Vite 5 requires
  Node ^18 or ≥20.
- The backend running and reachable (see [`../backend`](../backend) or the root
  [`docker-compose.yml`](../docker-compose.yml) — `docker compose up mongo mosquitto backend`
  gets you MongoDB, the MQTT broker, and the API on `http://localhost:3000`).

## Setup

```bash
npm install
cp .env.example .env
```

`.env` only needs one variable — see [`.env.example`](.env.example) for what it's for:

```bash
VITE_API_URL=http://localhost:3000/api
```

There's no separate Socket.IO URL to configure: real-time updates share the same HTTP server as
the REST API (see `backend/src/server.js`), so `src/services/socket.ts` derives the socket
endpoint from `VITE_API_URL` by stripping the `/api` suffix.

## Running

```bash
npm run dev
```

Opens on `http://localhost:5173` (Vite's default — deliberately *not* port 3000, since that's
the backend). Sign up for an account from the app itself (`/authentication/sign-up`); there's no
seed user baked into this repo. Admin-only pages (`/admin/*`) require a user with `role: "admin"`
in MongoDB — promote one manually if needed:

```bash
docker exec bms_mongo mongosh --quiet -u <mongo_user> -p <mongo_password> \
  --authenticationDatabase admin <db_name> \
  --eval 'db.users.updateOne({ username: "your_username" }, { $set: { role: "admin" } })'
```

## Other scripts

| Command | What it does |
|---|---|
| `npm run build` | `tsc -b` then `vite build` — type-checks before bundling, output in `dist/` |
| `npm run lint` | ESLint, zero warnings allowed |
| `npm run lint:fix` | Same, with `--fix` |
| `npm run preview` | Serves the last `dist/` build locally |

## Project structure

```
src/
  components/       shared UI: base primitives, common widgets, auth guard
  contexts/         AuthContext (session state, login/register/logout)
  helpers/          small formatting/error-message utilities
  hooks/            data-fetching hooks — one per backend resource, pattern:
                     { data, isLoading, error, refetch }
  layouts/          MainLayout (sidebar+topbar shell) and AuthLayout
  pages/            route-level screens, grouped by resource:
                     admin/  alerts/  authentication/  bms/  dashboard/  packs/
  routes/           paths.ts (path constants), router.tsx, sitemap.ts (sidebar nav)
  services/         one file per backend resource — thin axios/socket.io wrappers,
                     no React in here
  theme/            MUI theme (palette, typography, per-component overrides)
```

**Pattern to follow when adding a new resource:** `services/x.ts` (API calls + types) →
`hooks/useX.ts` (`{ data, isLoading, error, refetch }`) → `pages/.../XList.tsx` (Paper + Table +
loading/error/empty states, matching the existing list pages). Real-time pages
(`hooks/usePackRealtime.ts`, `services/socket.ts`) are the exception — see those two files'
comments before extending them.

## Known gaps

- `backend/src/routes/bmsModels.js`'s CRUD endpoints and the Socket.IO layer were both found
  unauthenticated at different points during this build and have since been fixed
  server-side — see git history on those files if you're auditing the fix.
- `npm audit` currently reports a handful of moderate-severity advisories (`echarts`, `esbuild`
  via `vite`, `react-router`) whose fixes are breaking major-version bumps; left as-is
  pending a dedicated upgrade+regression pass rather than folded into an unrelated change.
