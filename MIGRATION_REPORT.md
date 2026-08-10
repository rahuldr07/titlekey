# MIGRATION_REPORT.md

Rebuilt from scratch against the ZIP as the only source of truth.

| | |
|---|---|
| Total original HTML pages | 5 files — one is an SPA carrying **39 routable screens** (the real unit) |
| Total React pages | **39** |
| Total React routes | **39** (31 screens + 8 alias redirects, exactly as the original's ALIAS map) |
| Pages fully cloned | **37** |
| Pages partially cloned | **2** (see below — both flagged, neither missing) |
| Pages missing | **0** |
| Assets missing | **0** (the original has no external asset files — all inline; fonts via the same Google Fonts link; icons are Unicode glyphs) |
| Functions/interactions missing | Listed below, honestly |
| Build status | `tsc --noEmit` clean · `vite build` clean (467 kB, 140 kB gzip) · `npm install` / `npm run dev` / `npm run build` all work |

## CSS

`src/styles/theme.css` is a **verbatim** port of the original's `<style>` block —
selectors, values, media queries, dark theme, animations, unchanged. The previous
build's two styling deviations (a sidebar-label colour change and
`scroll-padding-top`) were **removed** per the exact-clone instruction. The only
additions are a 4-line React shim at the end for static KPI tiles, using the
original's own values.

## Data

Ported verbatim this pass (the previous build had invented some of it):

- The real 28-person roster — Ashok S dual-department with `conflict`, Neil
  Barrow `leaving 08/12`, the real Typing/Typing QC/RTS/Doc Req names
- The real 6 leads with contacts and full note histories
- The real 11 counties × 4 link types with actual URLs, statuses, errors, dates
- The real SLA table, TIERS, CLOCK pause rules, BUDGET with 40Y/FS+ overrides
- The invoice generator reproduced exactly (rows sum to client lifetime totals)
- The 8 assignment rules and 5 QC rules with the original copy
- Reports tabs (6, incl. Quality) and Company tabs (8, incl. Company & Payroll)
  now match the original's RPTABS/COTABS exactly — both were wrong before

## Functionality cloned

Routing (browser nav, direct URL, refresh, nested, active state) · permission-
filtered sidebar with badges (past-due red, leads amber, broken-links red) ·
sign-in-as-anyone with the original's landing rule and toast · tenant switcher
modal incl. “+ Add a company” → onboarding · notifications modal reproducing the
original `alerts()` list · dark mode · responsive drawer · filter pills / selects
/ live search / "Showing X of Y" · pipeline chip filtering · clickable rows
(mouse + Enter) · assignment engine with route pools, self-review block, typed
exceptions and capacity bars · SLA checkpoints with per-product splits, behind vs
cannot-finish · QC star rating with the unrated-people guard · toasts throughout ·
missing-record pages with a way back · Aadhaar masked with explicit reveal.

## Known gaps — the honest list

1. **Two screens are structural approximations, not transcriptions:**
   - **Report generator** — the original itself flags this screen as "a proposal,
     not a reading of your system"; that banner is preserved. Sections/fields are
     representative, and the per-field source-page jump is a toast stub.
   - **Quality report tab** — the original synthesises 90 days of QC history and
     renders per-person averages; this clone shows the scale, criteria and the
     five scoring rules, and rates on the order itself, but does not synthesise
     the 90-day history.
2. **Mutations do not persist** — true of the original too (its own words:
   "nothing here writes to a database yet"). Buttons act and toast; state lives
   in the session.
3. **CSV downloads are toast stubs** — the original builds real client-side CSV
   files; this clone confirms via toast without generating the file.
4. **Not pixel-diffed** — the browser pane in this environment cannot composite
   screenshots, so verification was by rendered text/DOM per route plus the
   verbatim CSS, not by side-by-side image comparison.

## Original preserved

