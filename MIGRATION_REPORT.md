# MIGRATION_REPORT.md

## 1. Total pages in the original ZIP

**39 routable screens**, inside 5 HTML files.

The ZIP is not a multi-page site. `Title CRM (original).html` is a single-page
application whose screens are JavaScript render functions (`S.dash`, `S.orders`,
`S.payroll`, …) swapped into one `<main>`. Counting HTML files would report
"5 pages" and be wrong.

Counted directly from the source:

```
grep -oE "^S\.[a-zA-Z_]+=" "Title CRM (original).html" | grep -v '^S\._' → 39
```

Plus 16 internal partials (`S._received`, `S._ontime`, …) which are components,
not routes.

## 2. Total React routes created

**39** — 31 screen routes + 8 alias redirects.

Verified against the built bundle: every path literal is present in
`dist/assets/index-*.js`.

## 3. Pages successfully migrated

**39 of 39.**

| Group | Screens | Status |
|---|---|---|
| Production | Dashboard, Orders, Order detail, New order, My work, How I'm doing, My payslips, Assignment, Order intake, Report generator | ✅ 10/10 |
| Business | Leads, Lead detail, Add lead, Invoicing | ✅ 4/4 |
| HRMS | Attendance, Leave, Payroll, Payslips, Payslip detail, Recruitment, Petty cash | ✅ 7/7 |
| Reference | County coverage, Link monitor | ✅ 2/2 |
| Insight | Reports (5 tabs) | ✅ 1/1 |
| Configure | Company (7 tabs), Staff profile, Client detail, Integrations | ✅ 4/4 |
| Auth & setup | Sign in, Permission denied, Onboarding | ✅ 3/3 |
| Alias routes | /staff /clients /depts /roles /workflow /sla /quality /workload | ✅ 8/8 |

## 4. Pages remaining

**None.** Every screen in the ZIP has a route and a component.

Two screens carry a lower fidelity than the rest, stated plainly rather than
claimed as equivalent:

- **Report generator** — the original carries its own banner saying this screen
  "is a proposal, not a reading of your system", because it was never captured in
  the reference screenshots. That banner is preserved. The React version matches
  the original's structure (Capture / Preview / Templates, field capture grouped
  by report section, export blocked while flags are unresolved).
- **Payroll** — structure, run state machine, six-step progress, register and
  statutory export buttons are all present. The original's own warning that "tax
  here is illustrative… confirm with whoever files your returns" is carried
  through, because those statutory rates were not independently verified.

## 5. Assets migrated

| Asset | Status |
|---|---|
| Inter 400/500/600/700 | ✅ Google Fonts, same weights |
| IBM Plex Mono 400/500/600 | ✅ Google Fonts, same weights |
| All CSS (inline `<style>`) | ✅ `src/styles/theme.css`, tokens verbatim |
| All JS (inline `<script>`) | ✅ `src/` as TypeScript |
| Icons (Unicode glyphs) | ✅ Ported character for character |
| Logo (CSS gradient + `◧`) | ✅ Ported |
| 2 reference PNGs | ✅ Kept in `original-reference/` — not referenced by any page |

**No broken paths.** The originals contain zero external stylesheets, script
files, `<img src>` or CSS `url()` references to local files — every page is
self-contained, so there were no relative paths that could break.

## 6. Functionality migrated

| Behaviour | Status |
|---|---|
| Hash router → TanStack Router | ✅ Typed routes, browser nav, direct URL, refresh |
| Sidebar navigation + active state | ✅ |
| Permission-filtered navigation | ✅ Reproduces `visibleNav()` special cases exactly |
| Tenant switching | ✅ |
| Sign in as any staff member | ✅ Navigation rebuilds per role |
| Dark mode toggle | ✅ |
| Sidebar collapse (< 820px) | ✅ |
| Filter pills | ✅ |
| Select filters | ✅ |
| Search inputs | ✅ Live filtering |
| Pipeline chip filtering | ✅ |
| Tabs (Reports 5, Company 7, RepGen 3) | ✅ |
| Row click → detail | ✅ Mouse + Enter/Space |
| Auto-assignment engine | ✅ Greedy least-loaded, capacity, availability, self-review block |
| Exception grouping by cause | ✅ All 4 causes with their remedies |
| SLA checkpoint decomposition | ✅ |
| "Cannot finish in time" detection | ✅ Distinct from "behind a checkpoint" |
| Self-review red avatar ring | ✅ |
| Due-date tone (late/soon/ok) | ✅ |
| Empty states | ✅ |
| Missing-record handling | ✅ "That order is not here" + way back, not a crash |
| Loading states | ✅ Real, via TanStack Query |

## 7. Known issues

1. **Not visually diffed against the original.** The build compiles and every
   route serves, but the browser pane would not composite frames in this
   environment, so no screenshot comparison was made. Tokens were ported value
   for value from `:root` / `body.dark`, so it should match — but "should" is not
   "verified".

2. **Two deliberate deviations from the original**, both accessibility fixes:
   - Sidebar group labels were `#5A6B86` on `#131A2B` = **3.31:1**. At 9.5px that
     is not WCAG "large text", so 4.5:1 applies and it failed. Changed to
     `#7C8CA8` (5.27:1).
   - Added `scroll-padding-top` so keyboard focus is not hidden behind the 56px
     sticky header (WCAG 2.2 SC 2.4.11, W3C failure technique F110).

   Everything else matches the original's values exactly.

3. **Data is in-memory.** `src/lib/api.ts` resolves from seed modules with
   simulated latency. Every read goes through TanStack Query, so swapping that
   one file for real `fetch` calls needs no component changes.

4. **Mutations are not wired.** Buttons that would write (Create order, Approve
   run, Add note) render and are interactive but do not persist — there is no
   backend. The original prototype had the same limitation; it stated so itself.

5. **Statutory payroll figures unverified.** Carried from the original along with
   its own warning. Do not pay anyone on them without confirmation.

6. **`titleflow.html` not migrated.** It is a different product
   (`<title>Titleflow — complete product</title>`), not a page of Title CRM.
   Preserved in `original-reference/`. Migrating it into Title CRM's route tree
   would invent structure the ZIP does not have.

## 8. Build status

```
tsc --noEmit          clean, 0 errors
vite build            clean, 191 modules
                      dist/index.html    0.67 kB │ gzip   0.41 kB
                      dist/assets/*.css 16.81 kB │ gzip   4.34 kB
                      dist/assets/*.js 450.38 kB │ gzip 133.12 kB
route check           39/39 resolve
```

## 9. Original preserved

- `Title CRM 897-handoff.zip` — **1,681,894 bytes, unmodified**
- `original-reference/` — full extraction, untouched, for reference
- `title-crm-897/` — working copy
- Backup branch `backup-before-react-migration` created before any change
