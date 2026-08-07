# PAGE_INVENTORY.md

## The ZIP is a single-page application, not a multi-page site

The ZIP contains 5 HTML files, but `Title CRM (original).html` is a **single-page
application**: its 39 screens are JavaScript render functions (`S.dash`,
`S.orders`, `S.payroll`, …) swapped into one `<main>` by a hash router. The
migration unit is therefore **screens**, counted directly from the source:

```
grep -oE "^S\.[a-zA-Z_]+=" "Title CRM (original).html" | grep -v '^S\._'  →  39
```

## Files in the ZIP

| Original file | What it is | Handling |
|---|---|---|
| `project/Title CRM (original).html` | THE APPLICATION — 39 screens | Cloned, screen by screen |
| `project/Title CRM - standalone.html` | Same app, fonts inlined | Reference (`title-crm-897/`) |
| `project/uploads/titlecrm.html` | Earlier revision of the same app | Reference — superseded by the above |
| `project/uploads/titlecrm/titlecrm.html` | Byte-identical duplicate (verified `cmp`) | Reference |
| `project/uploads/titlecrm/titleflow.html` | A different product ("Titleflow — complete product") | Reference — not a Title CRM page |
| `project/uploads/pasted-*.png` ×2 | Reference screenshots | Reference |
| `project/support.js` | Design-tool shim, "GENERATED — do not edit", referenced by no page | Reference |
| `project/.thumbnail` | Design-tool preview artifact | Reference |
| `README.md` | Handoff notes | Reference |

Nothing was deleted. The full untouched extraction lives in `original-reference/`
(local only — it holds the unredacted demo data and this repo is public); the
redacted reference copy is committed at `title-crm-897/`.

## Screen inventory — 39 of 39

| # | Original | Page name | Nav entry | React route | Migrated | Route works | Visual | Functional |
|---|---|---|---|---|---|---|---|---|
| 1 | `S.dash` | Dashboard | Production → Dashboard | `/` | ✅ | ✅ | ✅ | ✅ |
| 2 | `S.orders` | Orders | Production → Orders | `/orders` | ✅ | ✅ | ✅ | ✅ |
| 3 | `S.order` | Order detail (4 tabs) | row click | `/orders/$orderId` | ✅ | ✅ | ✅ | ✅ |
| 4 | `S.neworder` | New order | ＋ New order | `/orders/new` | ✅ | ✅ | ✅ | ✅ |
| 5 | `S.mywork` | My work | Production → My work | `/my-work` | ✅ | ✅ | ✅ | ✅ |
| 6 | `S.myperf` | How I’m doing | Production → How I’m doing | `/my-perf` | ✅ | ✅ | ✅ | ✅ |
| 7 | `S.mypay` | My payslips | Production → My payslips | `/my-pay` | ✅ | ✅ | ✅ | ✅ |
| 8 | `S.assign` | Assignment | Production → Assignment | `/assign` | ✅ | ✅ | ✅ | ✅ |
| 9 | `S.intake` | Order intake | Production → Order intake | `/intake` | ✅ | ✅ | ✅ | ✅ |
| 10 | `S.repgen` | Report generator | Production → Report generator | `/repgen` | ✅ | ✅ | ✅ | ✅ |
| 11 | `S.leads` | Leads | Business → Leads | `/leads` | ✅ | ✅ | ✅ | ✅ |
| 12 | `S.lead` | Lead detail | row click | `/leads/$leadId` | ✅ | ✅ | ✅ | ✅ |
| 13 | `S.newlead` | Add lead | ＋ Add lead | `/leads/new` | ✅ | ✅ | ✅ | ✅ |
| 14 | `S.billing` | Invoicing | Business → Invoicing | `/billing` | ✅ | ✅ | ✅ | ✅ |
| 15 | `S.attend` | Attendance | HRMS → Attendance | `/attendance` | ✅ | ✅ | ✅ | ✅ |
| 16 | `S.leave` | Leave | HRMS → Leave | `/leave` | ✅ | ✅ | ✅ | ✅ |
| 17 | `S.payroll` | Payroll | HRMS → Payroll | `/payroll` | ✅ | ✅ | ✅ | ✅ |
| 18 | `S.payslips` | Payslips | HRMS → Payslips | `/payslips` | ✅ | ✅ | ✅ | ✅ |
| 19 | `S.payslip` | Payslip detail | row click | `/payslips/$staffId` | ✅ | ✅ | ✅ | ✅ |
| 20 | `S.hiring` | Recruitment | HRMS → Recruitment | `/hiring` | ✅ | ✅ | ✅ | ✅ |
| 21 | `S.petty` | Petty cash | HRMS → Petty cash | `/petty` | ✅ | ✅ | ✅ | ✅ |
| 22 | `S.counties` | County coverage | Reference → County coverage | `/counties` | ✅ | ✅ | ✅ | ✅ |
| 23 | `S.linkcheck` | Link monitor | Reference → Link monitor | `/linkcheck` | ✅ | ✅ | ✅ | ✅ |
| 24 | `S.reports` | Reports (6 tabs) | Insight → Reports | `/reports` | ✅ | ✅ | ✅ | ✅ |
| 25 | `S.integ` | Integrations | Configure → Integrations | `/integrations` | ✅ | ✅ | ✅ | ✅ |
| 26 | `S.company` | Company (8 tabs) | Configure → Company | `/company` | ✅ | ✅ | ✅ | ✅ |
| 27 | `S.person` | Staff profile | staff row / avatar click | `/company/staff/$staffId` | ✅ | ✅ | ✅ | ✅ |
| 28 | `S.client` | Client detail | client row click | `/company/clients/$clientName` | ✅ | ✅ | ✅ | ✅ |
| 29 | `S.onboard` | Onboarding | tenant switcher → Add a company | `/onboard` | ✅ | ✅ | ✅ | ✅ |
| 30 | `S.signin` | Sign in | account button (header) | `/signin` | ✅ | ✅ | ✅ | ✅ |
| 31 | `S.denied` | Permission denied | permission gate | `/denied` + not-found | ✅ | ✅ | ✅ | ✅ |

