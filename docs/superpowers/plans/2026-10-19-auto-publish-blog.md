# AI Auto-Publish Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure API endpoint (`src/pages/api/admin/auto-publish.ts`) that accepts automated webhook payloads from Muse AI / Gemini Spark to research, write, and publish blog posts instantly with automatic cache purging.

**Architecture:** A new POST route protected by a shared secret (`AUTO_PUBLISH_SECRET`) that validates incoming post payloads, normalizes tags and slugs, inserts into the Drizzle `posts` table, and purges Redis/site caches so posts go live instantly.

**Tech Stack:** Astro API Routes, Drizzle ORM, Turso SQLite, Upstash Redis cache-busting.

**Spec:** App-native automated blog publishing triggered via Muse AI / Gemini Spark webhooks.

## Global Constraints

- Must be completely free (using existing Turso and Vercel hosting/API routes).
- Must authenticate incoming requests securely using a shared bearer token (`AUTO_PUBLISH_SECRET`).
- Must automatically purge site caches so posts appear immediately.

## Review Focus

1. **Missing secret / invalid auth:** Returns 401 Unauthorized.
2. **Missing title:** Returns 400 Bad Request.
3. **Duplicate slug:** Handles unique constraint violation gracefully by returning 409 Conflict.
4. **Malformed tags:** Ensures tags are correctly parsed or fallback to empty array.

---

### Task 1: Create Auto-Publish API Endpoint

**Files:**
- Create: `src/pages/api/admin/auto-publish.ts`

**Interfaces:**
- Consumes: `db`, `posts` table from `src/db`, `purgeSiteCaches` from `src/lib/config`.
- Produces: `POST /api/admin/auto-publish` JSON endpoint.

- [ ] **Step 1: Create `src/pages/api/admin/auto-publish.ts`**

```typescript
import type { APIRoute } from "astro";
import { db, posts } from "../../../db";
import { eq } from "drizzle-orm";
import { purgeSiteCaches } from "../../../lib/config";

export const prerender = false;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\\w\\s-]/g, "")
    .replace(/[\\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get("Authorization");
    const expectedSecret = process.env.AUTO_PUBLISH_SECRET || "";

    if (!expectedSecret || authHeader !== \`Bearer \${expectedSecret}\`) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { title, description, content = "", externalUrl, tags = [], draft = false } = body;

    if (!title) {
      return new Response(JSON.stringify({ success: false, error: "Title is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const slug = body.slug || slugify(title);
    const publishedAt = body.publishedAt ? new Date(body.publishedAt) : new Date();
    const now = new Date();

    const result = await db
      .insert(posts)
      .values({
        slug,
        title,
        description: description || "",
        content: content || "",
        externalUrl: externalUrl || null,
        publishedAt,
        updatedAt: now,
        tags: JSON.stringify(Array.isArray(tags) ? tags : []),
        draft: Boolean(draft),
      })
      .returning();

    await purgeSiteCaches().catch(() => {});

    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (/unique/i.test(String(error?.message))) {
      return new Response(JSON.stringify({ success: false, error: "A post with this slug already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: false, error: "Failed to publish post" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

- [ ] **Step 2: Verify build and compile check**

Run: `pnpm run build`
Expected: Success with no typescript or astro build errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/admin/auto-publish.ts
git commit -m "feat: add secure auto-publish endpoint for AI blog generation"
```
