import type { APIRoute } from "astro";
import { db, posts } from "../../../db";
import { eq } from "drizzle-orm";
import { purgeSiteCaches } from "../../../lib/config";

export const prerender = false;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get("Authorization");
    const expectedSecret = process.env.AUTO_PUBLISH_SECRET || "";

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
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
