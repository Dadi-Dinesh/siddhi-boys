# SiddhiBoys

A small private app for managing the SiddhiBoys group fund: members, monthly contributions,
payment verification, expenses, borrowed money and reports.

## First-time setup

```bash
# 1. Environment configuration (one .env file at the project root)
cp .env.example .env            # fill in DATABASE_URL, JWT_SECRET, CLOUDINARY_*, ADMIN_EMAIL, ADMIN_PASSWORD

# 2. Backend (http://localhost:5001)
cd backend
npm install
npm run db:deploy               # apply database migrations
npm run db:init                 # create the admin account (safe, never deletes anything)
npm run dev

# 3. Frontend (http://localhost:5173), in a second terminal
cd client
npm install
npm run dev
```

> The API runs on port 5001 because macOS reserves 5000 for AirPlay Receiver.

## Useful backend commands

| Command | What it does |
| --- | --- |
| `npm run db:deploy` | Apply pending migrations (safe for production) |
| `npm run db:status` | Show which migrations are applied |
| `npm run db:migrate` | Development only: create a new migration after editing `schema.prisma` |
| `npm run db:init` | Create the group settings and the admin account if missing. Never deletes data. |
| `npm run db:reset-data -- --yes` | ⚠️ Delete **all** data (keeps tables), then create only the admin account |
| `npm run db:studio` | Browse the database in your browser |

Nothing destructive runs automatically: the server never migrates or resets the database on start.

## Accounts

- **Admin**: created by `npm run db:init` from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.
- **Members**: added by the admin on the Members page. Members log in with their email.
  Their default password is the part of the email before `@` followed by `@123`
  (e.g. `rahul@gmail.com` → `rahul@123`). The admin can set a different password by editing the member.

## Money rules

- **Total collected** = accepted (PAID) contributions, base amount + late fines. Pending, declined and
  unpaid contributions never count.
- **Borrowed** money is not an expense. While a record is *Borrowed* it is unavailable; once marked
  *Returned* it is back in the fund.
- **Available balance** = total collected − total expenses − currently borrowed.

All totals are calculated by the backend from the records every time they are requested.

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
| GET | `/api/contributions/month/:year/:month` (`?search=`) | Logged in |
| PATCH | `/api/contributions/:id/pay` (with screenshot) · `/api/contributions/:id/unpay` | Admin |
| GET | `/api/contributions/my-history` · `/api/contributions/my-summary` | Logged in (own data) |
| POST | `/api/payment-verifications` (screenshot + payment date) | Logged in (own contribution) |
| GET | `/api/payment-verifications/:id/screenshot` | Logged in |
| GET | `/api/admin/payment-verifications` (`?status=`) | Admin |
| PATCH | `/api/admin/payment-verifications/:id/accept` · `/decline` | Admin |
| GET | `/api/expenses` · `/api/expenses/:id` | Logged in |
| POST / PUT / DELETE | `/api/expenses` · `/api/expenses/:id` | Admin |
| GET | `/api/borrowed` · `/api/borrowed/:id` | Logged in |
| POST | `/api/borrowed` `{ memberId, amount, borrowedAt, purpose }` | Admin |
| PATCH | `/api/borrowed/:id/return` `{ returnedAt }` | Admin |
| DELETE | `/api/borrowed/:id` | Admin |
| GET | `/api/dashboard/summary` · `/api/dashboard/monthly-summary` | Admin |
| GET | `/api/transactions` (`?year=&month=&type=&memberId=`) | Logged in |
| GET | `/api/reports/summary` (`?months=3\|6\|12\|all`) | Admin |
| GET / PATCH | `/api/settings` | Admin |
| GET | `/api/group/summary` | Logged in |

## Running in production

Set these on the server (never commit them):

| Variable | Where | Notes |
| --- | --- | --- |
| `DATABASE_URL` | backend | PostgreSQL connection string |
| `JWT_SECRET` | backend | Random, at least 32 characters. The API refuses to start with a short or example value. |
| `CLIENT_URL` | backend | The frontend's address (CORS), e.g. `https://siddhiboys.vercel.app`. Comma-separate several. Required in production. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | backend | Payment screenshot storage. Required in production. Never put these in the frontend. |
| `NODE_ENV=production` | backend | Shorter error logs, required settings enforced |
| `TRUST_PROXY=1` | backend | When running behind a proxy/load balancer, so login rate limiting sees real IPs |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | backend | Only needed when running `npm run db:init` |
| `VITE_API_URL` | frontend (build time) | The API's address ending in `/api`. Public: never put secrets in `VITE_` variables. |

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
| Backend | Render (Web Service) | Root directory `backend` · Build `npm ci && npm run build && npm run db:deploy` · Start `npm start` · Health check `/api/health` · Env: see the table above |
| Frontend | Vercel | Root directory `client` · Framework Vite · Env `VITE_API_URL=https://<your-backend>/api` (`client/vercel.json` makes page refreshes on `/admin/...` work) |

Node.js 20.19 or newer is required (see `engines` in both `package.json` files).

### Security notes
- Passwords are hashed with bcrypt; hashes are never returned by the API.
- Every admin endpoint checks the role on the server; "my" endpoints use the logged-in user only.
- Payment screenshots are stored on Cloudinary as authenticated (non-public) images and are only
  served through the API to logged-in users.
- Login is rate limited: 10 failed attempts per IP per 15 minutes (`LOGIN_RATE_LIMIT_MAX`).
- Security headers via helmet; request bodies limited to 10 KB; CORS limited to `CLIENT_URL` in production.
- The login token is kept in `localStorage` (simple, but readable by any script running on the
  page — so never add untrusted third-party scripts to the frontend).
