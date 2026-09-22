import type { APIRoute } from "astro";
import { db, achievements } from "../../../../db";
import { eq } from "drizzle-orm";
import { ogSvg } from "../../../../lib/og";

export const prerender = false;

// Branded per-achievement OG image (SVG)
export const GET: APIRoute = async ({ params }) => {
  const raw = params.slug || "";
  const slug = raw.replace(/\.svg$/, "");
  if (!slug) return new Response("Not found", { status: 404 });

  let a: any = null;
  try {
    const rows = await db.select().from(achievements).where(eq(achievements.slug, slug)).limit(1);
    a = rows[0] || null;
  } catch {}
  if (!a) return new Response("Not found", { status: 404 });

  const svg = ogSvg({
    kicker: a.year ? `Achievement · ${a.year}` : "Achievement",
    title: a.name,
    description: a.description || "",
    meta: a.url ? ["Proof & story on razikuljoni.xyz"] : ["Story on razikuljoni.xyz"],
    footer: "MD Razikul Islam Joni · Jr. Full-Stack Developer · razikuljoni.xyz",
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
};
