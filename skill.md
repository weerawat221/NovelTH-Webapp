---
name: novel-platform
description: Project conventions for the novel reading/publishing web platform (Next.js + Supabase). Use this skill whenever working on this codebase — building pages, writing queries, creating migrations, designing UI, or adding features for the admin/user/author roles. Contains the database schema, role-based scope of work, tech stack decisions, and design system. Always consult this before writing SQL, creating new tables, designing pages, or making role/permission decisions for this project.
---

# Novel Platform — Project Skill

A web app for reading and publishing novels. Three roles: **Admin**, **User** (reader), **Author** (writer).

## Tech Stack

- **Frontend/Backend**: Next.js 14+ (App Router, TypeScript)
- **Database & Auth**: Supabase (PostgreSQL, Supabase Auth, Storage for cover images/avatars)
- **Styling**: Tailwind CSS (utility classes only — no inline styles, no CSS-in-JS)
- **Recommended libraries**: `react-hook-form` + `zod` (forms/validation), `recharts` (report charts), `lucide-react` (icons)

Always check current Supabase/Next.js docs before assuming API shape — these move fast and training data may be stale.

## Database Schema

Table names have **no `tb_` prefix**. Table `users` is plural (avoids the Postgres reserved word `user`).

| Table | Purpose | Key unique constraints |
|---|---|---|
| `admin` | Admin accounts | `username`, `email` |
| `users` | Reader accounts | `username`, `email` |
| `author` | Author accounts | `username`, `email`, `pen_name` |
| `category` | Novel genres | `category_name` |
| `novel` | Novels | `novel_name`; FK → `author`, `category` |
| `chapter` | Chapters of a novel | `(novel_id, chapter_no)`; FK → `novel` |
| `comment` | Comments on a chapter | FK → `users`, `chapter` |
| `favorite` | User's favorited novels | `(user_id, novel_id)`; FK → `users`, `novel` |
| `reading_history` | User's read chapters | FK → `users`, `chapter` |
| `visit_log` | Every page visit (drives all reports) | FK → `users` (nullable), `novel` (nullable), `chapter` (nullable) |

**`visit_log` is the source of truth for every report** — total/daily/monthly/yearly visit counts, visits per category, visits per author, visits per novel, all derive from grouping/filtering this table by `visit_date`, joined through `novel` → `category`/`author` as needed.

Full `CREATE TABLE` statements and mock data live in `references/schema.sql` — read it before writing any migration or query so field names/types are exact rather than assumed.

## Role Scope (what each role can do)

**Admin**
- Manage & view: users, authors, novels, categories, comments
- Reports: total visits, daily/monthly/yearly visits, visits by category, visits by author

**User (reader)**
- Manage: own profile, favorites, own comments
- View: own profile, authors, novels, categories, comments, own reading history

**Author**
- Manage: own profile, own novels/chapters, comments (on own works)
- View: own profile, authors, novels, categories, comments
- Reports: visits per own novel, comments per chapter of own novels

When building a page or API route, check this table first to know which role should have access and what "manage" vs "view only" means for that resource. Enforce this at the Supabase RLS level, not just in the UI.

## Design System

**Direction**: modern, clean, content-first — the novel text is the hero, not the chrome. Warm, book-like tone rather than generic SaaS/Bootstrap look. Must support light **and** dark mode (readers read at night).

**Non-negotiables**
- Thai-friendly typography: pick a font that stays readable in long-form Thai body text, not just headings
- Mobile-first responsive layout
- Reading page must be distraction-free: adjustable font size/theme, minimal chrome
- Icons from `lucide-react`, not emoji, not mixed icon sets
- Search/filter by category must be fast and obvious from the homepage

**Key pages to keep consistent in style**: Homepage, Novel detail, Reading page, Author profile, Author dashboard (manage + reports), Admin dashboard (manage + reports).

## Working Conventions

- Prefer Server Components for data fetching; use Client Components only where interactivity is needed (reading controls, forms, dashboards with charts)
- All new tables/columns should follow the naming style above (no prefixes, snake_case, singular table names except `users`)
- Any new unique/business constraint should be added at the DB level (`UNIQUE`, `CHECK`), not just validated in the app
- When adding a report, always ask: does this aggregate from `visit_log`, or does it need a new log table? Don't duplicate counting logic across tables (e.g. `chapter.view_count` vs `visit_log` — pick one source of truth and keep the other in sync via trigger, or drop the redundant one)