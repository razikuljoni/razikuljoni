import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
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
      { key: 'site_description', value: 'Jr. Full-Stack Developer | Next.js, React, Node.js, PostgreSQL' },
      { key: 'site_url', value: 'https://razikuljoni.xyz' },
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
      { key: 'sidebar_tagline', value: 'Jr. Full-Stack Developer building modern web applications & real-time dashboards.' },
      { key: 'footer_tagline', value: 'Built with Astro, React & Tailwind CSS v4.' },
      { key: 'contact_blurb', value: 'Email or message me for opportunities in full-stack web development, React/Next.js frontend, or Node.js backend projects.' },
      { key: 'uses_philosophy', value: 'Clean component architecture, type-safety with TypeScript, modern database ORMs, and lightweight reactive state.' },
      { key: 'notice_period', value: 'Immediate / 15 days' },
      { key: 'work_authorization', value: 'Open to local (Dhaka) and remote full-stack roles' },
      { key: 'relocation_targets', value: 'Dhaka · Remote Worldwide' },
      { key: 'english_level', value: 'English (Professional Working Proficiency)' },
      { key: 'meeting_url', value: 'https://linkedin.com/in/razikuljoni' },
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
        role: 'Junior Frontend Developer',
        url: 'https://hawkeyesbd.com',
        startDate: '2024-02-01',
        endDate: '2026-04-01',
        details: 'Developed and maintained responsive dashboard features using Next.js, React, TypeScript, and Tailwind CSS. Integrated WebSockets and real-time state management (Zustand/Redux) for live telemetry and alert notifications. Built reusable UI components and optimized client-side performance.',
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
        name: 'SensorGrid',
        slug: 'sensorgrid',
        description: 'Real-Time IoT Monitoring Dashboard. Built with Next.js, TypeScript, Zustand, and WebSockets to process live telemetry streams with interactive Recharts visualizations and threshold alerts.',
        url: 'https://github.com/razikuljoni/SensorGrid',
        github: 'https://github.com/razikuljoni/SensorGrid',
        image: null,
        tags: JSON.stringify(['Next.js', 'TypeScript', 'Zustand', 'WebSockets', 'Tailwind CSS', 'Recharts']),
        featured: true,
        stars: 12,
        order: 0,
      },
      {
        name: 'Z Shop',
        slug: 'z-shop',
        description: 'AI-Powered E-Commerce Platform. Full-stack store built with Next.js, Node.js, Express, MongoDB, Prisma ORM, and NextAuth.js featuring smart search, recommendation engines, and seamless checkout.',
        url: 'https://github.com/razikuljoni/Z-Shop',
        github: 'https://github.com/razikuljoni/Z-Shop',
        image: null,
        tags: JSON.stringify(['Next.js', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'Prisma ORM', 'NextAuth.js', 'Tailwind CSS']),
        featured: true,
        stars: 18,
        order: 1,
      },
      {
        name: 'InsightDoc',
        slug: 'insightdoc',
        description: 'Enterprise RAG Platform for PDF Analytics. AI-driven document Q&A and analytics platform built with Next.js, NestJS, PostgreSQL, Prisma, Docker, and vector search capabilities.',
        url: 'https://github.com/razikuljoni/InsightDoc',
        github: 'https://github.com/razikuljoni/InsightDoc',
        image: null,
        tags: JSON.stringify(['Next.js', 'TypeScript', 'NestJS', 'PostgreSQL', 'Prisma ORM', 'Docker', 'Tailwind CSS']),
        featured: true,
        stars: 25,
        order: 2,
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
      { name: 'NextAuth.js', category: 'framework', description: 'Authentication, OAuth providers, and JWT session handling' },
      { name: 'Zod', category: 'language', description: 'Schema validation for API inputs and runtime environment variables' },
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
    ];
    for (const a of achievementsData) {
      await db.insert(achievements).values({ ...a, createdAt: now, updatedAt: now });
    }

    // 9. Hero Metrics
    console.log('📊 Seeding hero metrics...');
    const heroMetricsData = [
      { label: "Experience", value: "2+ yrs", sub: "HawkEyes Digital & Projects", order: 0 },
      { label: "Stack", value: "Full-Stack", sub: "Next.js, React & Node.js", order: 1 },
      { label: "Projects", value: "3+", sub: "SensorGrid, Z Shop & InsightDoc", order: 2 },
      { label: "Code Quality", value: "Type-Safe", sub: "TypeScript, Zod & Prisma", order: 3 },
    ];
    for (const m of heroMetricsData) {
      await db.insert(heroMetrics).values({ ...m, createdAt: now, updatedAt: now });
    }

    // 10. Bio Content
    console.log('📝 Seeding bio content...');
    const bioData = [
      { key: 'short', value: 'Jr. Full-Stack Developer specializing in Next.js, React, Node.js, and TypeScript.' },
      { key: 'long', value: 'Junior Full-Stack Developer with experience building responsive web dashboards, real-time telemetry systems, and full-stack web applications. Skilled in React, Next.js, TypeScript, Node.js, Express, NestJS, and modern databases.' },
      { key: 'intro', value: 'Jr. Full-Stack Developer building modern web applications, real-time dashboards, and scalable backend services.' },
      { key: 'story', value: 'I am a Junior Full-Stack Developer based in Dhaka, Bangladesh. With hands-on experience at HawkEyes Digital Monitoring Ltd., I specialize in building responsive frontend dashboards using Next.js, React, and Tailwind CSS, as well as full-stack applications with Node.js, NestJS, PostgreSQL, and MongoDB. I focus on clean code, type-safety, and great user experiences.' },
      { key: 'currentFocus', value: 'Next.js 15, NestJS, PostgreSQL, WebSockets, and RAG/AI applications.' },
      { key: 'currentlyBuilding', value: 'InsightDoc and real-time WebSockets analytics tools.' },
      { key: 'seeking', value: 'Full-Stack Developer or Junior Frontend/Backend roles in Dhaka or Remote.' },
      { key: 'availability', value: 'Open for full-time & high-impact full-stack roles' },
    ];
    for (const bio of bioData) {
      await db.insert(bioContent).values({ ...bio, createdAt: now, updatedAt: now }).onConflictDoNothing();
    }

    // 11. Education
    console.log('🎓 Seeding education...');
    await db.insert(education).values({
      institution: "Green University of Bangladesh",
      degree: "B.Sc. in Computer Science and Engineering",
      startDate: "2020-01-01",
      endDate: "2023-12-31",
      details: "Focused on web development, database management systems, algorithms, object-oriented programming, and software engineering.",
      order: 0,
      createdAt: now,
      updatedAt: now,
    });

    // 12. Project Categories
    console.log('🗂️ Seeding project categories...');
    const categoriesData = [
      { slug: 'web', label: 'Web Applications', short: 'Next.js & React Full-Stack apps', description: 'Responsive web apps, administrative dashboards, and client platforms.', order: 1 },
      { slug: 'realtime-iot', label: 'Real-Time & IoT', short: 'WebSockets & Telemetry dashboards', description: 'Real-time telemetry monitoring and live alert notification feeds.', order: 2 },
      { slug: 'ai-rag', label: 'AI & Document RAG', short: 'RAG PDF Analytics & Smart Search', description: 'Vector search, document Q&A, and AI-driven e-commerce engines.', order: 3 },
    ];
    for (let i = 0; i < categoriesData.length; i++) {
      await db.insert(projectCategories).values({ ...categoriesData[i], createdAt: now, updatedAt: now }).onConflictDoNothing();
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
