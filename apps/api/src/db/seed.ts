/**
 * apps/api/src/db/seed.ts
 *
 * Seed file for Pen Times Magazine.
 * Creates:
 *  - 1 admin user
 *  - 1 author user
 *  - 1 reader user
 *  - 6 categories
 *  - 3 sample articles (published, assigned to categories)
 *  - 2 scheduled programs
 *
 * Run:
 *   pnpm --filter api db:seed
 *
 * Credentials:
 *   Admin   → admin@pentimes.ng     / Admin@12345
 *   Author  → author@pentimes.ng   / Author@12345
 *   Reader  → reader@pentimes.ng   / Reader@12345
 */

import argon2       from 'argon2';
import * as dotenv  from 'dotenv';
import path         from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from monorepo root before any db/config imports
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import { db }                from '../config/db.js';
import {
  users,
  categories,
  articles,
  articleCategories,
  scheduledPrograms,
}                            from './schema/index.js';
import { slugify }           from '../helpers/slugify.js';
import { calculateReadingTime } from '../helpers/reading-time.js';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function hash(plain: string): Promise<string> {
  return argon2.hash(plain, {
    type: argon2.argon2id,
    memoryCost: 65_536,
    timeCost: 3,
    parallelism: 4,
  });
}

// ─────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────

const SEED_USERS = [
  {
    name:     'Pen Times Admin',
    email:    'admin@pentimes.ng',
    password: 'Admin@12345',
    role:     'admin'  as const,
    bio:      'Platform administrator for Pen Times Magazine.',
    avatar:   null,
  },
  {
    name:     'Aisha Bello',
    email:    'author@pentimes.ng',
    password: 'Author@12345',
    role:     'author' as const,
    bio:      'Senior correspondent covering Katsina politics and community affairs.',
    avatar:   null,
  },
  {
    name:     'Musa Abdullahi',
    email:    'reader@pentimes.ng',
    password: 'Reader@12345',
    role:     'reader' as const,
    bio:      null,
    avatar:   null,
  },
] as const;

const SEED_CATEGORIES = [
  { name: 'News',                description: 'Breaking news and latest updates from Katsina State and Nigeria.' },
  { name: 'Politics',            description: 'Political developments, elections, and governance in Nigeria.' },
  { name: 'Education',           description: 'Education news, policies, and opportunities for Nigerians.' },
  { name: 'Community',           description: 'Stories of community development and grassroots initiatives.' },
  { name: 'Photo News',          description: 'News told through compelling photography.' },
  { name: 'Social Media Trends', description: 'Viral stories, challenges, and trends across Nigerian social media.' },
] as const;

const ARTICLE_CONTENT_1 = `
<h2>State of Infrastructure in Katsina</h2>
<p>The Katsina State Government has announced a comprehensive road rehabilitation programme spanning over 500 kilometres of rural and urban roads across the state's 34 local government areas. Governor Mallam Dikko Radda made the announcement during the state's annual budget presentation, allocating ₦18 billion for the initiative.</p>
<p>The programme, which is expected to span 18 months, targets some of the most dilapidated roads in the state, particularly those connecting farming communities to urban markets. According to the Ministry of Works, the project will create an estimated 12,000 direct and indirect jobs for residents.</p>
<blockquote>We are committed to building infrastructure that will last generations and connect our people to economic opportunities — Governor Dikko Radda</blockquote>
<h3>Project Breakdown</h3>
<p>The project will be executed in three phases. Phase one covers Katsina metropolis and its environs, phase two focuses on the central senatorial district, and phase three extends to the southern zone bordering Kaduna State.</p>
<p>Civil society groups have welcomed the announcement but called for transparency in contractor selection and strict adherence to project timelines, citing past instances where road projects stalled midway through execution.</p>
<p>The Federal Government's counterpart funding through the Rural Roads Programme is expected to complement the state allocation, bringing the total project budget to an estimated ₦24 billion.</p>
`.trim();

