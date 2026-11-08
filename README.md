# Texan Website Checker

Full-stack SaaS for auditing websites: SEO, performance, security headers, SSL/TLS, accessibility, links & content, mobile/technical and email/DNS. It has a user workspace and an admin console at `/dashboard/admin`.

```text
website-checker/
├── frontend/   Next.js 16 (App Router) · TypeScript · Tailwind v4 · Redux Toolkit + RTK Query · RHF + Zod
├── backend/    Express 5 · TypeScript (ESM) · Prisma 6 + MongoDB · Better Auth · Zod
└── docker-compose.yml   Local MongoDB replica set
```

## Quick start

Requirements: Node 20.19+ and Docker (or any MongoDB **replica set**, since Prisma needs one for MongoDB).

```bash
# 1. Database
docker compose up -d

# 2. Backend  (http://localhost:5000)
cd backend
cp .env.example .env          # then set BETTER_AUTH_SECRET (32+ chars) and ADMIN_* values
npm install
npm run prisma:push           # create collections and indexes
npm run seed                  # plans, checker catalog, admin user
npm run dev

# 3. Frontend (http://localhost:3000)
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` to reach the admin console, or register a normal user.

### Branding

The logo is at `frontend/public/logo.svg` and is used by the `Logo` component, the report header and the favicon. To use the official Texan logo, replace that file and keep the file name. If the logo is a PNG, also update the `src` in `components/layout/Logo.tsx` and `features/reports/ReportDocument.tsx`. The brand colours are tokens in `frontend/src/app/globals.css`: `brand` #FFCC00, `ink` #000000 and `surface` #FFFFFF.

## Architecture

### Auth and sessions
- Better Auth runs on the backend at `/api/auth/*`. It handles email + password sign-in, password reset and sessions. The admin plugin adds roles and bans.
- The frontend calls `/api/*`, and Next.js **rewrites** those requests to the backend (`API_URL`). The session cookie is therefore first-party, `httpOnly`, `SameSite=Lax`, and `Secure` in production.
- `src/proxy.ts` makes an optimistic cookie check and redirects to `/login`. `DashboardShell` then validates the session through the API, and `AdminGuard` gates the admin UI. The API enforces `requireAuth` / `requireRole("admin")` on every protected route.

### Backend layout (`backend/src`)
| Folder | Contents |
| --- | --- |
| `config/` | Zod-validated env, Prisma client, Better Auth instance |
| `middlewares/` | `requireAuth`, `requireRole`, `validate` (Zod), maintenance guard, global error handler |
| `utils/` | `ApiError`, `sendResponse`, pagination/sort/search builders, mailer + email log, activity log, URL/SSRF guard |
| `modules/<name>/` | `*.routes.ts` → `*.controller.ts` → `*.service.ts`, plus `*.validation.ts` |
| `engine/` | Scanning engine: check registry, per-scan context, runner/queue, scoring, integrations |

Every response uses the same envelope: `{ success, message, data, meta? }` on success and `{ success: false, message, errors? }` on error.

### Scanning engine
- Each check is a small `CheckDefinition` in `engine/checks/<category>.ts` and is registered in `engine/registry.ts`. `syncCatalog()` copies new checks into the database on boot. It never overwrites admin changes such as severity, weight or enabled state.
- Checks make real requests: HTTP fetches with the redirect chain recorded, HTML parsing (cheerio), the TLS handshake (`node:tls`) and DNS lookups (`node:dns`). Every outbound host is checked against private and loopback ranges to block SSRF.
- **Browser & device checks** (cross-browser rendering, responsive layout, console errors, screenshots, Core Web Vitals, colour contrast) need a real browser. They show up in the catalog but report **`UNAVAILABLE`** until a provider is implemented in `engine/integrations/browser.ts`. They are left out of scoring, and no simulated results are produced.
- Scans run in an in-process queue (`SCAN_MAX_CONCURRENCY`). Results are written as each check finishes, and the UI polls for live progress. To scale out to several API instances, swap `ScanQueue` for a job queue such as BullMQ.

