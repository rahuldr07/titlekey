# PAGE_INVENTORY.md

Complete inventory of the original ZIP, and the React route each screen maps to.

## Important: the ZIP is not a multi-page site

The ZIP contains **5 HTML files**, but they are not `index.html` / `orders.html` /
`clients.html`. One file — `Title CRM (original).html` — is a **single-page
application** whose 39 screens are JavaScript render functions (`S.dash`,
`S.orders`, `S.payroll`, …) swapped into one `<main>` by a hash router.

So the migration unit is **screens, not HTML files**. Counting HTML files would
report "5 pages" and be wrong. The real target is **39 routable screens**.

---

## 1. Files in the ZIP

| File | Bytes | What it is |
|---|---|---|
| `title-crm-897/README.md` | 1,627 | Handoff notes |
| `title-crm-897/project/Title CRM (original).html` | 722,676 | **THE APPLICATION** — 39 screens |
| `title-crm-897/project/Title CRM - standalone.html` | 1,296,112 | Same app, fonts inlined as base64 |
| `title-crm-897/project/uploads/titlecrm.html` | 713,017 | Earlier revision of the app |
| `title-crm-897/project/uploads/titlecrm/titlecrm.html` | 713,017 | Byte-identical duplicate of the above |
| `title-crm-897/project/uploads/titlecrm/titleflow.html` | 407,757 | Separate prototype — "Titleflow" |
| `title-crm-897/project/uploads/pasted-1785967592750-0.png` | 5,412 | Reference screenshot — filter dropdowns |
| `title-crm-897/project/uploads/pasted-1785968036766-0.png` | 190,292 | Reference screenshot — QC rating panel |
| `title-crm-897/project/support.js` | 69,150 | Design-tool runtime shim, referenced by no page |
| `title-crm-897/project/.thumbnail` | 6,326 | Generated preview artifact |

### Relationship between the HTML files — proven, not assumed

- `titlecrm.html` and `titlecrm/titlecrm.html` are **byte-identical** (verified with
  `cmp`). Not an assumption.
- `titlecrm.html` is an **earlier revision** of `Title CRM (original).html`: it has a
  `Tax` nav item since removed, and self-referential CSS (`--tint: var(--tint)`)
  that the current build fixed. Kept in `original-reference/`.
- `Title CRM - standalone.html` is the same application with fonts inlined.
- `titleflow.html` is a **separate product** (`<title>Titleflow — complete product</title>`),
  not a page of Title CRM. Kept, listed, and **not** migrated into Title CRM's
  routes — merging it would invent behaviour the ZIP does not have.

---

## 2. Assets

| Asset | Used by | Migrated |
|---|---|---|
| Inter (400/500/600/700) | All pages | ✅ Google Fonts link in `index.html` |
| IBM Plex Mono (400/500/600) | All pages | ✅ Google Fonts link in `index.html` |
| `pasted-…-0.png` ×2 | Reference only — not referenced by any page | ✅ Kept in `original-reference/` |
| Icons | Unicode glyphs (`◧ ☰ ⇄ ✉ ✎ ◎ $ ◷ ₹ ▤ ⊕ ◫ ◈ ◉ ⚯ ⚙ ★ ◱`) | ✅ Ported verbatim |
| Logo | CSS gradient + `◧` glyph, no image file | ✅ Ported |
| CSS | Inline `<style>`, no external files | ✅ `src/styles/theme.css` |
| JS | Inline `<script>`, no external files | ✅ `src/` |
| Videos / SVG files | **None in the ZIP** | n/a |

Verified: **zero** external stylesheets, script files, `<img src>` or CSS `url()`
references to local files. Every page is self-contained, so there are no relative
paths that can break.

---

## 3. Screen inventory — all 39 routable screens

| # | Original (`S.*`) | Page name | React route | Status |
|---|---|---|---|---|
| 1 | `S.dash` | Dashboard | `/` | ✅ Migrated |
| 2 | `S.orders` | Orders | `/orders` | ✅ Migrated |
| 3 | `S.order` | Order detail | `/orders/$orderId` | ✅ Migrated |
| 4 | `S.neworder` | New order | `/orders/new` | ✅ Migrated |
| 5 | `S.mywork` | My work | `/my-work` | ✅ Migrated |
| 6 | `S.myperf` | How I'm doing | `/my-perf` | ✅ Migrated |
| 7 | `S.mypay` | My payslips | `/my-pay` | ✅ Migrated |
| 8 | `S.assign` | Assignment | `/assign` | ✅ Migrated |
| 9 | `S.intake` | Order intake | `/intake` | ✅ Migrated |
| 10 | `S.repgen` | Report generator | `/repgen` | ✅ Migrated |
| 11 | `S.leads` | Leads | `/leads` | ✅ Migrated |
| 12 | `S.lead` | Lead detail | `/leads/$leadId` | ✅ Migrated |
| 13 | `S.newlead` | Add lead | `/leads/new` | ✅ Migrated |
| 14 | `S.billing` | Invoicing | `/billing` | ✅ Migrated |
| 15 | `S.attend` | Attendance | `/attendance` | ✅ Migrated |
| 16 | `S.leave` | Leave | `/leave` | ✅ Migrated |
| 17 | `S.payroll` | Payroll | `/payroll` | ✅ Migrated |
| 18 | `S.payslips` | Payslips | `/payslips` | ✅ Migrated |
| 19 | `S.payslip` | Payslip detail | `/payslips/$staffId` | ✅ Migrated |
| 20 | `S.hiring` | Recruitment | `/hiring` | ✅ Migrated |
| 21 | `S.petty` | Petty cash | `/petty` | ✅ Migrated |
| 22 | `S.counties` | County coverage | `/counties` | ✅ Migrated |
| 23 | `S.linkcheck` | Link monitor | `/linkcheck` | ✅ Migrated |
| 24 | `S.reports` | Reports | `/reports` | ✅ Migrated |
| 25 | `S.integ` | Integrations | `/integrations` | ✅ Migrated |
| 26 | `S.company` | Company | `/company` | ✅ Migrated |
| 27 | `S.person` | Staff profile | `/company/staff/$staffId` | ✅ Migrated |
| 28 | `S.client` | Client detail | `/company/clients/$clientName` | ✅ Migrated |
| 29 | `S.onboard` | Onboarding | `/onboard` | ✅ Migrated |
| 30 | `S.signin` | Sign in | `/signin` | ✅ Migrated |
| 31 | `S.denied` | Permission denied | `/denied` | ✅ Migrated |

