# Title CRM

A multi-tenant production system for title-abstract companies — a US title-search
operation run by an India-based back office.

Built as a complete, self-contained HTML/CSS/JavaScript application. No build step,
no dependencies, no server. Open a file in a browser and the whole product runs.

---

## Project structure

```
.
├── README.md
├── .gitignore
└── title-crm-897/
    ├── README.md                          Original handoff notes
    └── project/
        ├── Title CRM (original).html      Main application (Google Fonts CDN)
        ├── Title CRM - standalone.html    Same app, fonts inlined — works offline
        └── uploads/
            ├── titlecrm.html              Earlier revision (superseded)
            ├── pasted-*.png               Reference screenshots
            └── titlecrm/
                ├── titlecrm.html          Duplicate of the above
                └── titleflow.html         Companion prototype — "Titleflow"
```

Every page is fully self-contained: CSS lives in `<style>`, JavaScript in
`<script>`, and all fonts and images are embedded as `data:` URIs. There are no
external stylesheets, no script files and no linked images — so there are no
relative paths that can break.

---

## How to run locally

**Simplest — no tooling required.** Double-click:

```
title-crm-897/project/Title CRM - standalone.html
```

Use the standalone build; its fonts are embedded, so it renders correctly with no
internet connection.

**Via a local server** (optional — useful if you want a clean `localhost` URL):

```bash
cd title-crm-897/project
python -m http.server 8000
```

Then open <http://localhost:8000/Title%20CRM%20-%20standalone.html>

> `Title CRM (original).html` is the same application but loads Inter and IBM Plex
> Mono from Google Fonts, so it needs a connection to display correctly.

---

## Main pages and features

The application is a single-page app with 39 screens across six areas.

### Production
| Screen | What it does |
|---|---|
| Dashboard | Live KPIs, clickable pipeline filter, past-due queue |
| Orders | Full order list with filters, search and per-stage assignee avatars |
| Order detail | Stage assignment, documents, notes, QC ratings |
| Assignment | Automatic work distribution with a decision trail and dry-run |
| Order intake | Incoming order triage |
| My work | Per-person queue for staff accounts |
| Report generator | Field capture by report section |

### Business
Leads pipeline with follow-up tracking, and invoicing with per-client statements.

### HRMS
Attendance with GPS check-in, leave management, payroll runs, payslips,
recruitment and petty cash.

### Reference
County coverage and a link monitor that tracks county record sources.

### Insight
Reports across six tabs — Received, Assigned, Turnaround, By staff,
By department and Quality.

### Configure
Company settings, staff, clients, departments, roles, workflow and SLA rules.

### Notable behaviour
- **Multi-tenant** — switch companies from the sidebar; data and settings follow.
- **Role-based access** — sign in as any staff member from the header avatar and
  the navigation changes to match their permissions.
- **Dark mode** — full theme, toggled from the header.
- **Self-review prevention** — the same person cannot both do and QC a stage.
- **SLA tracking** — distinguishes "behind an internal checkpoint" from
  "cannot finish in time", before an order is actually late.
- **Responsive** — the sidebar collapses to a drawer below 820px.
- **Accessible** — skip link, keyboard-navigable rows, focus management,
  and a `prefers-reduced-motion` fallback.

> The clock is fixed at Mon 3 Aug 2026, 5:30 PM ET. Every relative due date
> ("2h overdue", "in 5h") is calculated from that point.

---

## Technologies used

| | |
|---|---|
| **HTML5** | Semantic markup, ARIA roles, `<template>` |
| **CSS3** | Custom properties for theming, Grid, Flexbox, `@media` queries, `:has()` |
| **JavaScript (ES2020+)** | Vanilla — no framework, no build step |
| **Fonts** | Inter, IBM Plex Mono — embedded as base64 in the standalone build |
| **Architecture** | Hash-based client-side router, template-literal rendering |

No frameworks, no bundler, no `node_modules`, no compilation.

---

## Browser support

Any modern browser. Uses `:has()`, CSS custom properties and `backdrop-filter`,
so it needs Chrome/Edge 105+, Firefox 121+ or Safari 15.4+.
