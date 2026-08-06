# Title CRM

A multi-tenant production system for title-abstract companies — a US title-search
operation run by an India-based back office.

Ported from a self-contained HTML/CSS/JS prototype to **Vite + React 19 +
TypeScript + TanStack Router + TanStack Query**. The original prototype is kept
in `title-crm-897/` as the specification.

---

## Quick start

```bash
pnpm install
pnpm dev
```

Opens on <http://localhost:5173>.

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server with HMR |
| `pnpm build` | Type-check then production build to `dist/` |
| `pnpm preview` | Serve the production build |
| `pnpm typecheck` | `tsc --noEmit` |

---

## Project structure

```
.
├── index.html                  Vite entry
├── vite.config.ts
├── src/
│   ├── main.tsx                QueryClient + Session + Router providers
│   ├── router.tsx              All routes, fully typed
│   ├── styles/theme.css        Design tokens + every component style
│   ├── data/
│   │   ├── types.ts            Domain types
│   │   └── seed.ts             Demo data, ported from the prototype
│   ├── lib/
│   │   ├── api.ts              Data access — swap for real fetch calls
│   │   ├── sla.ts              SLA decomposition and risk detection
│   │   ├── format.ts           Dates, money, initials, due tone
│   │   ├── nav.ts              Navigation model + permission filtering
│   │   └── session.tsx         Signed-in user, tenant, theme
│   ├── components/
│   │   ├── Shell.tsx           Sidebar, header, layout
│   │   ├── DataTable.tsx       Filter pills, selects, search, empty states
│   │   └── ui.tsx              KPI, Chip, Due, AvatarStack, Banner…
│   └── routes/
│       ├── Dashboard.tsx       built
│       ├── Orders.tsx          built
│       ├── OrderDetail.tsx     built
│       └── Placeholder.tsx     Stub for screens not yet ported
└── title-crm-897/              Original prototype — the specification
```

---

## Port status

**Complete** — the stack, the full design system (tokens, dark mode, every shared
component), the domain model and SLA logic, permission-filtered navigation, and
all routes registered and navigable.

**Built screens** — Dashboard, Orders, Order detail.

**Stubbed** — the remaining 19 screens render a placeholder naming the render
function in the prototype that specifies them (`S.payroll`, `S.assign`, …). Each
is a self-contained job.

---

## Features working today

- **Multi-tenant** — switch companies from the sidebar.
- **Role-based navigation** — change the account in the header and the sidebar
  rebuilds. A Staff account sees only its own orders; that is the permission
  working, not a limitation of the screen.
- **Dark mode** — full theme via CSS custom properties.
- **SLA risk detection** — distinguishes *behind an internal checkpoint* from
  *cannot finish in time*, before an order is actually late.
- **Self-review blocking** — a red avatar ring marks the same person set to both
  do and QC a stage.
- **Filtering** — pipeline chips, filter pills, selects and search.
- **Responsive** — sidebar collapses to a drawer below 820px.

---

## Technologies

| | |
|---|---|
| React 19 | `use()` hook, context as provider |
| TypeScript 5.9 | `strict`, `noUncheckedIndexedAccess` |
| TanStack Router | Type-safe routes — `navigate()` and `<Link to>` are checked |
| TanStack Query | All data access, with real loading states |
| Vite 6 | Dev server and build |
| CSS custom properties | Theming, no CSS framework |

---

## Notes carried over from the prototype

**The clock is fixed** at Mon 3 Aug 2026, 5:30 PM ET (`NOW` in `src/data/seed.ts`).
Every relative due date is computed from it, so the screens read consistently.

**The SLA split is a guess.** The 50/11/25/10/4 per-stage shares are the
prototype designer's own estimate — "I picked these shares from how the work
reads, not from timings." They live in `src/lib/sla.ts` as data with a `source`
marker, so a measured percentile split can replace them. Do not hard-code them
elsewhere.

**One deliberate deviation from the design.** The prototype's sidebar group
labels were `#5A6B86` on `#131A2B`, which measures 3.31:1. At 9.5px that is not
WCAG "large text", so it needed 4.5:1 and failed. Changed to `#7C8CA8`
(5.27:1). Everything else matches the prototype exactly.

`html { scroll-padding-top }` was also added so keyboard focus doesn't scroll
behind the 56px sticky header — WCAG 2.2 SC 2.4.11, W3C failure technique F110.

**Demo data is redacted.** The prototype's staff records originally carried
identity-document-shaped values (Aadhaar, PAN, UAN, ESI, bank account/IFSC),
addresses and contact numbers. These were replaced with placeholders before this
repository was made public.
