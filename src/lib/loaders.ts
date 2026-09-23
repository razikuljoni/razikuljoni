// Shared data loaders — single source of truth for all sections.
// Guarantees:
//  - versioned cache keys (bust stale prod caches on deploy)
//  - empty results are NEVER cached (a transient DB failure can't poison the cache)
//  - L1 in-memory (30s) → L2 Redis → L3 DB, always with a safe fallback
import { db, isRealDbConfigured, projects, experiences, education, publications, skills, uses, projectCategories, testimonials, heroMetrics, languages, certifications, galleryPhotos, books, workshopProjects, achievements, interests } from "../db";
import { asc, desc } from "drizzle-orm";
import { getCachedData, setCachedData } from "./redis";

export const CACHE_VERSION = "v2";

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

interface ProjectRow {
  id: number;
  name: string;
  slug: string;
  description: string;
  content: string | null;
  url: string;
  github: string | null;
  image: string | null;
  tags: string[];
  category: string | null;
  featured: boolean;
  status: string | null;
  projectDate: string | null;
  stars: number;
  techStack: string[];
  metrics: Record<string, string>;
  gallery: string[];
  demoUrl: string | null;
  documentation: string | null;
  duration: string | null;
  role: string | null;
  challenges: string | null;
  outcomes: string | null;
  lessonsLearned: string | null;
  teamSize: number | null;
}

export interface Project extends ProjectRow {}

function mapProject(r: any): Project {
  return {
    ...r,
    tags: safeParse<string[]>(r.tags, []),
    techStack: safeParse<string[]>(r.techStack, []),
    metrics: safeParse<Record<string, string>>(r.metrics, {}),
    gallery: safeParse<string[]>(r.gallery, []),
  };
}

const loaderCaches = new Set<{ clear: () => void }>();

function makeLoader<T>(
  key: string,
  fetchFn: () => Promise<T[]>,
  fallback: T[] = [],
  validate: (rows: T[] | null | undefined) => boolean = (rows) => Array.isArray(rows) && rows.length > 0,
) {
  let mem: T[] | null = null;
  let memTs = 0;
  const MEM_TTL = 30_000;
  loaderCaches.add({
    clear: () => {
      mem = null;
      memTs = 0;
    },
  });

  return async (): Promise<T[]> => {
    if (mem && Date.now() - memTs < MEM_TTL) return mem;
    if (!isRealDbConfigured) return mem || fallback;
    const [rows, cached] = await Promise.all([
      fetchFn().catch(() => null as unknown as T[]),
      getCachedData(`${CACHE_VERSION}:${key}`),
    ]);
    if (validate(rows)) {
      mem = rows;
      memTs = Date.now();
      setCachedData(`${CACHE_VERSION}:${key}`, rows, 600).catch(() => {});
      return rows;
    }
    if (validate(cached)) {
      mem = cached;
      memTs = Date.now();
      return cached;
    }
    return rows || mem || fallback;
  };
}

