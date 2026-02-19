# AI Startup Tracker

A dashboard for tracking AI startups, products, and key persons. Built with Next.js and powered by TiDB Cloud.

## Tech Stack

- **Next.js 14+** (App Router)
- **Tailwind CSS** for styling
- **TiDB Cloud** (MySQL-compatible) for data
- **Recharts** for data visualization
- **Vercel** for deployment

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in your database URL
3. Install dependencies: `npm install`
4. Run dev server: `npm run dev`
5. Open http://localhost:3000

## Environment Variables

- `DATABASE_URL` — MySQL connection string for TiDB Cloud

## Pages

- `/` — Dashboard with stats, charts, and recent additions
- `/startups` — Filterable, sortable list of all startups
- `/startups/[id]` — Startup detail with key persons and related content
- `/products` — AI products grid with category filters

## Deployment

Deploy to Vercel and set `DATABASE_URL` in project environment variables.