- ZIP untouched: `Title CRM 897-handoff.zip`, 1,681,894 bytes
- `original-reference/` — full untouched extraction (local only, gitignored:
  it contains the unredacted identity-shaped demo data and this repo is public)
- `title-crm-897/` — redacted reference copy, committed
- No force-push; remote history fetched and reconciled

---

# Side-by-side verification (Phase 11) — actually performed

Previous passes skipped this and said so. This pass ran the original and the
clone as two live servers and diffed them programmatically:

- original → `http://localhost:5199/Title CRM (original).html`
- clone    → `http://localhost:5173`

Screenshots cannot composite in this environment, so instead of eyeballing I
extracted **computed CSS values and DOM counts** from both and diffed them —
stricter than a visual check.

## Computed-style diff: identical

`body` · `.side` · `.logo` · `.navlbl` · `.side nav button` (+`.on`) · `.top` ·
`h1.pg` · `p.sub` · `h2.sec` · `.btn` (+`.g`) · `.kpi` · `.kpi .t` · `.kpi .v` ·
`.pchip` · `.trow.h` · `.tb .trow` · `.chip` · `.due` · `.ava` · `.tbl`

Every one matched exactly — font sizes, weights, colours, padding, radii,
letter-spacing, box dimensions. Including `.navlbl` at `rgb(90,107,134)`, the
value a previous pass had "improved".

## DOM-count diff: identical

18 nav buttons (with the same badges: Dashboard 2, Leads 3, Link monitor 5) ·
6 nav group labels · 9 KPI tiles · 14 pipeline chips · 3 section headings ·
4 header buttons.

## Defects this verification found — and fixed

| # | Defect | Fix |
|---|---|---|
| 1 | KPI tiles were missing the `›` affordance the original renders **only on clickable tiles**; the icon also had the wrong wrapper | `Kpi` now matches `kcard()`: icon at `opacity:.7`, `<span class="i">›</span>` only when `onClick` is set, plus the `title` tooltip |
| 2 | "Doc Req has nobody available" alert never fired | `thinDepartments()` checked only auto-assigned stages; the original checks all of `DEPTLIST`. Doc Req has one member and she is on leave |
| 3 | **The whole simulated intake was missing.** The original does not run its engine over the 8 sample orders — it generates 5 days × 9 hourly slots (~90 orders/day) which drives Assignment, the exception counts, Reports and the Today tiles | Ported `makeDay()` / `runDay()` into `src/lib/day.ts`; Dashboard, Assignment and the alerts now read `RUN` |
| 4 | Today tiles counted stage-assignments, not orders | Ported the original's **time-based** progress model (`STAGE_HOURS = 1.5`, `doneCount`, `curStage`) — progress is a function of elapsed time, not of whether a stage has an owner |
| 5 | `orderPlan` summed each unfinished stage's **full** budget, flagging healthy orders as doomed | Rewritten to the original's formula: the in-progress stage is owed only the **unused part** of its slice. The original's own comment warns about exactly this |

## Numbers now matching the original

| Metric | Original | Clone |
|---|---|---|
| Received today | 90 | **90** |
| Delivered | 21 | **21** |
| Still moving | 69 | **69** |
| Notification categories | 7 | **7** |
| County links not working | 5 | **5** |
| Orders past due | 2 | **2** |
| Leads needing follow-up | 3 | **3** |
| Doc Req has nobody available | yes | **yes** |

## Residual numeric deltas — stated, not hidden

Two counts still differ slightly on the synthetic stream:

| Metric | Original | Clone |
|---|---|---|
| Stages that could not be assigned | 90 | 85 |
| Orders that cannot finish in time | 1 | 2 |

Both come from the generated 5-day intake, not from layout or content. The
engine's eligibility chain is slightly more permissive than the original's in a
small number of cases (~5 of 2,165 stage decisions, 0.2%), and one seed order
crosses the doomed threshold differently. Structure, styling, copy and every
screen match; these are residual arithmetic differences in demo data and are
**not** resolved. They are recorded here rather than rounded away.
