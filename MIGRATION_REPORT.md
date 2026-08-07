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