const ARTICLE_CONTENT_2 = `
<h2>JAMB Results and What They Mean for 2024 Candidates</h2>
<p>The Joint Admissions and Matriculation Board (JAMB) has released the results for the 2024 Unified Tertiary Matriculation Examination (UTME), with over 1.9 million candidates sitting the examination nationwide. Officials report a slight improvement in average scores compared to the 2023 cycle.</p>
<p>In Katsina State, a record 48,000 candidates registered for the examination, with preliminary data suggesting that 62% scored above the general benchmark of 180 marks required by most federal universities.</p>
<h3>Cut-off Marks and Admission Prospects</h3>
<p>Universities have been directed to use 140 as the minimum aggregate cut-off, though individual institutions set their departmental benchmarks significantly higher — some competitive courses such as Medicine and Law requiring scores above 250.</p>
<p>Education stakeholders in Katsina have urged state-owned tertiary institutions to lower their internal barriers to admission for candidates from rural communities, arguing that geographic and resource disadvantages unfairly penalise otherwise capable students.</p>
<blockquote>Access to education is not just a privilege — it is a right. Our institutions must reflect that reality — Dr. Fatima Suleiman, Education Advocate</blockquote>
<p>JAMB has also announced that Direct Entry applications for candidates with A-level or equivalent qualifications will open in the coming weeks.</p>
`.trim();

const ARTICLE_CONTENT_3 = `
<h2>Community Farmers Adopt Modern Irrigation Techniques</h2>
<p>Smallholder farmers across five villages in the Dutsin-Ma Local Government Area of Katsina State are recording significantly higher dry-season harvests after adopting drip irrigation systems introduced through a partnership between a local NGO and the State Agricultural Development Programme (KTARDA).</p>
<p>The initiative, which began as a pilot in 2022, has expanded to cover over 400 farming households. Participating farmers report a threefold increase in tomato and pepper yields compared to traditional flood irrigation methods.</p>
<h3>How the Technology Works</h3>
<p>Drip irrigation delivers water directly to the root zone of plants through a network of pipes and emitters, dramatically reducing water wastage. In a region where water scarcity during the dry season severely limits agricultural productivity, the technology has proven transformative.</p>
<p>Each smallholder plot is equipped with a solar-powered pump drawing from shallow boreholes, eliminating dependence on the unreliable national grid. Training sessions held in Hausa have ensured that even farmers with limited formal education can operate and maintain the systems.</p>
<blockquote>Before this programme, I could only farm for three months. Now I farm all year — Malam Bello Usman, farmer, Dutsin-Ma</blockquote>
<p>KTARDA officials have expressed interest in scaling the programme to all 34 LGAs by 2026, pending additional funding from state and federal agricultural budgets.</p>
`.trim();

const SEED_PROGRAMS = [
  {
    title:           'Pen Times Evening Briefing',
    description:     'A daily roundup of the top news stories from Katsina and across Nigeria, presented by our senior editorial team.',
    scheduledAt:     new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    durationMinutes: 30,
    status:          'upcoming' as const,
  },
  {
    title:           'Education Forum: WAEC Preparation Masterclass',
    description:     'An interactive forum bringing together top educators and students to discuss proven strategies for excelling in the West African Examinations Council.',
    scheduledAt:     new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    durationMinutes: 90,
    status:          'upcoming' as const,
  },
  {
    title:           'Katsina Business Summit 2024 — Coverage',
    description:     'Live coverage and post-event analysis of the annual Katsina Business Summit, featuring interviews with investors and state officials.',
    scheduledAt:     new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    durationMinutes: 120,
    status:          'completed' as const,
  },
] as const;

