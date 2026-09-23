# AGENTS.md

Repository guidelines, architecture overview, developer commands, and codebase facts.

**Branch:** `dev`
**Current HEAD:** `e9da180` (dependency upgrade: Astro 7 & React 19, content collection migration)

## Overview

Personal developer portfolio and site built for **MD Razikul Islam Joni** (Jr. Full-Stack Developer).

- **Framework**: Astro 7 (hybrid SSR/static, `@astrojs/vercel` adapter, React 19 integration)
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite`
- **Database & ORM**: Turso / libSQL SQLite + Drizzle ORM (`src/db/schema.ts`, 28 tables)
- **Content**: Astro content collections via `glob` loader (`src/content.config.ts`, collections defined there; legacy `src/content/config.ts` was removed)
- **Config Architecture**: Dynamic configuration loaded from database via `getDynamicConfig()` (`src/lib/config.ts`), falling back to `PUBLIC_*` environment variables in `src/lib/env.ts` (`src/config/site.ts` is obsolete).
- **Runtime**: Bun / Node.js

## Key Developer Commands

```bash
# Install dependencies
pnpm install

# Start local development server
pnpm run dev

# Production build
pnpm run build

# Preview production build locally
pnpm run preview

# Drizzle ORM migrations & studio
pnpm run db:generate     # Generate Drizzle migration files
pnpm run db:push         # Push schema changes to database
pnpm run db:seed         # Seed database (TURSO_DATABASE_URL="file:local.db")
pnpm run db:studio       # Launch Drizzle Studio UI

# Deploy script
pnpm run deploy          # Deploy to Vercel (vercel --prod)
```

## Environment Setup

Create `.env` or `.env.local` using `.env.example`:

- `PUBLIC_SITE_URL`: `https://razikuljoni.xyz`
- `PUBLIC_SITE_NAME`: `MD Razikul Islam Joni`
- `PUBLIC_SITE_DESCRIPTION`: `Jr. Full-Stack Developer | Next.js, React, Node.js, PostgreSQL`
- `PUBLIC_EMAIL`: `razikuljoni@gmail.com`
- `PUBLIC_GITHUB`: `razikuljoni`
- `PUBLIC_LINKEDIN`: `razikuljoni`
- `PUBLIC_LOCATION`: `Dhaka, Bangladesh`
- `PUBLIC_TIMEZONE`: `Asia/Dhaka`
- `TURSO_DATABASE_URL`: `file:local.db` (for local dev) or `libsql://<dbname>.turso.io` (production)
- `TURSO_AUTH_TOKEN`: Turso database auth token

## Codebase Structure

- `src/db/`: Drizzle ORM schema (`schema.ts`), connection (`index.ts`), and database seeder (`seed.ts`).
- `src/content.config.ts`: Astro content collection definitions (`projects` via `glob` loader); source files in `src/content/projects/`.
- `src/lib/`:
  - `config.ts`: Dynamic configuration fetcher (`getDynamicConfig`).
  - `env.ts`: Public environment variable mappings.
  - `loaders.ts`: Content and database entity loaders with caching.
- `src/pages/`: Astro routes. `/cat/` routes contain the admin dashboard (see `src/pages/cat/AGENTS.md`). `/api/` contains serverless API endpoints; `/api/admin/` holds CRUD endpoints for the dashboard.
- `src/components/`: Modular React and Astro components (`home/`, `ui/`, `common/`).
- `scripts/`: Maintenance scripts (`push-env.ts`, `apply-category-migration.mjs`).
- `today.py`: Python script generating GitHub profile dashboard SVG cards (`hero.svg`, `contribs.svg`, `cosmos.svg`, etc.).
- `wrangler.jsonc`: Secondary Cloudflare Workers deploy config (static-only since `main` entrypoint was removed; re-add `dist/server/entry.mjs` for SSR/API on CF).

## Guidelines for AI Agents

1. **Dynamic Config First**: Do not hardcode author name, social URLs, or site details in Astro pages. Use `siteConfig = await getDynamicConfig()` or fallback to `env`.
2. **Database Seeding Guard**: Running `seed.ts` against remote database deletes existing data unless `--force` is passed. Always use `TURSO_DATABASE_URL="file:local.db"` for local development.
3. **Type Safety & Linters**: Maintain strict TypeScript practices. Run `lsp_diagnostics` or build checks after changes.
