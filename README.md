# TitleKey

Title CRM — a multi-tenant production system for title-abstract companies: a US
title-search operation run by an India-based back office.

An **exact clone** of the original HTML/CSS/JS prototype, converted to a modern
React stack. The technology changed; the application did not. All 39 screens,
the full design system and the original's data and behaviour are preserved —
see `PAGE_INVENTORY.md` and `MIGRATION_REPORT.md`.

## Technology Stack

- **Vite** — build system and dev server
- **React 19** — functional components throughout
- **TypeScript** — `strict`, no stray `any`
- **TanStack Router** — all routing, fully typed
- **TanStack Query** — data layer at the root, ready for a real API

## Project overview

Orders arrive from clients with a turnaround promise and flow through
`Search → Search QC → Typing → Typing QC → RTS` (plus Doc Req on demand). An
assignment engine places each stage on the emptiest eligible person — department
membership, availability, daily target, route pools, and a segregation-of-duties
rule: nobody QCs their own work. Stage budgets split each promise into internal
checkpoints, so the system can say *behind* (recoverable) or *cannot finish in
time* (needs intervention) before an order is actually late. Around the pipeline:
leads, invoicing, county-source monitoring, six-tab reporting, and a full HRMS
(attendance, leave, payroll, payslips, recruitment, petty cash).

## Installation

```bash
npm install
```

## Development

```bash
npm run dev        # http://localhost:5173
```

## Production build

```bash
npm run build      # tsc -b && vite build → dist/
npm run preview
```

## Folder structure

```
index.html                    Vite entry — same fonts as the original
src/
  main.tsx                    QueryClient + Session + Router providers
  router.tsx                  All 39 routes incl. the 8 alias redirects
  styles/theme.css            The original's CSS, ported verbatim
  data/
    seed.ts                   Clock, tenants, departments, roles, staff (28), clients, orders
    seed2.ts                  Leads, counties/links, SLA/tiers/clock/budget, invoices, QC, rules
    seed3.ts                  HRMS — attendance, leave, payroll, petty, hiring, intake, repgen
  lib/
    session.tsx               Signed-in user, tenant, theme, drawer, toast
    engine.ts                 The assignment pass with typed exceptions
    sla.ts                    Checkpoints and behind/cannot-finish detection
    nav.ts                    The original NAV + visibleNav() permission filter
    format.ts                 Dates (MM/DD/YYYY policy), money, ₹, due tones
  components/
    Shell.tsx                 Sidebar, header, alerts + tenant modals, toast
    DataTable.tsx             The original table(): pills, filters, search
    Modal.tsx  ui.tsx         Modal, KPI, Chip, Due, AvatarStack, Assume, Stars
  routes/                     One module per screen group
title-crm-897/                Redacted reference copy of the original (committed)
original-reference/           Untouched ZIP extraction (local only, gitignored)
```

## Routing architecture

TanStack Router with every path declared as a literal (never mapped), so
`navigate()` and `<Link>` are compile-time checked. Nested routes for
`/orders/$orderId`, `/leads/$leadId`, `/payslips/$staffId`,
`/company/staff/$staffId`, `/company/clients/$clientName`. The original's eight
ALIAS routes (`/staff`, `/clients`, `/depts`, `/roles`, `/workflow`, `/sla`,
`/quality`, `/workload`) redirect to the right tab of Company or Reports —
exactly as the original's ALIAS map behaves. Direct URL entry, refresh, and
active nav state all work.

## Query / data architecture

`QueryClientProvider` wraps the app in `src/main.tsx`. Screens currently read
the in-memory data ported from the original (so every page looks exactly like
the prototype, per the clone requirement); the data modules are the single
source, so pointing them at an API later is confined to one layer. Mock data was
deliberately **not** removed — the original's fixed clock (Mon Aug 3 2026,
5:30 PM ET) and every figure derive from it.

## Notes

- The reference copy in `title-crm-897/` and the seed data carry **redacted**
  identity fields (`0000 0000 0000`-style placeholders) — this repository is
  public. The untouched original stays local in `original-reference/`.
- The original flags its own assumptions in-app (SLA hours, the stage split,
  illustrative tax figures, the report generator). Those hatched-amber flags are
  preserved, not resolved — they are part of the design.
