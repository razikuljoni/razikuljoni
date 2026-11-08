import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config();
}
import {
  siteSettings,
  socialLinks,
  navigationItems,
  experiences,
  projects,
  achievements,
  skills,
  bioContent,
  seoSettings,
  education,
  publications,
  interests,
  pageViews,
  supportOptions,
  testimonials,
  heroMetrics,
  projectCategories,
  uses,
  certifications,
  faqs,
  languages,
  galleryPhotos,
  books,
  workshopProjects,
} from './schema';

import { defaultPhotosList } from '../lib/photos';

// Create client - support local SQLite file for development
const dbUrl = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN || '';

const client = createClient({
  url: dbUrl,
  authToken: authToken,
});

const db = drizzle(client);

// ── Safety guard ────────────────────────────────────────────────────────────
const isRemote = !dbUrl.startsWith('file:');
if (isRemote && !process.argv.includes('--force')) {
  const existing = await db.select().from(projects).limit(1).catch(() => []);
  if (existing.length > 0) {
    console.error(
      '🚫 Refusing to seed: remote database has data.\n' +
      '   Run: pnpm run db:seed --force to override.'
    );
    process.exit(1);
  }
}

async function seed() {
  console.log('🌱 Starting database seed for MD Razikul Islam Joni...\n');

  const now = new Date().toISOString();

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await db.delete(education);
    await db.delete(publications);
    await db.delete(interests);
    await db.delete(achievements);
    await db.delete(skills);
    await db.delete(projects);
    await db.delete(experiences);
    await db.delete(navigationItems);
    await db.delete(socialLinks);
    await db.delete(siteSettings);
    await db.delete(bioContent);
    await db.delete(seoSettings);
    await db.delete(testimonials);
    await db.delete(heroMetrics);
    await db.delete(projectCategories);
    await db.delete(uses);
    await db.delete(certifications);
    await db.delete(faqs);
    await db.delete(languages);
    console.log('  ✅ Data cleared');

    // 1. Site Settings
    console.log('📝 Seeding site settings...');
    const settingsData = [
      { key: 'site_name', value: 'MD Razikul Islam Joni' },
      { key: 'site_description', value: 'Product-minded full-stack developer in Dhaka building enterprise dashboards, scalable Node.js and PostgreSQL APIs, and polished React and Next.js experiences.' },
      { key: 'site_url', value: 'https://razikuljoni.vercel.app' },
      { key: 'author', value: 'MD Razikul Islam Joni' },
      { key: 'email', value: 'razikuljoni@gmail.com' },
      { key: 'location', value: 'Dhaka, Bangladesh' },
      { key: 'timezone', value: 'Asia/Dhaka' },
      { key: 'seo_title', value: 'MD Razikul Islam Joni | Jr. Full-Stack Developer' },
      { key: 'seo_keywords', value: 'Next.js, React, TypeScript, Node.js, Express, NestJS, PostgreSQL, MongoDB, Full-Stack Developer, Dhaka' },
      { key: 'works_for_name', value: 'HawkEyes Digital Monitoring Ltd.' },
      { key: 'works_for_url', value: 'https://hawkeyesbd.com' },
      { key: 'github_update_secret', value: process.env.CRON_SECRET || 'secret_key_change_me' },
      { key: 'profile_image', value: '/profile.webp' },
      { key: 'sidebar_tagline', value: 'Product-minded full-stack developer building enterprise dashboards & APIs.' },
      { key: 'footer_tagline', value: 'I build the quiet systems behind busy products.' },
      { key: 'contact_blurb', value: "Bring the complexity. I'll bring the clarity. Email or schedule a 15-minute call for opportunities in full-stack web development, React/Next.js frontend, or Node.js backend systems." },
      { key: 'uses_philosophy', value: 'Clean component architecture, type-safety with TypeScript, modern database ORMs, and lightweight reactive state.' },
      { key: 'notice_period', value: 'Immediate / 15 days' },
      { key: 'work_authorization', value: 'Open to local (Dhaka) and remote full-stack roles' },
      { key: 'relocation_targets', value: 'Dhaka · Remote Worldwide' },
      { key: 'english_level', value: 'English (Professional Working Proficiency)' },
      { key: 'meeting_url', value: 'https://cal.com/razikuljoni/15min' },
      { key: 'availability_hours', value: 'Available Sunday to Thursday daily' },
    ];

    for (const setting of settingsData) {
      await db.insert(siteSettings).values({
        ...setting,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing();
    }
    console.log(`  ✅ Inserted ${settingsData.length} settings`);

    // 2. Social Links
    console.log('🔗 Seeding social links...');
    const socialsList = [
      { name: 'GitHub', url: 'https://github.com/razikuljoni', icon: 'github', footer: true },
      { name: 'LinkedIn', url: 'https://linkedin.com/in/razikuljoni', icon: 'linkedin', footer: true },
      { name: 'Email', url: 'mailto:razikuljoni@gmail.com', icon: 'email', footer: true },
    ];
    for (let i = 0; i < socialsList.length; i++) {
      const social = socialsList[i];
      await db.insert(socialLinks).values({
        name: social.name,
        url: social.url,
        icon: social.icon,
        footer: social.footer,
        order: i,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 3. Navigation Items
    console.log('🧭 Seeding navigation items...');
    const headerNav = [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Experience', href: '/experience' },
      { label: 'Skills', href: '/skills' },
      { label: 'Projects', href: '/projects' },
      { label: 'Achievements', href: '/achievements' },
      { label: 'Contact', href: '/contact' },
    ];
    for (let i = 0; i < headerNav.length; i++) {
      await db.insert(navigationItems).values({
        label: headerNav[i].label,
        href: headerNav[i].href,
        external: false,
        location: 'header',
        order: i + 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 4. Experiences
    console.log('💼 Seeding experiences...');
    const experienceData = [
      {
        company: 'HawkEyes Digital Monitoring Ltd.',
        role: 'Jr. Frontend Developer',
        url: 'https://hawkeyesbd.com',
        companyDescription: 'Operational Monitoring & IoT Systems',
        startDate: '2024-02-01',
        endDate: '2026-04-01',
        details: 'Built the operational surfaces behind real business monitoring—where a small UI mistake can become a very large workflow problem. Architected and delivered responsive, high-performance web applications using React.js, Next.js, and TypeScript, translating complex Figma designs into accessible, pixel-perfect UI/UX interfaces.',
        responsibilities: JSON.stringify([
          'Operational products: Responsive enterprise dashboards, inventory systems, product tracking, reporting, and real-time field-work assignment interfaces.',
          'Data architecture: REST API integration, JWT and role-based access, reusable query flows, Redux Toolkit, and RTK Query for complex application state.',
          'Cross-team delivery: Partnered with backend engineers on API contracts, frontend data models, edge cases, Git workflows, and Vercel-based delivery.',
          'Quality work: Improved responsiveness, accessibility, maintainability, and performance across data-intensive interfaces and multiple viewports.',
        ]),
        learnings: 'React.js, Redux Toolkit, RTK Query, Ant Design, Charts, Google Maps, GitHub Actions, Vercel',
        order: 0,
      }
    ];
    for (const exp of experienceData) {
      await db.insert(experiences).values({
        ...exp,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 5. Projects
    console.log('📁 Seeding projects...');
    const projectsList = [
      {
        name: 'Circuit-Retail-ERP',
        slug: 'circuit-retail-erp',
        description: 'Production-ready retail operations suite — POS invoicing, inventory & stock ledger, expenses, and a live daily sales dashboard. Built for Dhaka-time retail.',
        url: 'https://circuit-retail-erp.vercel.app',
        demoUrl: 'https://circuit-retail-erp.vercel.app',
        github: 'https://github.com/razikuljoni/Circuit-Retail-ERP',
        image: null,
        tags: JSON.stringify(['Next.js', 'React', 'TypeScript', 'Prisma', 'SQLite', 'Tailwind CSS']),
        category: 'web',
        featured: true,
        stars: 0,
        order: 0,
      },
      {
        name: 'SensorGrid',
        slug: 'sensorgrid',
        description: 'Production-grade IoT platform to connect physical devices, observe realtime sensor telemetry, control hardware remotely, and build visual automation workflows.',
        url: 'https://sensor-grid-gamma.vercel.app',
        demoUrl: 'https://sensor-grid-gamma.vercel.app',
        github: 'https://github.com/razikuljoni/SensorGrid',
        image: null,
        tags: JSON.stringify(['Next.js 16', 'React 19', 'TypeScript', 'React Flow', 'Socket.io', 'Prisma', 'PostgreSQL']),
        category: 'realtime-iot',
        featured: true,
        stars: 12,
        order: 1,
      },
      {
        name: 'Z Shop',
        slug: 'z-shop',
        description: 'Full-stack Amazon-scale e-commerce platform with real-time inventory, live order tracking, customer analytics, and an integrated Gemini AI Shopping Advisor.',
        url: 'https://z-shop-online.vercel.app',
        demoUrl: 'https://z-shop-online.vercel.app',
        github: 'https://github.com/razikuljoni/z-shop',
        image: null,
        tags: JSON.stringify(['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS 4', 'Gemini AI', 'Recharts', 'Zod']),
        category: 'web',
        featured: true,
        stars: 18,
        order: 2,
      },
      {
        name: 'InsightDoc',
        slug: 'insightdoc',
        description: 'Autonomous RAG platform to ingest dense PDFs, interrogate them with streamed citation-grounded answers, and deep-link directly to source pages.',
        url: 'https://insightdoc-nine.vercel.app',
        demoUrl: 'https://insightdoc-nine.vercel.app',
        github: 'https://github.com/razikuljoni/insightdoc',
        image: null,
        tags: JSON.stringify(['Next.js 16', 'React 19', 'TypeScript', 'RAG / Embeddings', 'Prisma', 'Tailwind CSS']),
        category: 'ai-rag',
        featured: true,
        stars: 25,
        order: 3,
      },
      {
        name: 'Nexora POS',
        slug: 'nexora-pos',
        description: 'Enterprise-grade, offline-first Point of Sale and predictive inventory management system built for high-throughput retail.',
        url: 'https://nexora-pos-tau.vercel.app',
        demoUrl: 'https://nexora-pos-tau.vercel.app',
        github: 'https://github.com/razikuljoni/nexora-pos',
        image: null,
        tags: JSON.stringify(['Next.js', 'TypeScript', 'React', 'Tailwind CSS', 'Zustand']),
        category: 'web',
        featured: true,
        stars: 0,
        order: 4,
      },
      {
        name: 'Chronos Luxe 3D',
        slug: 'chronos-3d',
        description: 'WebGL luxury smartwatch experience featuring procedural 3D watch rendering, sapphire glass reflections, and 5-stage scroll choreography.',
        url: 'https://chronos-3d-gamma.vercel.app',
        demoUrl: 'https://chronos-3d-gamma.vercel.app',
        github: 'https://github.com/razikuljoni/chronos-3d',
        image: null,
        tags: JSON.stringify(['Three.js', 'WebGL', 'TypeScript', 'React', 'Tailwind CSS']),
        category: 'web',
        featured: true,
        stars: 0,
        order: 5,
      },
      {
        name: 'OpenPalette',
        slug: 'openpalette',
        description: 'Complete VS Code customization suite shipping 11 dark themes, 300+ file icons, 90+ folder icons, and language snippets.',
        url: 'https://github.com/razikuljoni/OpenPalette',
        demoUrl: 'https://marketplace.visualstudio.com',
        github: 'https://github.com/razikuljoni/OpenPalette',
        image: null,
        tags: JSON.stringify(['TypeScript', 'VS Code API', 'GitHub Actions', 'Standard Version']),
        category: 'tools',
        featured: false,
        stars: 5,
        order: 6,
      },
      {
        name: 'IgnoreGen',
        slug: 'ignoregen',
        description: 'Fast, customizable, and AI-powered .gitignore generator supporting 120+ stacks, frameworks, operating systems, and IDEs.',
        url: 'https://ignoregen.vercel.app',
        demoUrl: 'https://ignoregen.vercel.app',
        github: 'https://github.com/razikuljoni/IgnoreGen',
        image: null,
        tags: JSON.stringify(['Next.js 15', 'React 19', 'TypeScript', 'Gemini AI', 'Tailwind CSS']),
        category: 'tools',
        featured: false,
        stars: 7,
        order: 7,
      },
      {
        name: 'Shoppershala',
        slug: 'shoppershala',
        description: 'Production-minded commerce monorepo with dedicated buyer, seller, and admin workflows, wallet checkout, and in-app AI copilot.',
        url: 'https://github.com/razikuljoni/shoppershala',
        demoUrl: 'https://github.com/razikuljoni/shoppershala',
        github: 'https://github.com/razikuljoni/shoppershala',
        image: null,
        tags: JSON.stringify(['React 19', 'Express.js', 'MongoDB', 'Zod', 'Docker']),
        category: 'web',
        featured: false,
        stars: 4,
        order: 8,
      },
      {
        name: 'CoSketch',
        slug: 'cosketch',
        description: 'Collaborative realtime whiteboard treating canvas drawing as a synchronized multi-user event system with WebSockets.',
        url: 'https://github.com/razikuljoni/CoSketch',
        demoUrl: 'https://github.com/razikuljoni/CoSketch',
        github: 'https://github.com/razikuljoni/CoSketch',
        image: null,
        tags: JSON.stringify(['Next.js', 'TypeScript', 'Node.js', 'WebSockets', 'PostgreSQL']),
        category: 'realtime-iot',
        featured: false,
        stars: 6,
        order: 9,
      },
    ];
    for (const proj of projectsList) {
      await db.insert(projects).values({
        ...proj,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 6. Skills
    console.log('🛠️ Seeding skills...');
    const skillsList = [
      { name: 'TypeScript', category: 'language', description: 'Strong static typing across React, Next.js, and Node.js APIs' },
      { name: 'JavaScript (ES6+)', category: 'language', description: 'Core web scripting and asynchronous programming' },
      { name: 'React', category: 'framework', description: 'Component-driven UI development, hooks, and custom hooks' },
      { name: 'Next.js', category: 'framework', description: 'App Router, SSR, SSG, Server Actions, and API Routes' },
      { name: 'Node.js', category: 'framework', description: 'Backend server development and asynchronous microservices' },
      { name: 'Express.js', category: 'framework', description: 'RESTful API endpoints and middleware routing' },
      { name: 'NestJS', category: 'framework', description: 'Modular backend architecture with TypeScript & dependency injection' },
      { name: 'Tailwind CSS v4', category: 'framework', description: 'Utility-first modern responsive web styling' },
      { name: 'PostgreSQL', category: 'database', description: 'Relational database design, indexing, and complex SQL' },
      { name: 'MongoDB', category: 'database', description: 'NoSQL document storage, schemas, and aggregation pipelines' },
      { name: 'Prisma ORM', category: 'database', description: 'Type-safe database client and migrations' },
      { name: 'WebSockets', category: 'framework', description: 'Real-time bi-directional telemetry and notification feeds' },
      { name: 'Zustand & Redux Toolkit', category: 'framework', description: 'Client-side reactive state management' },
      { name: 'Docker', category: 'devops', description: 'Containerizing Node.js, NestJS, and frontend applications' },
      { name: 'GitHub Actions & CI/CD', category: 'devops', description: 'Automated test runners, build pipelines, release automation, and Vercel deployments' },
      { name: 'NextAuth.js', category: 'framework', description: 'Authentication, OAuth providers, and JWT session handling' },
      { name: 'Zod', category: 'language', description: 'Schema validation for API inputs and runtime environment variables' },
      { name: 'TanStack Query & RTK Query', category: 'framework', description: 'Server state management, caching, optimistic updates, and query deduplication' },
      { name: 'Ant Design', category: 'framework', description: 'Enterprise UI design system and complex data tables for administrative portals' },
      { name: 'Socket.io', category: 'framework', description: 'Real-time bidirectional event-based communication for IoT telemetry' },
      { name: 'Gemini AI', category: 'ai-ml', description: 'Integrating LLM agents, context-aware advisors, and multimodal understanding' },
    ];
    for (let i = 0; i < skillsList.length; i++) {
      await db.insert(skills).values({
        name: skillsList[i].name,
        category: skillsList[i].category,
        description: skillsList[i].description,
        order: i,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 7. Testimonials
    console.log('💬 Seeding testimonials...');
    const testimonialsData = [
      {
        quote: "Joni consistently delivers clean, responsive frontend features and real-time dashboard components. His dedication to learning new full-stack tools and solving UI performance issues is commendable.",
        name: "HawkEyes Digital Monitoring Team",
        role: "Engineering Team",
        order: 0,
      },
    ];
    for (const t of testimonialsData) {
      await db.insert(testimonials).values({
        ...t,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 8. Achievements
    console.log('🏆 Seeding achievements...');
    const achievementsData = [
      {
        name: 'Real-Time IoT Dashboard at HawkEyes',
        slug: 'hawkeyes-dashboard',
        icon: 'trophy',
        year: '2024 - 2026',
        description: 'Engineered real-time telemetry components and alert notification feeds with Next.js, WebSockets, and Zustand.',
        url: 'https://linkedin.com/in/razikuljoni',
        story: 'Built frontend features for real-time monitoring systems at HawkEyes Digital Monitoring Ltd., incorporating WebSockets for instant alert notifications and optimizing client-side performance.',
        outcome: 'Improved user response time for live monitoring alerts and enhanced dashboard usability.',
        order: 1,
      },
      {
        name: 'Enterprise RAG PDF Analytics System',
        slug: 'insightdoc-rag',
        icon: 'cpu',
        year: '2025',
        description: 'Designed and implemented InsightDoc, a full-stack RAG document intelligence platform using Next.js, NestJS, and PostgreSQL.',
        url: 'https://github.com/razikuljoni/InsightDoc',
        story: 'Architected an end-to-end PDF analytics platform leveraging vector embeddings, NestJS backend API, and containerized Docker setup.',
        outcome: 'Enabled instant Q&A over complex PDF documents with structured semantic search.',
        order: 2,
      },
      {
        name: 'B.Sc. in CSE Graduation',
        slug: 'bsc-cse-green-university',
        icon: 'award',
        year: '2020 - 2023',
        description: 'Completed Bachelor of Science in Computer Science and Engineering from Green University of Bangladesh.',
        url: 'https://linkedin.com/in/razikuljoni',
        story: 'Graduated with a strong foundation in computer science principles, software engineering, algorithms, and web applications.',
        outcome: 'Solid theoretical knowledge coupled with practical full-stack project building skills.',
        order: 3,
      },
      {
        name: 'OpenPalette VS Code Customization Suite',
        slug: 'openpalette-suite',
        icon: 'palette',
        year: '2024 - 2026',
        description: 'Engineered comprehensive VS Code suite shipping 11 dark editor themes, 300+ file icons, and 90+ folder icons.',
        url: 'https://github.com/razikuljoni/OpenPalette',
        story: 'Built and published OpenPalette for developers worldwide, crafting high-contrast theme palettes and curated iconography with automated release pipelines.',
        outcome: 'Over 390+ icons curated, 11 editor themes published, and automated GitHub Actions delivery.',
        order: 4,
      },
    ];
    for (const a of achievementsData) {
      await db.insert(achievements).values({ ...a, createdAt: now, updatedAt: now });
    }

    // 9. Hero Metrics
    console.log('📊 Seeding hero metrics...');
    const heroMetricsData = [
      { label: "Experience", value: "02+ yrs", sub: "HawkEyes Digital & Production", order: 0 },
      { label: "Repositories", value: "123", sub: "Public GitHub Repos", order: 1 },
      { label: "Themes Shipped", value: "11", sub: "OpenPalette Editor Themes", order: 2 },
      { label: "Curated Icons", value: "390+", sub: "File & Folder Icons Shipped", order: 3 },
    ];
    for (const m of heroMetricsData) {
      await db.insert(heroMetrics).values({ ...m, createdAt: now, updatedAt: now });
    }

    // 10. Bio Content
    console.log('📝 Seeding bio content...');
    const bioData = [
      { key: 'short', value: 'Product-minded full-stack developer. Two years inside real operational software taught me that the best interface is not the loudest one—it is the one that makes a complex workflow feel inevitable.' },
      { key: 'long', value: 'Product-minded full-stack developer in Dhaka building enterprise dashboards, scalable Node.js and PostgreSQL APIs, and polished React and Next.js experiences. Skilled in React 19, Next.js, TypeScript, Node.js, Express, NestJS, and modern databases.' },
      { key: 'intro', value: 'Product-minded full-stack developer' },
      { key: 'story', value: 'Two years inside real operational software taught me that the best interface is not the loudest one. It is the one that makes a complex workflow feel inevitable. I work best where data-heavy workflows, reusable interface systems, and real business constraints meet. My recent work spans enterprise dashboards, inventory and product tracking, field-work assignment, reporting, role-based access, and API-driven operations. I care about the details users feel but rarely name: immediate feedback, predictable state, useful empty screens, resilient loading behavior, keyboard access, and code another developer can safely extend.' },
      { key: 'currentFocus', value: 'Next.js 16, React 19, TypeScript, PostgreSQL, WebSockets, and RAG/AI applications.' },
      { key: 'currentlyBuilding', value: 'InsightDoc, SensorGrid, and real-time operational dashboard tools.' },
      { key: 'seeking', value: 'Full-stack roles (Onsite in Dhaka or Remote worldwide).' },
      { key: 'availability', value: 'Available for full-stack roles / Onsite or Remote' },
      { key: 'quote', value: 'A feature is not finished until the API contract, edge cases, and deployment story make sense.' },
      { key: 'funFact', value: 'Music for focus, movies for new perspectives, long walks for the reset button. Curiosity travels well between code and everything else.' },
    ];
    for (const bio of bioData) {
      await db.insert(bioContent).values({ ...bio, createdAt: now, updatedAt: now }).onConflictDoNothing();
    }

    // 11. Education
    console.log('🎓 Seeding education...');
    const educationData = [
      {
        institution: "Green University of Bangladesh",
        degree: "B.Sc. in Computer Science and Engineering",
        startDate: "2020-01-01",
        endDate: "2023-12-31",
        details: "Focused on web development, database management systems, algorithms, object-oriented programming, and software engineering.",
        order: 1,
      },
      {
        institution: "Vashantek Government College",
        degree: "Higher Secondary Certificate (HSC) · Science",
        startDate: "2018-01-01",
        endDate: "2020-01-01",
        details: "Science concentration (Physics, Chemistry, Higher Mathematics, ICT).",
        order: 2,
      },
      {
        institution: "Programming Hero",
        degree: "Web Development & Next Level Web Development",
        startDate: "2020-01-01",
        endDate: "2023-12-31",
        details: "Comprehensive full-stack development covering modern JavaScript, React, Redux, Node.js, Express, MongoDB, TypeScript, Next.js, and backend architecture.",
        order: 3,
      },
    ];
    for (const edu of educationData) {
      await db.insert(education).values({ ...edu, createdAt: now, updatedAt: now });
    }

    // 12. Project Categories
    console.log('🗂️ Seeding project categories...');
    const categoriesData = [
      { slug: 'web', label: 'Web Applications', short: 'Next.js & React Full-Stack apps', description: 'Responsive web apps, administrative dashboards, and client platforms.', order: 1 },
      { slug: 'realtime-iot', label: 'Real-Time & IoT', short: 'WebSockets & Telemetry dashboards', description: 'Real-time telemetry monitoring and live alert notification feeds.', order: 2 },
      { slug: 'ai-rag', label: 'AI & Document RAG', short: 'RAG PDF Analytics & Smart Search', description: 'Vector search, document Q&A, and AI-driven e-commerce engines.', order: 3 },
      { slug: 'tools', label: 'Developer Tools', short: 'Extensions, CLI utilities & themes', description: 'Developer productivity tools, VS Code extensions, and generator suites.', order: 4 },
    ];
    for (let i = 0; i < categoriesData.length; i++) {
      await db.insert(projectCategories).values({ ...categoriesData[i], createdAt: now, updatedAt: now }).onConflictDoNothing();
    }

    // 12b. Certifications
    console.log('📜 Seeding certifications...');
    const certificationsData = [
      {
        name: 'Web Development & Next Level Web Development (both tracks)',
        issuer: 'Programming Hero',
        year: '2023',
        url: 'https://web.programming-hero.com',
        credentialId: 'PH-NLWD-2023',
        order: 1,
      },
    ];
    for (const c of certificationsData) {
      await db.insert(certifications).values({ ...c, createdAt: now, updatedAt: now });
    }

    // 12c. Interests
    console.log('💡 Seeding interests...');
    const interestsData = [
      {
        name: 'Music for focus',
        category: 'Creative',
        description: 'Ambient, electronic, and lo-fi tracks for sustained deep work and coding flow.',
        icon: 'music',
        order: 1,
      },
      {
        name: 'Movies for new perspectives',
        category: 'Creative',
        description: 'Cinema and visual storytelling that challenge assumptions and expand design perspectives.',
        icon: 'film',
        order: 2,
      },
      {
        name: 'Long walks & open air',
        category: 'Lifestyle',
        description: 'Walking, fresh air, and new places as the reset button between complex code problems.',
        icon: 'compass',
        order: 3,
      },
      {
        name: 'Quiet systems architecture',
        category: 'Tech',
        description: 'Designing calm, robust, and predictable software where complex workflows feel inevitable.',
        icon: 'cpu',
        order: 4,
      },
    ];
    for (const item of interestsData) {
      await db.insert(interests).values({ ...item, createdAt: now, updatedAt: now });
    }

    // 13. Uses
    console.log('🧰 Seeding uses...');
    const usesData = [
      { category: 'Languages', item: 'TypeScript', order: 0 },
      { category: 'Languages', item: 'JavaScript (ES6+)', order: 1 },
      { category: 'Languages', item: 'HTML5 & CSS3', order: 2 },
      { category: 'Languages', item: 'SQL', order: 3 },
      { category: 'Frontend', item: 'Next.js', order: 0 },
      { category: 'Frontend', item: 'React', order: 1 },
      { category: 'Frontend', item: 'Tailwind CSS v4', order: 2 },
      { category: 'Frontend', item: 'Zustand / Redux', order: 3 },
      { category: 'Backend', item: 'Node.js', order: 0 },
      { category: 'Backend', item: 'Express.js', order: 1 },
      { category: 'Backend', item: 'NestJS', order: 2 },
      { category: 'Backend', item: 'WebSockets', order: 3 },
      { category: 'Databases', item: 'PostgreSQL', order: 0 },
      { category: 'Databases', item: 'MongoDB', order: 1 },
      { category: 'Databases', item: 'Prisma ORM', order: 2 },
      { category: 'DevOps & Tools', item: 'Docker', order: 0 },
      { category: 'DevOps & Tools', item: 'Git & GitHub', order: 1 },
      { category: 'DevOps & Tools', item: 'Vercel', order: 2 },
      { category: 'DevOps & Tools', item: 'Postman', order: 3 },
    ];
    for (const u of usesData) {
      await db.insert(uses).values({ ...u, createdAt: now, updatedAt: now });
    }

    // 14. FAQs
    console.log('❓ Seeding FAQs...');
    const faqsData = [
      { question: 'What roles is Razikul open to?', answer: 'Junior to Mid-Level Full-Stack Developer, Frontend Developer (React/Next.js), or Backend Developer (Node.js/NestJS) roles.', order: 1 },
      { question: 'Where is Razikul located?', answer: 'Based in Dhaka, Bangladesh. Open to both on-site roles in Dhaka and remote roles globally.', order: 2 },
      { question: 'What is your notice period?', answer: 'Immediate availability or up to 15 days.', order: 3 },
    ];
    for (const f of faqsData) {
      await db.insert(faqs).values({ ...f, createdAt: now, updatedAt: now });
    }

    // 15. Languages spoken
    console.log('🌍 Seeding languages...');
    const languagesData = [
      { name: 'Bengali', level: 'native', note: 'Native speaker', order: 1 },
      { name: 'English', level: 'working', note: 'Professional working proficiency', order: 2 },
    ];
    for (const l of languagesData) {
      await db.insert(languages).values({ ...l, createdAt: now, updatedAt: now });
    }

    console.log('\n✨ Database seeded successfully for MD Razikul Islam Joni!');
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