const defaultProjects: Project[] = [
  {
    id: 1,
    name: "SensorGrid",
    slug: "sensorgrid",
    description: "Real-Time IoT Dashboard for monitoring 10,000+ connected sensors with sub-second WebSocket updates and geospatial mapping.",
    content: "Real-Time IoT Dashboard for monitoring 10,000+ connected sensors with sub-second WebSocket updates and geospatial mapping.",
    url: "https://github.com/razikuljoni/sensorgrid",
    github: "https://github.com/razikuljoni/sensorgrid",
    image: null,
    tags: ["React", "TypeScript", "WebSocket", "Tailwind CSS"],
    category: "web",
    featured: true,
    status: "completed",
    projectDate: "2024-06-01",
    stars: 12,
    techStack: ["React", "TypeScript", "WebSocket", "Tailwind CSS"],
    metrics: {},
    gallery: [],
    demoUrl: null,
    documentation: null,
    duration: "3 months",
    role: "Frontend Developer",
    challenges: "Handling high-frequency WebSocket updates without UI lag.",
    outcomes: "Sub-second update latency across 10,000 live data points.",
    lessonsLearned: "Canvas rendering and virtualized lists are essential for high-throughput data streams.",
    teamSize: 3,
  },
  {
    id: 2,
    name: "Z Shop",
    slug: "z-shop",
    description: "AI-Powered E-Commerce Platform featuring personalized recommendations, dynamic pricing, and seamless checkout.",
    content: "AI-Powered E-Commerce Platform featuring personalized recommendations, dynamic pricing, and seamless checkout.",
    url: "https://github.com/razikuljoni/z-shop",
    github: "https://github.com/razikuljoni/z-shop",
    image: null,
    tags: ["Next.js", "Node.js", "PostgreSQL", "Prisma"],
    category: "web",
    featured: true,
    status: "completed",
    projectDate: "2024-10-01",
    stars: 8,
    techStack: ["Next.js", "Node.js", "PostgreSQL", "Prisma"],
    metrics: {},
    gallery: [],
    demoUrl: null,
    documentation: null,
    duration: "4 months",
    role: "Full-Stack Developer",
    challenges: "Building fast product recommendations with minimal query overhead.",
    outcomes: "Integrated vector similarity search in PostgreSQL.",
    lessonsLearned: "PostgreSQL pgvector simplifies hybrid full-text and semantic search.",
    teamSize: 2,
  },
  {
    id: 3,
    name: "InsightDoc",
    slug: "insightdoc",
    description: "Enterprise RAG Platform for PDF Analytics with semantic vector search and automated document summarization.",
    content: "Enterprise RAG Platform for PDF Analytics with semantic vector search and automated document summarization.",
    url: "https://github.com/razikuljoni/insightdoc",
    github: "https://github.com/razikuljoni/insightdoc",
    image: null,
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Python"],
    category: "ai-ml",
    featured: true,
    status: "completed",
    projectDate: "2025-01-01",
    stars: 15,
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Python"],
    metrics: {},
    gallery: [],
    demoUrl: null,
    documentation: null,
    duration: "2 months",
    role: "Full-Stack Developer",
    challenges: "Accurate chunking and table extraction from multi-page PDFs.",
    outcomes: "High precision RAG queries over 100+ page technical documents.",
    lessonsLearned: "Layout-aware parsing beats plain text extraction.",
    teamSize: 1,
  },
];

const defaultExperiences = [
  {
    id: 1,
    company: "HawkEyes Digital Monitoring Ltd.",
    role: "Junior Frontend Developer",
    url: "https://hawkeyesbd.com",
    logoUrl: null,
    startDate: "2024-02-01",
    endDate: "2026-04-01",
    details: "Built interactive IoT monitoring dashboards, optimized map rendering for 10,000+ real-time markers, and implemented responsive React components.",
    order: 0,
  },
];

const defaultEducation = [
  {
    id: 1,
    institution: "Green University of Bangladesh",
    degree: "B.Sc. in Computer Science and Engineering",
    startDate: "2020-01-01",
    endDate: "2023-12-31",
    details: "Specialized in Software Engineering, Web Technologies, Database Systems, and Algorithms.",
    order: 0,
  },
];

const defaultSkills = [
  { id: 1, name: "Next.js", category: "framework", description: "React Framework for Production", order: 1 },
  { id: 2, name: "React", category: "framework", description: "UI Library", order: 2 },
  { id: 3, name: "TypeScript", category: "language", description: "Typed JavaScript", order: 3 },
  { id: 4, name: "Node.js", category: "framework", description: "JavaScript Runtime", order: 4 },
  { id: 5, name: "Express.js", category: "framework", description: "Web Framework", order: 5 },
  { id: 6, name: "PostgreSQL", category: "database", description: "Relational Database", order: 6 },
  { id: 7, name: "MongoDB", category: "database", description: "NoSQL Database", order: 7 },
  { id: 8, name: "Tailwind CSS", category: "framework", description: "Utility-first CSS", order: 8 },
  { id: 9, name: "Docker", category: "devops", description: "Containerization", order: 9 },
  { id: 10, name: "Zod", category: "general", description: "Schema Validation", order: 10 },
];