### Alias routes — the original's ALIAS map, preserved as redirects

| # | Original | Resolves to | React route | Status |
|---|---|---|---|---|
| 32 | `S.staff` | Company → Staff tab | `/staff` | ✅ redirect |
| 33 | `S.clients` | Company → Clients tab | `/clients` | ✅ redirect |
| 34 | `S.depts` | Company → Departments tab | `/depts` | ✅ redirect |
| 35 | `S.roles` | Company → Roles tab | `/roles` | ✅ redirect |
| 36 | `S.workflow` | Company → Workflow tab | `/workflow` | ✅ redirect |
| 37 | `S.sla` | Company → Turnaround & SLA tab | `/sla` | ✅ redirect |
| 38 | `S.quality` | Reports → Quality tab | `/quality` | ✅ redirect |
| 39 | `S.workload` | Reports → By staff tab | `/workload` | ✅ redirect |

## Tab sets — matched to the original exactly

- Reports: `Received · Assigned · Turnaround · By staff · By department · Quality` (the original's `RPTABS`)
- Company: `Company · Staff · Clients · Departments · Roles · Workflow · Turnaround & SLA · Payroll` (the original's `COTABS`)
- Order detail: `Details · Quality · Documents · Notes`
- Report generator: `Capture · Preview · Templates`

## Data — ported verbatim from the original

28 staff (incl. Ashok S in both Typing and Typing QC with the self-review flag,
Neil Barrow leaving 08/12, Prasad M D and Vikki Sankar on leave), 5 clients,
8 orders, 10 products, 6 leads with their full contact lists and note histories,
11 counties × 4 link types with the original URLs/statuses/errors, the SLA table,
priority tiers, clock pause rules, the 50/11/25/10/4 stage budget with 40Y and
FS+ overrides, the invoice generator (rows sum exactly to each client's lifetime
totals), the 1–5 QC scale (Critical/Non critical/MIS/Average/Good), the five QC
rules with their costs, and the eight assignment rules. Identity-document fields
carry the same redacted placeholders as the committed reference copy.

## Assets

The original has **no external asset files** — all CSS and JS are inline, fonts
come from Google Fonts (same `<link>` preserved in `index.html`), icons are
Unicode glyphs (ported character for character), and the logo is a CSS gradient.
Zero paths existed that could break.
