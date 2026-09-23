# AGENTS.md — Admin Dashboard Domain

Owner docs for `/cat/` (dashboard UI) + sibling `/api/admin/` (CRUD APIs). One entity = one page + one API file.

## OVERVIEW

Password-protected admin dashboard for site content. All routes under `/cat/` require a valid admin session; all `/api/admin/*` mutations require the `admin` session token.

## STRUCTURE

```
src/pages/
├── cat/            # dashboard pages (23): index, login, profile, settings + one per entity
└── api/
    └── admin/      # CRUD endpoints (21): one .ts per entity + upload.ts
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Entity CRUD API | `src/pages/api/admin/<entity>.ts` — GET list / POST upsert / DELETE |
| Entity edit form | `src/pages/cat/<entity>.astro` — fetches record, POSTs to matching API |
| Auth check / session | `src/lib/auth.ts` (`createSession`, `verifySession`, `verifyCredentials`), `src/middleware.ts`, `adminSessions` table |
| Dashboard shell | `src/pages/cat/index.astro` (stats overview), `login.astro`, `profile.astro`, `settings.astro` |
| Uploads | `src/pages/api/admin/upload.ts` |

## CONVENTIONS

- Entity naming matches DB table: `src/pages/cat/projects.astro` ↔ `src/pages/api/admin/projects.ts` ↔ `projects` table in `src/db/schema.ts`.
- API responses: `{ ok: true, data }` / `{ ok: false, error }`. Check existing endpoint for exact shape before extending.
- Auth: middleware guards `/cat/*` and `/api/admin/*`; login via `/api/cat/login`, logout via `/api/cat/logout`.
- Credentials from env (see `verifyCredentials`); session stored in `admin_sessions` table.

## ANTI-PATTERNS

- Never bypass middleware auth in dev/testing to "speed up" — session required everywhere under these routes.
- Never hardcode entity lists; add new page + API pair when a new table is added.
- Don't delete records without confirmation UI (destructive, no undo).

## COMMANDS

```bash
pnpm run db:generate   # after schema change
pnpm run db:push       # apply migration
```

## NOTES

- Seeding (`pnpm run db:seed`) wipes data on remote DB unless `--force`; use `TURSO_DATABASE_URL="file:local.db"` for local dev.