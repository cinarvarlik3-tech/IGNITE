# 🌿 WhatIf — Your Private AI Companion

Transform overthinking into clarity. Chat about what's on your mind, visualize alternative outcomes, and journal your reflections.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Add your OpenAI API key
cp .env.example .env.local
# Edit .env.local and add your key

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (it will prompt for env vars)
vercel
```

Or connect the GitHub repo at [vercel.com/new](https://vercel.com/new).

## Architecture

- **Next.js 15** (App Router) — file-based routing + API routes
- **Tailwind CSS v4** — styling
- **Framer Motion** — animations
- **OpenAI API** — chat streaming + structured JSON generation
- **localStorage** — client-side persistence (demo only)

API key stays server-side in `/api` route handlers. No key exposure in the browser.

## Structure

```
app/
├── api/chat/route.ts          # Streaming chat proxy
├── api/generate-tree/route.ts # What-If tree generation
├── page.tsx                   # Main shell with tab navigation
└── layout.tsx                 # Root layout + providers

components/
├── chat/       # Chat screen, bubbles, input, typing indicator
├── whatif/     # Tree visualization, root node, branch cards
└── journal/    # Entry list, editor, mood selector

context/
└── AppContext.tsx  # Global state + localStorage persistence
```
