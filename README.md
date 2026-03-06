# Frammer AI — Analytics Dashboard

Production-grade Product Usage Analytics Dashboard for **Frammer AI** — B2B media platform converting long-form video into short-form vertical content.

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS v3 — Frammer dark theme (#0A0A0A + Red #E8212B)
- shadcn/ui + Recharts + Framer Motion
- React Router v6 + TanStack Query

## Pages
| Route | Description |
|---|---|
| `/` | Overview — KPIs, monthly trends, channel & language breakdown |
| `/content-performance` | Clip yield, processing efficiency, input types |
| `/channel-analytics` | Per-channel volume, processing time, tables |
| `/output-types` | Reels vs Shorts vs Viral Clips trend & mix |
| `/language-analytics` | Multi-language distribution |
| `/team-productivity` | Per-member metrics + drill-down modal |
| `/client-portal` | Per-client usage, growth, comparative view |
| `/processing-insights` | Pipeline efficiency, queue health, duration histograms |

## Getting Started
```bash
npm install
npm run dev
# → http://localhost:8080
```