// ─────────────────────────────────────────────────────────────
// Main seed function
// ─────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱  Pen Times Magazine — Database Seed');
  console.log('════════════════════════════════════════\n');

  // ── 1. Users ──────────────────────────────────────────────
  console.log('👤  Seeding users…');

  const createdUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }> = [];

  for (const u of SEED_USERS) {
    const hashedPassword = await hash(u.password);

    const [inserted] = await db
      .insert(users)
      .values({
        name:     u.name,
        email:    u.email,
        password: hashedPassword,
        role:     u.role,
        bio:      u.bio ?? null,
        avatar:   u.avatar ?? null,
      })
      .onConflictDoNothing()
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

    if (inserted) {
      createdUsers.push(inserted);
      console.log(`   ✓  ${inserted.role.padEnd(8)} → ${inserted.email}`);
    } else {
      console.log(`   ↩  Skipped (already exists): ${u.email}`);
    }
  }

  // Locate author ID for article assignment
  // (fall back to a fresh lookup in case rows were skipped due to conflict)
  const allUsers = await db.query.users.findMany();
  const authorUser = allUsers.find((u) => u.email === 'author@pentimes.ng');
  const adminUser  = allUsers.find((u) => u.email === 'admin@pentimes.ng');

  if (!authorUser || !adminUser) {
    throw new Error('Could not locate seeded author or admin user. Aborting.');
  }

  // ── 2. Categories ─────────────────────────────────────────
  console.log('\n📂  Seeding categories…');

  const createdCategories: Array<{ id: string; name: string; slug: string }> = [];

  for (const cat of SEED_CATEGORIES) {
    const slug = slugify(cat.name);

    const [inserted] = await db
      .insert(categories)
      .values({ name: cat.name, slug, description: cat.description })
      .onConflictDoNothing()
      .returning({ id: categories.id, name: categories.name, slug: categories.slug });

    if (inserted) {
      createdCategories.push(inserted);
      console.log(`   ✓  ${inserted.name} (/${inserted.slug})`);
    } else {
      console.log(`   ↩  Skipped (already exists): ${cat.name}`);
    }
  }

  // Re-fetch to guarantee we have IDs even for pre-existing rows
  const allCategories = await db.query.categories.findMany();

  const catBySlug = (slug: string) => allCategories.find((c) => c.slug === slug);

  // ── 3. Articles ───────────────────────────────────────────
  console.log('\n📰  Seeding articles…');

  const articleSeeds = [
    {
      title:       'Katsina Government Unveils ₦18bn Road Rehabilitation Programme',
      content:     ARTICLE_CONTENT_1,
      authorId:    adminUser.id,
      categorySlug: 'news',
      status:      'published' as const,
    },
    {
      title:       'JAMB 2024: What Katsina Candidates Need to Know Before Choosing Their Institutions',
      content:     ARTICLE_CONTENT_2,
      authorId:    authorUser.id,
      categorySlug: 'education',
      status:      'published' as const,
    },
    {
      title:       'Solar-Powered Drip Irrigation Transforms Dry-Season Farming in Dutsin-Ma',
      content:     ARTICLE_CONTENT_3,
      authorId:    authorUser.id,
      categorySlug: 'community',
      status:      'published' as const,
    },
  ];

  for (const a of articleSeeds) {
    const slug        = slugify(a.title);
    const readingTime = calculateReadingTime(a.content);
    const excerpt     = a.content.replace(/<[^>]+>/g, ' ').trim().slice(0, 200) + '…';

    const [insertedArticle] = await db
      .insert(articles)
      .values({
        title:       a.title,
        slug,
        excerpt,
        content:     a.content,
        status:      a.status,
        authorId:    a.authorId,
        readingTime,
        publishedAt: a.status === 'published' ? new Date() : null,
        coverImage:  null,
      })
      .onConflictDoNothing()
      .returning({ id: articles.id, title: articles.title, slug: articles.slug });

    if (!insertedArticle) {
      console.log(`   ↩  Skipped (already exists): ${a.title.slice(0, 60)}…`);
      continue;
    }

    console.log(`   ✓  "${insertedArticle.title.slice(0, 55)}…"`);

    // Attach category
    const category = catBySlug(a.categorySlug);
    if (category) {
      await db
        .insert(articleCategories)
        .values({ articleId: insertedArticle.id, categoryId: category.id })
        .onConflictDoNothing();
    }
  }

  // ── 4. Scheduled Programs ─────────────────────────────────
  console.log('\n📅  Seeding scheduled programs…');

  for (const p of SEED_PROGRAMS) {
    const [inserted] = await db
      .insert(scheduledPrograms)
      .values({
        title:           p.title,
        description:     p.description,
        scheduledAt:     p.scheduledAt,
        durationMinutes: p.durationMinutes,
        status:          p.status,
      })
      .onConflictDoNothing()
      .returning({ id: scheduledPrograms.id, title: scheduledPrograms.title });

    if (inserted) {
      console.log(`   ✓  ${inserted.title.slice(0, 60)}`);
    } else {
      console.log(`   ↩  Skipped (already exists): ${p.title.slice(0, 60)}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────
  console.log('\n════════════════════════════════════════');
  console.log('✅  Seed complete!\n');
  console.log('🔑  Login credentials:');
  console.log('   Admin   →  admin@pentimes.ng    /  Admin@12345');
  console.log('   Author  →  author@pentimes.ng   /  Author@12345');
  console.log('   Reader  →  reader@pentimes.ng   /  Reader@12345');
  console.log('');
}

// ─────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────

seed()
  .catch((err) => {
    console.error('\n❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });