// Dynamic configuration loader: DB → .env → empty string
import {
  db,
  siteSettings,
  socialLinks,
  navigationItems,
  experiences,
  projects,
  achievements,
  skills,
  bioContent,
  testimonials,
  heroMetrics,
} from "../db";
import { env } from "./env";
import { getCachedData, setCachedData, deleteKey, deletePattern } from "./redis";

export interface DynamicSiteConfig {
  name: string;
  description: string;
  url: string;
  cvUrl?: string;
  author: string;
  email: string;
  emails: Array<{ address: string; href: string }>;
  location: string;
  timezone: string;
  profileImage: string;

  sidebarTagline: string;
  footerTagline: string;
  contactBlurb: string;
  usesPhilosophy: string;
  blogUrl: string;
  aboutCtaTitle: string;

  noticePeriod: string;
  workAuthorization: string;
  relocationTargets: string;
  englishLevel: string;
  meetingUrl: string;
  availabilityHours: string;

  seo: {
    author: string;
    title: string;
    keywords: string[];
    worksFor: {
      name: string;
      url: string;
    };
    location: {
      city: string;
      country: string;
    };
  };

  links: {
    github: string;
    linkedin: string;
    twitter: string;
    youtube?: string;
    [key: string]: string | undefined;
  };

  navItems: Array<{ label: string; href: string; external?: boolean }>;
  creativeNavItems?: Array<{ label: string; href: string; external?: boolean }>;
  navMenuItems: Array<{ label: string; href: string; external?: boolean }>;
  socials: Array<{ name: string; url: string; icon: string; footer?: boolean }>;
  experience: Array<{
    company: string;
    role: string;
    url: string;
    logoUrl?: string;
    startDate: string;
    endDate?: string;
    details?: string;
  }>;
  featuredProjects: Array<{
    name: string;
    description: string;
    url: string;
    github?: string;
    image?: string;
    tags: string[];
    featured?: boolean;
    stars?: number;
  }>;
  achievements: Array<{ name: string; icon: string; description: string }>;
  skills: Array<{ name: string; category?: string; description?: string }>;
  testimonials: Array<{ quote: string; name: string; role: string }>;
  heroMetrics: Array<{ label: string; value: string; sub: string }>;

  highlights: string[];
  languages: string;

  bio: {
    focusLabel: string;
    short: string;
    long: string;
    intro: string;
    story: string;
    quote: string;
    funFact: string;
    researchStatement: string;
    roleInterests?: string;
    summary?: string;
    currentFocus?: string;
    currentlyBuilding?: string;
    seeking?: string;
    availability?: string;
  };
}

// Cache for config
let cachedConfig: DynamicSiteConfig | null = null;
let cacheTimestamp: number = 0;
let inFlightPromise: Promise<DynamicSiteConfig> | null = null;
const CACHE_TTL = 300 * 1000; // 5 minute in-memory cache

const DEFAULT_SHORT_BIO = "Jr. Full-Stack Developer with 2+ years of experience building modern web applications, real-time IoT dashboards, and scalable APIs.";
const DEFAULT_FOCUS_LABEL = "Jr. Full-Stack Developer";
const DEFAULT_RESEARCH_STATEMENT = "Focused on modern frontend performance optimization, scalable micro-backends, and real-time streaming architectures.";

const defaultSocials = [
  { name: 'GitHub', url: 'https://github.com/razikuljoni', icon: 'github', footer: true },
  { name: 'LinkedIn', url: 'https://linkedin.com/in/razikuljoni', icon: 'linkedin', footer: true },
  { name: 'Email', url: 'mailto:razikuljoni@gmail.com', icon: 'email', footer: true },
];

const defaultExperiences = [
  {
    company: "HawkEyes Digital Monitoring Ltd.",
    role: "Junior Frontend Developer",
    url: "https://hawkeyesbd.com",
    startDate: "2024-02-01",
    endDate: "2026-04-01",
    details: "Built interactive IoT monitoring dashboards, optimized map rendering for 10,000+ real-time markers, and implemented responsive React components.",
  },
];

const defaultFeaturedProjects = [
  {
    name: "SensorGrid",
    description: "Real-Time IoT Dashboard for monitoring 10,000+ connected sensors with sub-second WebSocket updates and geospatial mapping.",
    url: "https://github.com/razikuljoni/sensorgrid",
    github: "https://github.com/razikuljoni/sensorgrid",
    image: undefined,
    tags: ["React", "TypeScript", "WebSocket", "Tailwind CSS"],
    featured: true,
    stars: 12,
  },
  {
    name: "Z Shop",
    description: "AI-Powered E-Commerce Platform featuring personalized recommendations, dynamic pricing, and seamless checkout.",
    url: "https://github.com/razikuljoni/z-shop",
    github: "https://github.com/razikuljoni/z-shop",
    image: undefined,
    tags: ["Next.js", "Node.js", "PostgreSQL", "Prisma"],
    featured: true,
    stars: 8,
  },
  {
    name: "InsightDoc",
    description: "Enterprise RAG Platform for PDF Analytics with semantic vector search and automated document summarization.",
    url: "https://github.com/razikuljoni/insightdoc",
    github: "https://github.com/razikuljoni/insightdoc",
    image: undefined,
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Python"],
    featured: true,
    stars: 15,
  },
];

const defaultAchievements = [
  { name: "Real-Time IoT Dashboard", icon: "zap", description: "Engineered real-time map & chart data stream handling 10,000+ live IoT devices." },
  { name: "Enterprise RAG Search", icon: "search", description: "Implemented vector semantic search over PDF documents using Next.js & PostgreSQL." },
  { name: "2,000+ GitHub Contributions", icon: "github", description: "Maintained active open-source contribution record across full-stack repositories." },
];

const defaultSkills = [
  { name: "Next.js", category: "framework", description: "React Framework for Production" },
  { name: "React", category: "framework", description: "UI Library" },
  { name: "TypeScript", category: "language", description: "Typed JavaScript" },
  { name: "Node.js", category: "framework", description: "JavaScript Runtime" },
  { name: "Express.js", category: "framework", description: "Web Framework" },
  { name: "PostgreSQL", category: "database", description: "Relational Database" },
  { name: "MongoDB", category: "database", description: "NoSQL Database" },
  { name: "Tailwind CSS", category: "framework", description: "Utility-first CSS" },
  { name: "Docker", category: "devops", description: "Containerization" },
  { name: "Zod", category: "general", description: "Schema Validation" },
];

const defaultHeroMetrics = [
  { label: "Experience", value: "2+ Yrs", sub: "Web Development" },
  { label: "Projects", value: "15+", sub: "Completed & Deployed" },
  { label: "Contributions", value: "2,000+", sub: "GitHub Commits" },
];

const defaultBioObj = {
  focusLabel: DEFAULT_FOCUS_LABEL,
  short: DEFAULT_SHORT_BIO,
  long: "Junior Full-Stack Developer specializing in Next.js, React, Node.js, Express, and PostgreSQL. Experienced in crafting high-performance dashboards, real-time WebSocket interfaces, and clean component architectures.",
  intro: "Hi, I'm MD Razikul Islam Joni. I build web applications and digital experiences.",
  story: "Passionate about full-stack engineering, clean code, and building products that solve real-world problems. Graduated with a B.Sc. in CSE from Green University of Bangladesh.",
  quote: "First, solve the problem. Then, write the code.",
  funFact: "Enthusiastic about open-source tools, system design, and building real-time interactive apps.",
  researchStatement: DEFAULT_RESEARCH_STATEMENT,
  roleInterests: "Full-Stack Developer, Frontend Engineer (React/Next.js), Backend Developer (Node.js/Express)",
  summary: "Jr. Full-Stack Developer based in Dhaka, Bangladesh.",
  currentFocus: "Next.js 15, React 19, TypeScript, PostgreSQL & Micro-backends",
  currentlyBuilding: "Full-stack portfolio and real-time dashboard components",
  seeking: "Full-Time Full-Stack or Frontend Developer roles (Local Dhaka or Remote)",
  availability: "Available immediately",
};

/**
 * Split "Dhaka, Bangladesh" → { city: "Dhaka", country: "Bangladesh" }
 */
function parseLocation(raw: string): { city: string; country: string } {
  if (!raw) return { city: "", country: "" };
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  return {
    city: parts[0] || "",
    country: parts.slice(1).join(", ") || "",
  };
}

/**
 * All contact inboxes: the primary address first, then alternates.
 * Every entry opens a compose to the primary inbox so mail lands in one place.
 */
function buildEmails(primary: string, ...alts: Array<string | undefined>): Array<{ address: string; href: string }> {
  const seen = new Set<string>();
  const out: Array<{ address: string; href: string }> = [];
  for (const address of [primary, ...alts]) {
    const a = (address || "").trim();
    if (!a || seen.has(a.toLowerCase())) continue;
    seen.add(a.toLowerCase());
    out.push({ address: a, href: `mailto:${primary.trim() || a}` });
  }
  return out;
}

export async function getDynamicConfig(): Promise<DynamicSiteConfig> {
  // L1: In-memory cache (instant)
  if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedConfig;
  }

  // Deduplicate concurrent calls during cache miss (thundering herd prevention)
  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      return await fetchDynamicConfig();
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}

async function fetchDynamicConfig(): Promise<DynamicSiteConfig> {
  // Double-check L1 in case another promise set it
  if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedConfig;
  }

  // L2: Upstash write-through cache — read is bypassed for speed; the DB
  // (same region) is the fast path and the in-process cache covers repeats.
  const upstashKey = "site:config";

  /**
   * Run a single DB query and silently fall back to an empty array on failure.
   * A missing or renamed table should never break the whole config — we just
   * lose that one slice and keep the rest. The outer try/catch is the
   * last-resort fallback to .env defaults.
   */
  async function safeSelect<T>(label: string, q: Promise<T[]>): Promise<T[]> {
    try {
      return await q;
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        const msg = e instanceof Error ? e.message : String(e);
        if (/no such table/i.test(msg)) {
          console.warn(`[config] table missing for "${label}", using empty fallback`);
        } else {
          console.warn(`[config] "${label}" query failed:`, msg);
        }
      }
      return [];
    }
  }

  try {
    // Fetch all data from database in parallel. Each query is independently
    // guarded so one missing table doesn't kill the whole batch.
    const [
      settingsData,
      socialsData,
      navData,
      experiencesData,
      projectsData,
      achievementsData,
      skillsData,
      bioData,
      testimonialsData,
      heroMetricsData,
    ] = await Promise.all([
      safeSelect("siteSettings", db.select().from(siteSettings)),
      safeSelect("socialLinks", db.select().from(socialLinks).orderBy(socialLinks.order)),
      safeSelect("navigationItems", db.select().from(navigationItems).orderBy(navigationItems.order)),
      safeSelect("experiences", db.select().from(experiences).orderBy(experiences.order)),
      safeSelect("projects", db.select().from(projects).orderBy(projects.order)),
      safeSelect("achievements", db.select().from(achievements).orderBy(achievements.order)),
      safeSelect("skills", db.select().from(skills).orderBy(skills.order)),
      safeSelect("bioContent", db.select().from(bioContent)),
      safeSelect("testimonials", db.select().from(testimonials).orderBy(testimonials.order)),
      safeSelect("heroMetrics", db.select().from(heroMetrics).orderBy(heroMetrics.order)),
    ]);

    // Convert settings to object
    const settings: Record<string, string> = {};
    settingsData.forEach((s: any) => {
      settings[s.key] = s.value;
    });

    // Safe JSON parse — one malformed row must never break the site config
    const safeParse = (raw: string | null | undefined, fallback: unknown) => {
      if (!raw) return fallback;
      try { return JSON.parse(raw); } catch { return fallback; }
    };

    // Convert bio to object
    const bio: Record<string, string> = {};
    bioData.forEach((b: any) => {
      bio[b.key] = b.value;
    });

    const cleanValue = (value?: string) => value?.trim() || "";
    const shortBio = cleanValue(bio.short) || DEFAULT_SHORT_BIO;
    const focusLabel = cleanValue(bio.focusLabel) || DEFAULT_FOCUS_LABEL;
    const researchStatement =
      cleanValue(bio.researchStatement) ||
      cleanValue(bio.roleInterests) ||
      shortBio;

    // Parse keywords
    const keywords = settings.seo_keywords
      ? settings.seo_keywords.split(",").map((k) => k.trim())
      : [];

    // Build config — DB first, .env as fallback, empty string last
    const config: DynamicSiteConfig = {
      name: settings.site_name || env.siteName,
      description: settings.site_description || env.siteDescription,
      url: settings.site_url || env.siteUrl,
      cvUrl: settings.cv_url || "",
      author: settings.author || env.siteName,
      email: settings.email || env.email,
      emails: buildEmails(settings.email || env.email, settings.email_alt_1, settings.email_alt_2),
      location: settings.location || env.location,
      timezone: settings.timezone || env.timezone,
      profileImage: cleanValue(settings.profile_image) || "/profile.webp",
      sidebarTagline: cleanValue(settings.sidebar_tagline) || "Jr. Full-Stack Developer building modern web applications & real-time dashboards.",
      footerTagline: cleanValue(settings.footer_tagline) || "Built with Astro, React & Tailwind CSS v4.",
      contactBlurb: cleanValue(settings.contact_blurb) || "Email or message me for opportunities in full-stack web development, React/Next.js frontend, or Node.js backend projects.",
      usesPhilosophy: cleanValue(settings.uses_philosophy) || "Clean component architecture, type-safety with TypeScript, modern database ORMs, and lightweight reactive state.",
      blogUrl: cleanValue(settings.blog_url),
      aboutCtaTitle: cleanValue(settings.about_cta_title) || "Let's build something useful",
      noticePeriod: cleanValue(settings.notice_period) || "Immediate / 15 days",
      workAuthorization: cleanValue(settings.work_authorization) || "Open to local (Dhaka) and remote full-stack roles",
      relocationTargets: cleanValue(settings.relocation_targets) || "Dhaka · Remote Worldwide",
      englishLevel: cleanValue(settings.english_level) || "English (Professional Working Proficiency)",
      meetingUrl: cleanValue(settings.meeting_url) || "https://linkedin.com/in/razikuljoni",
      availabilityHours: cleanValue(settings.availability_hours) || "Available Sunday to Thursday daily",

      seo: {
        author: settings.author || env.siteName,
        title: settings.seo_title || "",
        keywords,
        worksFor: {
          name: settings.works_for_name || "",
          url: settings.works_for_url || "",
        },
        location: parseLocation(settings.location || env.location),
      },

      links: {
        github: socialsData.find((s) => s.icon === "github")?.url || env.github,
        linkedin: socialsData.find((s) => s.icon === "linkedin")?.url || env.linkedin,
        twitter: socialsData.find((s) => s.icon === "twitter")?.url || env.twitter,
        youtube: socialsData.find((s) => s.icon === "youtube")?.url || env.youtube,
        email: `mailto:${settings.email || env.email}`,
      },

      navItems:
        navData.length > 0 && navData.some((n) => n.location === "header" || n.location === "both")
          ? navData
              .filter((n) => n.location === "header" || n.location === "both")
              .map((n) => ({
                label: n.label,
                href: n.href,
                external: n.external || false,
              }))
          : [
              { label: "Home", href: "/" },
              { label: "About", href: "/about" },
              { label: "Experience", href: "/experience" },
              { label: "Skills", href: "/skills" },
              { label: "Projects", href: "/projects" },
              { label: "Achievements", href: "/achievements" },
              { label: "Research", href: "/research" },
              { label: "Writing", href: "/posts" },
              { label: "Contact", href: "/contact" },
            ],

      creativeNavItems:
        navData.length > 0 && navData.some((n) => n.location === "creative")
          ? navData
              .filter((n) => n.location === "creative")
              .map((n) => ({
                label: n.label,
                href: n.href,
                external: n.external || false,
              }))
          : [
              { label: "Explore", href: "/explore" },
              { label: "The Workshop", href: "/workshop" },
            ],

      navMenuItems:
        navData.length > 0
          ? navData
              .filter((n) => n.location === "menu" || n.location === "both")
              .map((n) => ({
                label: n.label,
                href: n.href,
                external: n.external || false,
              }))
          : [],

      socials:
        socialsData.length > 0
          ? socialsData.map((s) => ({
              name: s.name,
              url: s.url,
              icon: s.icon,
              footer: s.footer || false,
            }))
          : defaultSocials,

      experience:
        experiencesData.length > 0
          ? experiencesData.map((e) => ({
              company: e.company,
              role: e.role,
              url: e.url,
              logoUrl: e.logoUrl || undefined,
              startDate: e.startDate,
              endDate: e.endDate || undefined,
              details: e.details || undefined,
            }))
          : defaultExperiences,

      featuredProjects:
        projectsData.length > 0
          ? projectsData
              .filter((p) => p.featured)
              .map((p) => ({
                name: p.name,
                description: p.description,
                url: p.url,
                github: p.github || undefined,
                image: p.image || undefined,
                tags: safeParse(p.tags, []),
                featured: p.featured || false,
                stars: p.stars || 0,
              }))
          : defaultFeaturedProjects,

      achievements:
        achievementsData.length > 0
          ? achievementsData.map((a) => ({
              name: a.name,
              icon: a.icon,
              description: a.description,
            }))
          : defaultAchievements,

      skills: skillsData.length > 0 ? skillsData.map((s) => ({ name: s.name, category: s.category || undefined, description: s.description || undefined })) : defaultSkills,

      testimonials: testimonialsData.length > 0
        ? testimonialsData.map((t) => ({ quote: t.quote, name: t.name, role: t.role }))
        : [],
      heroMetrics: heroMetricsData.length > 0
        ? heroMetricsData.map((m) => ({ label: m.label, value: m.value, sub: m.sub }))
        : defaultHeroMetrics,

      highlights: settings.highlights
        ? settings.highlights.split(",").map((h: string) => h.trim()).filter(Boolean)
        : ["Next.js & React 19", "Node.js & Express", "PostgreSQL & Drizzle ORM", "TypeScript", "Tailwind CSS v4"],
      languages: settings.languages || "Bangla (Native), English (Professional)",

      bio: {
        focusLabel: focusLabel || defaultBioObj.focusLabel,
        short: shortBio || defaultBioObj.short,
        long: bio.long || defaultBioObj.long,
        intro: bio.intro || defaultBioObj.intro,
        story: bio.story || defaultBioObj.story,
        quote: bio.quote || defaultBioObj.quote,
        funFact: bio.funFact || defaultBioObj.funFact,
        researchStatement: researchStatement || defaultBioObj.researchStatement,
        roleInterests: cleanValue(bio.roleInterests) || defaultBioObj.roleInterests,
        summary: cleanValue(bio.summary) || defaultBioObj.summary,
        currentFocus: cleanValue(bio.currentFocus) || defaultBioObj.currentFocus,
        currentlyBuilding: cleanValue(bio.currentlyBuilding) || defaultBioObj.currentlyBuilding,
        seeking: cleanValue(bio.seeking) || defaultBioObj.seeking,
        availability: cleanValue(bio.availability) || defaultBioObj.availability,
      },
    };

    // Update caches (in-process + write-through to Upstash)
    cachedConfig = config;
    cacheTimestamp = Date.now();
    setCachedData(upstashKey, config, 600).catch(() => {});

    return config;
  } catch (error) {
    console.error(
      "Error loading dynamic config, falling back to static:",
      error,
    );

    // Return safe defaults from .env (DB is the source of truth but env is the bootstrap fallback)
    return {
      name: env.siteName,
      description: env.siteDescription,
      url: env.siteUrl,
      cvUrl: "",
      author: env.siteName,
      email: env.email,
      emails: buildEmails(env.email),
      location: env.location,
      timezone: env.timezone,
      profileImage: "/profile.webp",
      sidebarTagline: "Jr. Full-Stack Developer building modern web applications & real-time dashboards.",
      footerTagline: "Built with Astro, React & Tailwind CSS v4.",
      contactBlurb: "Email or message me for opportunities in full-stack web development, React/Next.js frontend, or Node.js backend projects.",
      usesPhilosophy: "Clean component architecture, type-safety with TypeScript, modern database ORMs, and lightweight reactive state.",
      blogUrl: "",
      aboutCtaTitle: "Let's build something useful",
      noticePeriod: "Immediate / 15 days",
      workAuthorization: "Open to local (Dhaka) and remote full-stack roles",
      relocationTargets: "Dhaka · Remote Worldwide",
      englishLevel: "English (Professional Working Proficiency)",
      meetingUrl: "https://linkedin.com/in/razikuljoni",
      availabilityHours: "Available Sunday to Thursday daily",
      seo: {
        author: env.siteName,
        title: "",
        keywords: [],
        worksFor: { name: "HawkEyes Digital Monitoring Ltd.", url: "https://hawkeyesbd.com" },
        location: parseLocation(env.location),
      },
      links: {
        github: env.github,
        linkedin: env.linkedin,
        twitter: env.twitter,
        youtube: env.youtube,
        email: `mailto:${env.email}`,
      },
      navItems: [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Experience", href: "/experience" },
        { label: "Skills", href: "/skills" },
        { label: "Projects", href: "/projects" },
        { label: "Achievements", href: "/achievements" },
        { label: "Research", href: "/research" },
        { label: "Writing", href: "/posts" },
        { label: "Contact", href: "/contact" },
      ],
      navMenuItems: [],
      socials: defaultSocials,
      experience: defaultExperiences,
      featuredProjects: defaultFeaturedProjects,
      achievements: defaultAchievements,
      skills: defaultSkills,
      testimonials: [],
      heroMetrics: defaultHeroMetrics,
      highlights: ["Next.js & React 19", "Node.js & Express", "PostgreSQL & Drizzle ORM", "TypeScript", "Tailwind CSS v4"],
      languages: "Bangla (Native), English (Professional)",
      bio: defaultBioObj,
    };
  }
}

// Clear cache (useful after admin updates)
export function clearConfigCache() {
  cachedConfig = null;
  cacheTimestamp = 0;
  inFlightPromise = null;
}

export async function purgeSiteCaches() {
  clearConfigCache();
  try {
    const { clearLoaderCaches } = await import("./loaders");
    clearLoaderCaches();
    await deleteKey("site:config");
    await deletePattern("home:*");
    await deleteKey("projects:all");
    await deletePattern("project:*");
    // versioned loader keys
    await deletePattern("v2:*");
  } catch (e) {
    console.error("Error purging site caches:", e);
  }
}