const defaultAchievements = [
  { id: 1, name: "Real-Time IoT Dashboard", icon: "zap", description: "Engineered real-time map & chart data stream handling 10,000+ live IoT devices.", order: 1 },
  { id: 2, name: "Enterprise RAG Search", icon: "search", description: "Implemented vector semantic search over PDF documents using Next.js & PostgreSQL.", order: 2 },
  { id: 3, name: "2,000+ GitHub Contributions", icon: "github", description: "Maintained active open-source contribution record across full-stack repositories.", order: 3 },
];

const defaultInterests = [
  { id: 1, name: "Full-Stack Development & Micro-services", description: "Building scalable web platforms with Next.js, Node.js, and PostgreSQL.", order: 1 },
  { id: 2, name: "Real-Time Streaming & WebSockets", description: "High-frequency data visualization and IoT sensor monitoring dashboards.", order: 2 },
  { id: 3, name: "AI Integration & RAG Systems", description: "Vector search, document intelligence, and LLM orchestration.", order: 3 },
];

export const getProjects = makeLoader<Project>("projects", async () => {
  const rows = await db.select().from(projects).orderBy(asc(projects.order), desc(projects.stars));
  return rows.length > 0 ? rows.map(mapProject) : defaultProjects;
});

export const getExperiences = makeLoader("experiences", async () => {
  const rows = await db.select().from(experiences).orderBy(desc(experiences.startDate));
  return (rows.length > 0 ? rows : defaultExperiences) as any;
});

export const getEducation = makeLoader("education", async () => {
  const rows = await db.select().from(education).orderBy(asc(education.order));
  return (rows.length > 0 ? rows : defaultEducation) as any;
});

export const getAchievements = makeLoader("achievements", async () => {
  const rows = await db.select().from(achievements).orderBy(asc(achievements.order));
  return (rows.length > 0 ? rows : defaultAchievements) as any;
});

export const getInterests = makeLoader("interests", async () => {
  const rows = await db.select().from(interests).orderBy(asc(interests.order));
  return (rows.length > 0 ? rows : defaultInterests) as any;
});

export const getPublications = makeLoader("publications", async () => {
  return db.select().from(publications).orderBy(desc(publications.date));
});

export const getSkills = makeLoader("skills", async () => {
  const rows = await db.select().from(skills).orderBy(asc(skills.order));
  return (rows.length > 0 ? rows : defaultSkills) as any;
});

export const getUses = makeLoader("uses", async () => {
  return db.select().from(uses).orderBy(asc(uses.order));
});

export const getCategories = makeLoader("categories", async () => {
  return db.select().from(projectCategories).orderBy(asc(projectCategories.order));
});

export const getTestimonials = makeLoader("testimonials", async () => {
  return db.select().from(testimonials).orderBy(asc(testimonials.order));
});

export const getHeroMetrics = makeLoader("hero_metrics", async () => {
  return db.select().from(heroMetrics).orderBy(asc(heroMetrics.order));
});

export const getLanguages = makeLoader("languages", async () => {
  return db.select().from(languages).orderBy(asc(languages.order));
});

export const getCertifications = makeLoader("certifications", async () => {
  return db.select().from(certifications).orderBy(asc(certifications.order));
});

export const getGalleryPhotos = makeLoader("gallery_photos", async () => {
  return db.select().from(galleryPhotos).orderBy(asc(galleryPhotos.order));
});

export const getBooks = makeLoader("books", async () => {
  return db.select().from(books).orderBy(asc(books.order));
});

export const getWorkshopProjects = makeLoader("workshop_projects", async () => {
  return db.select().from(workshopProjects).orderBy(asc(workshopProjects.order));
});

// Reset all in-process loader caches — called after admin mutations so
// content changes (create/edit/delete) are visible immediately.
export function clearLoaderCaches() {
  for (const c of loaderCaches) c.clear();
}

export function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function projectUrl(p: { slug?: string | null; name: string }): string {
  return `/projects/${p.slug || slugify(p.name)}/`;
}

export function formatDate(s?: string | null, fallback = "Present"): string {
  if (!s) return fallback;
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function parseList(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  const str = String(val);
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  // Fallback: pipe- or newline-separated plain text (admin-friendly input)
  return str.split(/\||\n/).map((l) => l.trim()).filter(Boolean);
}