### Alias routes — 8 more

The original's `ALIAS` map resolves these to a tab of another screen. **This is how
the ZIP behaves**, so it is preserved rather than "merged".

| # | Original | Resolves to | React route | Status |
|---|---|---|---|---|
| 32 | `S.staff` | `company` → Staff tab | `/staff` | ✅ Migrated (redirect) |
| 33 | `S.clients` | `company` → Clients tab | `/clients` | ✅ Migrated (redirect) |
| 34 | `S.depts` | `company` → Departments tab | `/depts` | ✅ Migrated (redirect) |
| 35 | `S.roles` | `company` → Roles tab | `/roles` | ✅ Migrated (redirect) |
| 36 | `S.workflow` | `company` → Workflow tab | `/workflow` | ✅ Migrated (redirect) |
| 37 | `S.sla` | `company` → Turnaround & SLA tab | `/sla` | ✅ Migrated (redirect) |
| 38 | `S.quality` | `reports` → Quality tab | `/quality` | ✅ Migrated (redirect) |
| 39 | `S.workload` | `reports` → By staff tab | `/workload` | ✅ Migrated (redirect) |

---

## 4. Internal partials — 16

Not routes. Rendered inside the screens above; migrated as React components.

`_received` `_assigned` `_ontime` `_qualityReport` `_qualityCfg` `_deptwork`
`_staffwork` `_slaBody` `_workflowBody` `_clientsBody` `_staffBody` `_deptsBody`
`_rolesBody` `_capbars` `_qc` `_docs`

---

## 5. UI inventory

| Element | In ZIP | Migrated |
|---|---|---|
| Sidebar (6 groups, 21 items, permission-filtered) | ✅ | ✅ `Shell.tsx` |
| Header (breadcrumb, dual clock, alerts, theme, account) | ✅ | ✅ `Shell.tsx` |
| Tenant switcher | ✅ | ✅ `Shell.tsx` |
| Data tables (grid-based, horizontal scroll) | ✅ | ✅ `DataTable.tsx` |
| Filter pills | ✅ | ✅ `DataTable.tsx` |
| Select filters | ✅ | ✅ `DataTable.tsx` |
| Search inputs | ✅ | ✅ `DataTable.tsx` |
| KPI tiles (clickable + static variants) | ✅ | ✅ `ui.tsx` |
| Pipeline chips | ✅ | ✅ `Dashboard.tsx` |
| Status chips (5 tones) | ✅ | ✅ `ui.tsx` |
| Due pills (late / soon / ok) | ✅ | ✅ `ui.tsx` |
| Assignee avatar stacks + self-review ring | ✅ | ✅ `ui.tsx` |
| Banners (4 tones) | ✅ | ✅ `ui.tsx` |
| Assumption flags (hatched amber) | ✅ | ✅ `ui.tsx` |
| Modals | ✅ | ✅ `Modal.tsx` |
| Toasts | ✅ | ✅ `Toast.tsx` |
| Tabs | ✅ | ✅ `Tabs.tsx` |
| Progress bars / split bars | ✅ | ✅ `theme.css` |
| Forms, inputs, selects, textareas | ✅ | ✅ `theme.css` |
| Segmented controls | ✅ | ✅ `theme.css` |
| Empty states | ✅ | ✅ `ui.tsx` |
| Star ratings (QC 1–5) | ✅ | ✅ `ui.tsx` |
| Dark mode | ✅ | ✅ `theme.css` + `session.tsx` |
| Responsive drawer (< 820px) | ✅ | ✅ `theme.css` |
| Skip link | ✅ | ✅ `Shell.tsx` |
| Page transition animation | ✅ | ✅ `theme.css` |

---

## 6. Deliberately NOT migrated — with proof

| Item | Reason |
|---|---|
| `support.js` | Design-tool runtime shim. Header reads `GENERATED from dc-runtime/src/*.ts — do not edit`. Verified with grep: **referenced by zero HTML files**. Not application code. |
| `.thumbnail` | Generated preview artifact for the design tool's gallery. Not application code. |
| `titleflow.html` | A **different product** (`<title>Titleflow — complete product</title>`), not a page of Title CRM. Kept in `original-reference/`; migrating it into Title CRM's routes would invent structure the ZIP does not have. |
| `uploads/titlecrm.html` ×2 | Earlier revision, superseded. Kept in `original-reference/`. Its screens are the same set as `Title CRM (original).html` minus one removed `Tax` item, so no screen is lost. |

Nothing above is deleted — all of it remains in `original-reference/`.
