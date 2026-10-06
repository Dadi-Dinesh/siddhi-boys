# Batch Fund

A small private app for managing our batch's monthly ₹100 fund.

## First-time setup

```bash
# 1. Environment configuration (only 1 .env file needed at the root)
cp .env.example .env            # set DATABASE_URL (Neon PostgreSQL), JWT_SECRET, etc.

# 2. Backend (http://localhost:5001)
cd backend
npm install
npm run db:deploy               # sync database schema
npm run db:seed                 # sample admin, members, contributions, expenses
npm run dev

# 3. Frontend (http://localhost:5173), in a second terminal
cd client
npm install
npm run dev
```

## Useful backend commands

| Command | What it does |
| --- | --- |
| `npm run db:migrate` | Apply schema changes (creates a new migration) |
| `npm run db:seed` | Add sample data (safe to run again) |
| `npm run db:reset` | ⚠️ Wipe the database and re-run all migrations |
| `npm run db:studio` | Browse the database in your browser |

## Development logins

⚠️ **Development only. Change these before real use.**

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@batchfund.local | ChangeMe123! |
| Members | rahul@ / arjun@ / sai@ / kiran@ / vamsi@batchfund.local | Member123! |

> The API runs on port 5001 because macOS reserves 5000 for AirPlay Receiver.

## API overview

All responses look like `{ success, message, data }`. Send the login token as `Authorization: Bearer <token>`.

| Method | Path | Who |
| --- | --- | --- |
| POST | `/api/auth/login` | Anyone |
| GET | `/api/auth/me` | Logged in |
| GET / POST | `/api/members` (`?search=`, `?includeInactive=true`) | Admin |
| GET / PUT / DELETE | `/api/members/:id` (DELETE = deactivate) | Admin |
| PATCH | `/api/members/:id/activate` | Admin |
| POST | `/api/contributions/create-month` `{ month, year }` | Admin |
| GET | `/api/contributions/month/:year/:month` (`?search=`) | Admin |
| PATCH | `/api/contributions/:id/pay` · `/api/contributions/:id/unpay` | Admin |
| GET | `/api/contributions/history` (`?year=&month=&memberId=&status=`) | Admin |
| GET | `/api/contributions/my-history` · `/api/contributions/my-summary` | Logged in (own data) |
| GET / POST | `/api/expenses` | Admin |
| GET / PUT / DELETE | `/api/expenses/:id` | Admin |
| GET | `/api/dashboard/summary` · `/api/dashboard/monthly-summary` | Admin |
| GET | `/api/transactions` (`?year=&month=&type=&memberId=`) | Admin |
| GET / PATCH | `/api/settings` | Admin |
| GET | `/api/group/summary` | Logged in |

## Running in production

Set these on the server (never commit them):

| Variable | Where | Notes |
| --- | --- | --- |
| `DATABASE_URL` | backend | PostgreSQL connection string |
| `JWT_SECRET` | backend | Random, at least 32 characters. The API refuses to start with a short or example value. |
| `CLIENT_URL` | backend | The frontend's address (CORS). Required when `NODE_ENV=production`. |
| `NODE_ENV=production` | backend | Shorter error logs; blocks the dev seed script |
| `TRUST_PROXY=1` | backend | When running behind a proxy/load balancer, so login rate limiting sees real IPs |
| `VITE_API_URL` | frontend (build time) | The API's address. Public: never put secrets in `VITE_` variables. |

```bash
# backend
npm ci && npm run build && npm run db:deploy && npm start   # build = prisma generate, db:deploy = prisma migrate deploy
# frontend
npm ci && npm run build                                     # serve the client/dist folder
```

**Suggested hosting (manual):**

| Part | Service | Settings |
| --- | --- | --- |
| Database | Neon (PostgreSQL) | Copy the connection string (keep `?sslmode=require`) into the backend's `DATABASE_URL` |
| Backend | Render (Web Service) | Root directory `backend` · Build `npm ci && npm run build && npm run db:deploy` · Start `npm start` · Health check `/api/health` · Env: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`, `TRUST_PROXY=1` |
| Frontend | Vercel | Root directory `client` · Framework Vite · Env `VITE_API_URL=https://<your-backend>/api` (`client/vercel.json` makes page refreshes on `/admin/...` work) |

Node.js 20.19 or newer is required (see `engines` in both `package.json` files).

Create the real admin account yourself; **do not run `npm run db:seed` in production** (it creates the
development logins above, and refuses to run when `NODE_ENV=production`).

### Security notes
- Passwords are hashed with bcrypt (8–72 characters); hashes are never returned by the API.
- Every admin endpoint checks the role on the server; "my" endpoints use the logged-in user only.
- Login is rate limited: 10 failed attempts per IP per 15 minutes (`LOGIN_RATE_LIMIT_MAX`).
- Security headers via helmet; request bodies limited to 10 KB; CORS limited to `CLIENT_URL`.
- The login token is kept in `localStorage` (simple, but readable by any script running on the
  page — so never add untrusted third-party scripts to the frontend).
