# Student Management — Website (Frontend)

React + Vite + TypeScript + Tailwind CSS web app for attendance, activities, PDF reports, and student management.

It talks only to the **NestJS Backend API**. All data lives in **Neon Postgres** (via the backend). The frontend never connects to the database directly.

---

## Table of contents

1. [What this app does](#1-what-this-app-does)
2. [Tech stack](#2-tech-stack)
3. [Prerequisites](#3-prerequisites)
4. [Project structure](#4-project-structure)
5. [How frontend ↔ backend works](#5-how-frontend--backend-works)
6. [Step-by-step: local setup](#6-step-by-step-local-setup)
7. [Environment variables](#7-environment-variables)
8. [npm scripts](#8-npm-scripts)
9. [Pages & features](#9-pages--features)
10. [PDF exports](#10-pdf-exports)
11. [Production build & deploy](#11-production-build--deploy)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. What this app does

| Feature | Description |
|---------|-------------|
| Dashboard | Quick stats, attendance form, year overview |
| Attendance | Mark present / absent / late / excused per date |
| Students (All Saints) | Master list, search, filters, edit, delete |
| Year → Month → Session | Drill-down calendar navigation |
| Activities | Add/remove activities on a session |
| Month files | Upload / view / download PDFs for a month |
| Reports | Per-student attendance reports |
| PDF | Daily / month / year / master list PDFs + preview |
| Bin | Soft-deleted sessions & files (restore / purge) |

---

## 2. Tech stack

| Layer | Library |
|-------|---------|
| UI | React 19 |
| Routing | React Router 7 |
| Build | Vite 8 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Icons | Lucide React |
| PDF | jsPDF + jspdf-autotable |
| Dates | date-fns |

---

## 3. Prerequisites

1. **Node.js** 20+ (recommended) and npm  
2. **Backend running** on `http://localhost:3000` (see `../Backend/README.md`)  
3. Neon database connected in the backend `.env`

Check Node:

```bash
node -v
npm -v
```

---

## 4. Project structure

```
Website/
├── .env.example                 # Local env template
├── .env.production.example      # Production env template
├── index.html
├── package.json
├── vite.config.ts               # Dev proxy: /api → localhost:3000
├── src/
│   ├── main.tsx                 # App entry
│   ├── App.tsx                  # Routes, loading, error, retry
│   ├── index.css                # Global + Tailwind
│   ├── types/                   # Shared TypeScript types
│   ├── context/
│   │   └── DataContext.tsx      # Global data + API refresh + cache
│   ├── services/
│   │   ├── api.ts               # All HTTP calls to backend
│   │   └── pdfService.ts        # PDF generate / download / preview
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── YearPage.tsx
│   │   ├── MonthPage.tsx
│   │   ├── SessionDetailPage.tsx
│   │   ├── StudentsPage.tsx
│   │   └── BinPage.tsx
│   ├── components/
│   │   ├── forms/               # Attendance, activity, edit student
│   │   ├── layout/              # Header, breadcrumb
│   │   ├── pdf/                 # Preview modal, data PDF panel
│   │   ├── reports/             # Student report panel
│   │   ├── students/            # Tables, tiles
│   │   └── ui/                  # Buttons, cards, share
│   ├── hooks/
│   │   └── usePdfPreview.tsx
│   └── utils/                   # Stats, dates, PDF helpers, reports
└── dist/                        # Production build output (after npm run build)
```

---

## 5. How frontend ↔ backend works

### Local development

```
Browser  →  http://localhost:5173
              │
              │  fetch('/api/...')
              ▼
           Vite proxy  →  http://localhost:3000/api/...
              │
              ▼
           NestJS + Neon
```

You do **not** set `VITE_API_URL` for local dev. Leave it empty so requests stay on `/api` and Vite proxies them.

### Production

```
Browser  →  https://your-frontend.com
              │
              │  fetch('https://your-api.com/api/...')
              ▼
           NestJS + Neon
```

Set `VITE_API_URL=https://your-api.com` at **build time** (Vite bakes it into the JS bundle).

---

## 6. Step-by-step: local setup

### Step 1 — Start the backend first

Open a terminal:

```bash
cd Backend
cp .env.example .env
# Edit .env → set DATABASE_URL to your Neon URI
npm install
npm run start:dev
```

Wait until you see:

```text
Student Management API (development) on port 3000
```

Check health:

```bash
curl http://localhost:3000/api/health
```

Expected: `"status":"ok","database":"up"`.

### Step 2 — Install frontend dependencies

New terminal:

```bash
cd Website
cp .env.example .env
npm install
```

### Step 3 — Run the frontend

```bash
npm run dev
```

Open: **http://localhost:5173/**

You should see a short loading spinner, then the dashboard with students from Neon.

### Step 4 — Quick smoke check

1. Home page loads with student count  
2. Open **All Saints** — list of students  
3. Open a **Year** (e.g. `/year/2025`) — months appear  
4. Open a month → session → mark attendance  
5. Try **Preview PDF** on a day/month/year  

---

## 7. Environment variables

### Files

| File | When to use |
|------|-------------|
| `.env` | Local development (optional; empty `VITE_API_URL` is fine) |
| `.env.production` | Production build |
| `.env.example` / `.env.production.example` | Templates (committed) |

### Variables

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `VITE_API_URL` | Prod only | `""` | Backend base URL, **no trailing slash**. Example: `https://api.example.com` |
| `VITE_API_KEY` | Optional | unset | If backend has `API_KEY` set, put the same value here so POST/PATCH/DELETE work |

### Example `.env` (local)

```env
VITE_API_URL=
```

### Example `.env.production`

```env
VITE_API_URL=https://your-api-host.com
# VITE_API_KEY=your-secret-if-backend-uses-api-key
```

> **Important:** Change `VITE_*` values → you must run `npm run build` again. They are embedded at build time.

---

## 8. npm scripts

| Command | What it does |
|---------|----------------|
| `npm run dev` | Start Vite dev server (hot reload) on port **5173** |
| `npm run build` | Typecheck (`tsc`) + production bundle → `dist/` |
| `npm run preview` | Serve `dist/` locally to test the production build |
| `npm run lint` | Run oxlint |

---

## 9. Pages & features

| Route | Page | Notes |
|-------|------|-------|
| `/` | Home / Dashboard | Attendance form, stats, year cards |
| `/students` | All Saints | Full list, filters, edit/delete |
| `/year/:year` | Year | Months, year PDF, reports |
| `/year/:year/month/:month` | Month | Sundays, files, month PDF |
| `/year/:year/month/:month/date/:date` | Session | Attendance tiles, activities |
| `/bin` | Bin | Restore / permanently delete |

### Data loading

- On first visit, `DataContext` calls `GET /api/bootstrap`.
- Response is cached in `sessionStorage` so reloads feel faster.
- If refresh fails but cache exists, a yellow banner shows **Retry**.
- If there is no cache and API is down, you get an error screen with **Retry**.

---

## 10. PDF exports

PDFs are generated **in the browser** (jsPDF), not on the server.

| Report | Typical entry point |
|--------|---------------------|
| Daily attendance | Session page / Home |
| Month attendance | Month page |
| Year attendance | Year page |
| All Saints master | Students page |
| Student report | Report panel (search student) |

Most PDF buttons support:

- **Download** — save file  
- **Preview** — open modal with PDF viewer  

---

## 11. Production build & deploy

### Build

```bash
cd Website
cp .env.production.example .env.production
# Edit .env.production → set VITE_API_URL

npm ci
npm run build
```

Output folder: `Website/dist/`

### Test production build locally

```bash
npm run preview
```

### Deploy options

Upload / connect the `dist/` folder to:

- Netlify  
- Vercel  
- Cloudflare Pages  
- AWS S3 + CloudFront  
- nginx static host  

### Backend CORS

On the backend, set:

```env
CORS_ORIGIN=https://your-frontend-domain.com
```

Multiple origins:

```env
CORS_ORIGIN=https://app.example.com,https://www.example.com
```

### Same-domain setup (optional)

If nginx (or similar) serves the site and proxies `/api` to Nest:

1. Leave `VITE_API_URL` empty  
2. Proxy `/api` → `http://127.0.0.1:3000`  
3. No CORS issues (same origin)

---

## 12. Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank white page / long spinner | Backend down or Neon cold. Check `curl localhost:3000/api/health`. Wait and click Retry. |
| `http proxy error: /api/bootstrap` / `ECONNREFUSED` | Start backend: `cd Backend && npm run start:dev` |
| Page loads but old/wrong data | Hard refresh (Cmd+Shift+R). Clear site data / sessionStorage. |
| Production site calls wrong host | Rebuild after setting `VITE_API_URL`. Empty value only works with a reverse proxy. |
| CORS errors in browser console | Set backend `CORS_ORIGIN` to your exact frontend URL (https, no trailing slash mismatch). |
| POST/PATCH/DELETE return 401 | Backend `API_KEY` is set — add matching `VITE_API_KEY` and rebuild. |
| Year page feels empty | Confirm year exists in data (`/year/2025`). Check bootstrap has that year. |
| PDF preview blank | Allow popups/blob URLs; try Download instead. |
| `npm run build` fails on TypeScript | Fix reported errors; run `npx tsc -b` for details. |

### Useful checks

```bash
# Backend health
curl http://localhost:3000/api/health

# Bootstrap (should return students + years JSON)
curl -s http://localhost:3000/api/bootstrap | head -c 200

# Via Vite proxy (while npm run dev is running)
curl -s http://localhost:5173/api/health
```

---

## Related docs

- Backend setup & Neon: [`../Backend/README.md`](../Backend/README.md)  
- Project overview: [`../README.md`](../README.md)
