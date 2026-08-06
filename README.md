# TitleKey

Multi-tenant production system for title-abstract companies — a US title-search
operation run by an India-based back office.

Migrated from a self-contained HTML/CSS/JavaScript prototype to a modern React
application, preserving all **39 screens**, the full design system, and the
business logic.

## Technology Stack

- **Vite** — build system and dev server
- **React 19** — functional components throughout
- **TypeScript** — `strict`, `noUncheckedIndexedAccess`, no `any`
- **TanStack Router** — type-safe routing
- **TanStack Query** — data fetching and caching

---

## Project overview

Title CRM runs a title-abstract production pipeline:

```
Search → Search QC → Typing → Typing QC → RTS        (+ Doc Req, on demand)
```

Orders arrive from clients with a turnaround promise. An assignment engine places
each stage on the emptiest eligible person, subject to department membership,
availability, daily capacity, and a **segregation-of-duties rule**: the same
person may never both do and QC one order.

The system tracks whether an order is on track, *behind an internal checkpoint*,
or **unable to finish in time** — a distinction that surfaces before the order is
actually late. Alongside it sits leads, invoicing, county-source monitoring,
reporting, and a full HRMS module.

---

## Installation

```bash
npm install
```

Works with `pnpm install` or `yarn` equally.

## Development

```bash
npm run dev
```

Opens on <http://localhost:5173>.

## Production build

```bash
npm run build      # tsc -b && vite build  →  dist/
npm run preview    # serve the production build
npm run typecheck  # tsc --noEmit
```

---

## Folder structure

```
.
├── index.html                    Vite entry
├── vite.config.ts
├── tsconfig.json
├── PAGE_INVENTORY.md             Every screen in the ZIP → its React route
├── MIGRATION_REPORT.md           Migration status and known issues
├── src/
│   ├── main.tsx                  QueryClient + Session + Router providers
│   ├── router.tsx                All 39 routes, fully typed
│   ├── styles/
│   │   └── theme.css             Design tokens + every component style
│   ├── data/
│   │   ├── types.ts              Domain interfaces
│   │   ├── seed.ts               Core: orders, staff, clients, products
│   │   ├── seed2.ts              Leads, invoices, counties, links
│   │   └── seed3.ts              HRMS, integrations, intake, report sections
│   ├── lib/
│   │   ├── api.ts                Data access — swap for real fetch calls
│   │   ├── sla.ts                SLA decomposition and risk detection
│   │   ├── format.ts             Dates, money, initials, due tone
│   │   ├── nav.ts                Navigation model + permission filtering
│   │   └── session.tsx           Signed-in user, tenant, theme
│   ├── components/
│   │   ├── Shell.tsx             Sidebar, header, layout
│   │   ├── DataTable.tsx         Pills, filters, search, empty states
│   │   └── ui.tsx                Kpi, Chip, Due, AvatarStack, Banner, PageHead
│   └── routes/
│       ├── Dashboard.tsx  Orders.tsx  OrderDetail.tsx  MyWork.tsx
│       ├── Assignment.tsx  Leads.tsx  Billing.tsx  Counties.tsx
│       ├── LinkMonitor.tsx  Reports.tsx  Company.tsx
│       ├── hrms.tsx              Attendance, Leave, Payroll, Payslips, …
│       └── misc.tsx              Intake, RepGen, SignIn, Person, …
└── title-crm-897/                Original prototype — the specification
```

`original-reference/` (the untouched ZIP extraction) is kept locally and
**gitignored** — it contains the unredacted demo data.

---

## Routing architecture

TanStack Router, with the tree declared in `src/router.tsx`.

**Routes are declared individually, never mapped over an array.** Mapping widens
the path type and `navigate({ to: '/assign' })` silently stops type-checking.
Declaring each one keeps every path a literal, so broken links fail at compile
time. This caught two during the migration.

Nested routes:

```
/orders            /orders/new           /orders/$orderId
/leads             /leads/new            /leads/$leadId
/payslips          /payslips/$staffId
/company           /company/staff/$staffId    /company/clients/$clientName
```

**Alias routes.** The original resolved 8 old routes to a *tab* of another
screen. That behaviour is preserved as redirects rather than the pages being
dropped:

| Alias | Redirects to |
|---|---|
| `/staff` `/clients` `/depts` `/roles` `/workflow` `/sla` | `/company` with the tab selected |
| `/quality` `/workload` | `/reports` with the tab selected |

Navigation is permission-filtered in `src/lib/nav.ts`, reproducing the original's
special cases: leads and admins skip *My work*, only department members see
*How I'm doing*, payroll staff skip *My payslips*.

---

## Query / data architecture

`QueryClient` is created in `src/main.tsx` and provided at the root:

```tsx
<QueryClientProvider client={queryClient}>
  <SessionProvider>
    <RouterProvider router={router} />
  </SessionProvider>
</QueryClientProvider>
```

Every read goes through TanStack Query with a typed key from `queryKeys`:

```ts
const { data: orders, isLoading } = useQuery({
  queryKey: queryKeys.orders,
  queryFn: api.orders,
})
```

`src/lib/api.ts` currently resolves from the seed modules with simulated latency,
so loading states are real and get exercised. **Connecting a backend means
replacing that one file** — no component changes.

Defaults: `staleTime: 30s`, `refetchOnWindowFocus: false`, `retry: 1`. Live order
state should not be trusted stale in an operations tool.

---

## Notes

**The clock is fixed** at Mon 3 Aug 2026, 5:30 PM ET (`NOW` in `src/data/seed.ts`),
as in the original. Every relative due date derives from it.

**The SLA split is a guess.** The 50/11/25/10/4 per-stage shares are the original
designer's estimate — "I picked these shares from how the work reads, not from
timings." They live in `src/lib/sla.ts` as data with a `source` marker so a
measured split can replace them. Do not hard-code them elsewhere.

**Payroll figures are illustrative.** Carried across with the original's own
warning. Confirm with whoever files your returns before anyone is paid on them.

**Two deliberate deviations**, both accessibility fixes — sidebar group label
contrast (3.31:1 → 5.27:1, WCAG 1.4.3) and `scroll-padding-top` so keyboard focus
is not hidden behind the sticky header (WCAG 2.2 SC 2.4.11). Everything else
matches the original's values exactly.

See `MIGRATION_REPORT.md` for full status and known issues.
