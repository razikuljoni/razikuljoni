// @ts-check
import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';
import { createClient } from '@libsql/client';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import vercel from '@astrojs/vercel';

const isVercel = !!process.env.VERCEL || process.env.VERCEL_ENV !== undefined;

const SITE = 'https://razikuljoni.vercel.app';

/**
 * Minimal .env reader — the config is loaded before Astro injects import.meta.env,
 * so PUBLIC_ and TURSO_ values have to be read from disk here.
 */
function readEnvFile(file) {
  try {
    return Object.fromEntries(
      readFileSync(file, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const i = line.indexOf('=');
          return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
        }),
    );
  } catch {
    return {};
  }
}

const fileEnv = { ...readEnvFile('.env'), ...readEnvFile('.env.local'), ...readEnvFile('.env.production') };
const DB_URL = process.env.TURSO_DATABASE_URL || fileEnv.TURSO_DATABASE_URL;
const DB_TOKEN = process.env.TURSO_AUTH_TOKEN || fileEnv.TURSO_AUTH_TOKEN;

/**
 * Detail pages (projects / posts / achievements) are server-rendered, so
 * @astrojs/sitemap cannot discover them. Query the database at build time and
 * feed them in as custom pages with a real lastmod.
 */
async function loadDetailPages() {
  const empty = { urls: [], lastmod: new Map() };
  if (!DB_URL || !/^(libsql|https?|wss?):/.test(DB_URL)) return empty;

  const client = createClient({ url: DB_URL, authToken: DB_TOKEN || '' });
  try {
    const [projects, posts, achievements] = await Promise.all([
      client.execute(
        "select slug, strftime('%Y-%m-%dT%H:%M:%SZ', coalesce(updated_at, created_at)) as d from projects where slug is not null and slug != ''",
      ),
      client.execute(
        "select slug, strftime('%Y-%m-%dT%H:%M:%SZ', coalesce(updated_at, published_at), 'unixepoch') as d from posts where draft = 0 and external_url is null and slug is not null and slug != ''",
      ),
      client.execute(
        "select slug, strftime('%Y-%m-%dT%H:%M:%SZ', coalesce(updated_at, created_at)) as d from achievements where slug is not null and slug != ''",
      ),
    ]);

    const urls = [];
    const lastmod = new Map();
    const add = (prefix, rows) => {
      for (const row of rows.rows) {
        const slug = String(row.slug);
        const url = `${SITE}/${prefix}/${slug}/`;
        urls.push(url);
        if (row.d) lastmod.set(url, String(row.d));
      }
    };
    add('projects', projects);
    add('posts', posts);
    add('achievements', achievements);
    return { urls, lastmod };
  } catch (err) {
    console.warn('[sitemap] detail pages skipped:', err?.message || err);
    return empty;
  } finally {
    client.close();
  }
}

const detailPages = await loadDetailPages();

export default defineConfig({
  site: SITE,
  output: 'static',
  adapter: isVercel ? vercel() : cloudflare({ session: false }),
  integrations: [
    mdx(),
    react({
      include: ['**/components/**'],
    }),
    sitemap({
      customPages: detailPages.urls,
      filter: (page) => {
        const { pathname } = new URL(page);
        if (pathname.startsWith('/cat') || pathname.startsWith('/api')) return false;
        // /cv is a printable copy of the resume — noindex, keep it out of the sitemap
        if (pathname === '/cv' || pathname === '/cv/') return false;
        return true;
      },
      serialize(item) {
        const { pathname } = new URL(item.url);
        if (pathname === '/') {
          item.changefreq = 'daily';
          item.priority = 1.0;
        } else if (
          pathname === '/projects' ||
          pathname === '/research' ||
          pathname === '/about' ||
          pathname === '/skills' ||
          pathname === '/posts' ||
          pathname === '/achievements'
        ) {
          item.changefreq = 'weekly';
          item.priority = 0.9;
        } else if (/^\/(projects|posts|achievements)\/.+\/$/.test(pathname)) {
          item.changefreq = 'weekly';
          item.priority = 0.8;
        } else {
          item.changefreq = 'monthly';
          item.priority = 0.8;
        }
        // Only a real modification date — never the build timestamp
        const lastmod = detailPages.lastmod.get(item.url);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
    assets: '_a',
  },
  image: {
    remotePatterns: [{ protocol: 'https' }],
  },
  vite: {
    plugins: [tailwindcss()],
    css: { devSourcemap: false },
    build: { sourcemap: false },
    optimizeDeps: {
      entries: ['src/**/*.{js,mjs,ts,tsx,jsx}'],
    },
  },
  compressHTML: true,
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: { theme: 'github-dark-dimmed' },
  },
});