### Billing
Plans, quotas (scans per month and websites) and subscriptions are fully implemented. No payment gateway is bundled. `modules/billing/payment.provider.ts` defines the `PaymentProvider` interface:
- Free plans switch instantly.
- A paid upgrade returns HTTP 402 with a clear message until a provider is implemented.
- Admins can assign any plan from the user detail page.

### Frontend layout (`frontend/src`)
| Folder | Contents |
| --- | --- |
| `app/` | Routes only: `(auth)`, `dashboard/*`, `dashboard/admin/*` |
| `components/ui` | Design system: Button, Input, Card, Badge, DataTable, Modal, Tabs, ScoreRing, … |
| `components/layout` | Sidebar, Topbar, DashboardShell, AdminGuard, Logo |
| `features/` | Feature views and forms (auth, scans, websites, reports, billing, profile, admin/*) |
| `services/` | One RTK Query API (`api.ts`) with feature endpoints injected per file |
| `redux/` | Store, typed hooks, UI slice (sidebar, toasts) |
| `hooks/`, `lib/`, `types/`, `utils/` | Shared hooks, navigation config, API/model types, formatters |

**PDF reports:** the report page is a print-optimised layout. *Download PDF* opens the browser's print-to-PDF, using A4 print styles in `globals.css`.

## Environment

See `backend/.env.example` and `frontend/.env.example`. If the host's own DNS resolver can't be reached from Node, set `DNS_SERVERS=1.1.1.1,8.8.8.8` for the Email & DNS checks. DNS lookup failures are reported as `ERROR` and are never counted as missing records. If SMTP is not configured, emails such as password resets are logged as `SKIPPED` and printed to the backend console in development. Admins can check this under **Email & SMTP**.

### Deploying the backend to Vercel

Set the Vercel project Root Directory to `backend`. The serverless function exports the Express app directly; `src/server.ts` remains the local entrypoint and is not used by Vercel. Configure these Production Environment Variables in Vercel:

- `DATABASE_URL`: MongoDB connection string for a replica set (for example, a MongoDB Atlas deployment).
- `BETTER_AUTH_SECRET`: a private random secret of at least 32 characters.
- `BETTER_AUTH_URL`: the public backend origin, including `https://` and without `/api/auth`.
- `CLIENT_URL`: the public frontend origin (comma-separated if there is more than one).
- `NODE_ENV`: `production`.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: only needed when running the seed command; they are not required to serve requests.
- `PORT`: not required on Vercel; it supplies the function port. The backend's default is for local development.

Deploy from the Vercel dashboard or, with the Vercel CLI installed and linked to the backend project, run `cd backend`, `npm run build`, then `vercel --prod`. The build generates Prisma Client before compiling TypeScript. Run `npm run seed` separately only when initializing the database.

For the deployed frontend at `https://frontend-ashen-two-66.vercel.app` and backend at `https://backend-coral-six-85.vercel.app`, set the backend's `BETTER_AUTH_URL` to `https://backend-coral-six-85.vercel.app` and `CLIENT_URL` to `https://frontend-ashen-two-66.vercel.app` (origin only, no path). Production also explicitly trusts this configured frontend origin. Set the frontend's `API_URL` to `https://backend-coral-six-85.vercel.app` (the frontend also defaults to this backend origin for production builds). After changing Vercel environment variables, redeploy both projects so Next.js rebuilds its rewrite configuration.

The backend's `DATABASE_URL` must be a valid MongoDB Atlas connection URI for a replica-set cluster. A MongoDB SRV URI must use the exact Atlas cluster hostname from Atlas **Connect → Drivers**; if a request reports DNS resolution failure, correct that hostname and check Atlas Network Access before redeploying. Never put database credentials in frontend environment variables or source control. `ADMIN_EMAIL` and `ADMIN_PASSWORD` are only needed for database seeding.

The scan runner is an in-process queue. Vercel can suspend a function after its HTTP response, so scans are not guaranteed to finish reliably in this deployment model; durable scanning requires a persistent worker and job queue. The API and other request/response routes do not depend on the local `app.listen()` server.
