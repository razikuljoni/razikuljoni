// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://razikuljoni.xyz',
  output: 'static',
  adapter: vercel(),
  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    react({
      include: ['**/components/**'],
    }),
    sitemap({
      filter: (page) => {
        const url = new URL(page);
        return !url.pathname.startsWith('/cat') && !url.pathname.startsWith('/api');
      },
      serialize(item) {
        const url = item.url.replace(/\/$/, '');
        if (url === 'https://razikuljoni.xyz') {
          item.changefreq = 'daily';
          item.priority = 1.0;
        } else if (url.includes('/projects') || url.includes('/research') || url.includes('/about') || url.includes('/skills')) {
          item.changefreq = 'weekly';
          item.priority = 0.9;
        } else {
          item.changefreq = 'monthly';
          item.priority = 0.8;
        }
        item.lastmod = new Date().toISOString();
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
  },
  compressHTML: true,
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  markdown: {
    shikiConfig: { theme: 'github-dark-dimmed' },
  },
});
