import rss from "@astrojs/rss";
import { getDynamicConfig } from "../lib/config";
import { db, posts, projects, isRealDbConfigured } from "../db";
import { eq } from "drizzle-orm";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(context) {
  const siteConfig = await getDynamicConfig();

  let blogPosts = [];
  let allProjects = [];

  if (isRealDbConfigured) {
    try {
      blogPosts = await db.select().from(posts).where(eq(posts.draft, false));
      allProjects = await db.select().from(projects);
    } catch (err) {
      console.warn("RSS DB fetch failed, using fallback empty feed:", err?.message || err);
    }
  }

  const items = [
    ...blogPosts.map((post) => ({
      title: post.title,
      pubDate: post.publishedAt,
      description: post.description,
      link: `/blog/${post.slug}/`,
      content: post.content,
    })),
    ...allProjects.map((project) => ({
      title: project.name,
      pubDate: new Date(project.projectDate || project.createdAt || new Date()),
      description: project.description,
      link: `/projects/${project.slug}/`,
      content: project.description,
    })),
  ];

  items.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
  );

  return rss({
    title: siteConfig.name || "MD Razikul Islam Joni",
    description: siteConfig.description || "Jr. Full-Stack Developer",
    site: context.site || "https://razikuljoni.xyz",
    items: items,
    customData: `<language>en-us</language>`,
  });
}
