# DocSearch (ArcScan) — Project Overview

## Summary
DocSearch is a SaaS document management system with automatic OCR and text search. Built with React on the frontend and Node.js/Express on the backend, using Supabase for auth, database, and storage.

## Architecture

### Frontend (`/frontend`)
- **Framework:** React 18 + Vite 5
- **Styling:** TailwindCSS
- **Auth:** Supabase Auth (with mock/demo mode)
- **Port:** 5000 (development)
- **Key files:**
  - `src/App.jsx` — Root app with routing
  - `src/lib/api.js` — Axios API client (baseURL from `VITE_API_URL`)
  - `src/lib/supabase.js` — Supabase client
  - `src/context/` — Auth context
  - `src/pages/` — Page components
  - `src/components/` — Layout components (sidebar, topbar)

### Backend (`/backend`)
- **Framework:** Node.js + Express
- **Port:** 3001
- **Key services:** OCR (Tesseract.js), PDF parsing, Supabase storage, AI (Groq/Gemini)
- **Routes:** `/api/documents`, `/api/search`, `/api/categories`, `/api/users`, `/api/health`

## Workflows
- **Start application** — `cd frontend && npm run dev` → port 5000 (webview)
- **Backend API** — `cd backend && npm start` → port 3001 (console)

## Environment Variables

### Backend (`backend/.env`)
- `PORT=3001`
- `NODE_ENV=development`
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_KEY` — Supabase service role key
- `GROQ_API_KEY` — Groq AI API key
- `FRONTEND_URL` — Allowed CORS origin (set to Replit dev domain for prod)

### Frontend (`frontend/.env`)
- `VITE_API_URL` — Backend API base URL (empty = relative, uses Vite proxy)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key

## Demo Mode
Login with: `demo@docsearch.local` / `demo123`

## Theme
- Light-only theme with soft, pastel colors
- Primary palette: soft indigo/purple (#7b8ff2 base)
- No dark mode — all `dark:` classes have been removed
- Info cards use `bg-primary-50` with `border-primary-100` instead of dark backgrounds
- Buttons use `bg-primary-500` instead of `bg-slate-900`

## Branding
- Subtitle: "Neural Engine Documents Scan" (updated from "Neural Engine")
- Logo: NC Convênios logo at `/frontend/public/logo.png` — displayed on login page (centered) and sidebar header
- Copyright: Dynamic year via `new Date().getFullYear()` — auto-updates each year
- Login page: Centered layout, no registration link

## Replit Configuration Notes
- Frontend uses `host: '0.0.0.0'` and `allowedHosts: true` for Replit proxy compatibility
- Vite proxies `/api/*` requests to `http://localhost:3001`
- CORS is set to `origin: true` to allow all origins in development
