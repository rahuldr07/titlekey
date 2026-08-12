/**
 * The 90-day QC history — a verbatim port of the original's makeQCLog().
 *
 * The original does not hand-write quality data: it synthesises 90 days of
 * deliveries and ratings from a SEEDED generator, so the same numbers come back
 * on every load. The seed is the frozen date (20260803) and the generator is a
 * plain LCG; reproducing both exactly is what makes the React figures match the
 * original's rather than merely resemble them.
 *
 * Call order matters. qrnd() is consumed in a fixed sequence inside makeQCLog —
 * day, count, client, product, stage owners, stage durations, the doc-request
 * roll, then the two QC pairs. Any added or removed draw shifts every number
 * after it, so this file mirrors the original's control flow statement by
 * statement rather than tidying it.
 */
import { ASSIGN_STAGES, NOW, STAFF, type Staff } from '@/data/seed'
import { SLA, isDefaultRule } from '@/data/seed2'
import { CLIENTMIX, PRODMIX } from '@/lib/day'
import { checkpoints } from '@/lib/sla'
import { fmtDate } from '@/lib/format'

export const QCDAYS = 90

/* Not every department behaves the same. Search carries the variance; the QC
   stages are short and predictable. These shape the generated history. */
const STAGEPRESSURE: Record<string, number> = {
  Search: 0.92, 'Search QC': 0.72, Typing: 0.84, 'Typing QC': 0.70, RTS: 0.62,
}
const STALL: Record<string, number> = {
  Search: 0.035, 'Search QC': 0.010, Typing: 0.022, 'Typing QC': 0.008, RTS: 0.006,
}

/* What a rater actually writes when a score drops — real abstracting defects,
   grouped by the criterion they belong to. */
export const QCREASONS: Record<string, string[]> = {
  Accuracy: ['Book/Page transposed from the index',
    'Grantee spelled from the deed, not the recorded index',
    'Consideration taken from the wrong instrument',
    'Mortgage amount out by a digit',
    'Instrument # belongs to the assignment, not the mortgage',
    'Effective date read as the execution date'],
  Completeness: ['Open 2019 mortgage not reported',
    'Judgment search missing for the co-borrower',
    'Prior effective date not carried forward on an update',
    'Current tax year not shown',
    'Legal description truncated at the metes call',
    'Assignment chain stops before the current holder'],
  Formatting: ['Dates entered DD/MM in a US report',
    'Money written without cents',
    'Names in caps where this client wants Title Case',
    'Book/Page given where the client uses Instrument #',
    'County name omitted from the property address',
    'Not Available written as N/A'],
}

/* The original's slaHours — four rules, most specific first. Kept separate from
   slaFor() in sla.ts because the generator passes a bare {cl,pr}, and because
   the original's final fallback is a literal 24 rather than the product table. */
const slaHours = (o: { cl: string; pr: string }): number => {
  const r = SLA.find((x) => x.cl === o.cl && x.pr === o.pr)
    ?? SLA.find((x) => x.cl === o.cl && x.pr === 'Any')
    ?? SLA.find((x) => x.pr === o.pr && isDefaultRule(x))
    ?? SLA.find(isDefaultRule)
  return r ? r.h : 24
}

export interface Delivery {
  id: string; d: Date; dk: string; cl: string; pr: string
  slaH: number; st: Record<string, number>
  by: Record<string, string>; byName: Record<string, string>
  hrs: number; late: boolean
}
export interface QcRow {
  d: Date; dk: string; order: string; cl: string; pr: string; stage: string
  on: string; onName: string; by: string; byName: string
  acc: number; comp: number; fmt: number; avg: number; defect: boolean
  crit: string | null; note: string | null
}

function makeQCLog(): { log: QcRow[]; dels: Delivery[] } {
  /* The seed and the LCG, exactly as the original declares them. Products stay
     under 2^53 so plain Number arithmetic reproduces the original bit for bit. */
  let qseed = 20260803
  const qrnd = () => { qseed = (qseed * 1664525 + 1013904223) % 4294967296; return qseed / 4294967296 }
  const pickOf = <T,>(a: T[]): T => a[Math.floor(qrnd() * a.length)]!

  const log: QcRow[] = []
  const dels: Delivery[] = []
  const inDept = (d: string) => STAFF.filter((s) => s.dep.includes(d))
  const pairs = ([['Search QC', 'Search'], ['Typing QC', 'Typing']] as [string, string][])
    .filter(([q, w]) => inDept(q).length && inDept(w).length)
  if (!pairs.length) return { log, dels }

  /* Skewed hard towards 5, because that is what your system actually shows. The
     point of the report is that this distribution ranks nobody. */
  const score = () => { const r = qrnd(); return r < 0.95 ? 5 : r < 0.99 ? 4 : r < 0.997 ? 3 : 2 }

  let n = 0
  for (let back = QCDAYS - 1; back >= 0; back--) {
    const d = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - back, 14, 0)
    const count = 5 + Math.floor(qrnd() * 8)
    for (let i = 0; i < count; i++, n++) {
      const cl = pickOf(CLIENTMIX)
      const pr = pickOf(PRODMIX)
      /* The promise is captured at order time, the way a real system records it —
         editing the SLA table later must not rewrite history. */
      const slaH = slaHours({ cl, pr })
      const plan = checkpoints(slaH, pr)
      /* Who did each stage is recorded once, so a person's quality score and their
         turnaround refer to the same work on the same order. */
      const by: Record<string, string> = {}
      const byName: Record<string, string> = {}
      ASSIGN_STAGES.forEach((g) => {
        const pool = inDept(g)
        if (pool.length) { const p = pickOf(pool); by[g] = p.id; byName[g] = p.n }
      })
      const st: Record<string, number> = {}
      let total = 0
      plan.forEach((c) => {
        /* Most stages come in under budget. Search runs hottest — it is the stage
           with the real-world variance, and the one that eats everyone's slack. */
        const p = STAGEPRESSURE[c.stage] !== undefined ? STAGEPRESSURE[c.stage]! : 0.80
        const f = qrnd() < STALL[c.stage]! ? 1.5 + qrnd() * 1.6 : p * (0.6 + qrnd() * 0.75)
        const h = c.budgetH * f
        st[c.stage] = h
        total += h
      })
      if (qrnd() < 0.022) total += slaH * (0.15 + qrnd() * 0.45)  // doc request, waiting on the client
      const del: Delivery = {
        id: `41${String(80000 + n)}-1`, d, dk: fmtDate(d), cl, pr,
        slaH, st, by, byName, hrs: total, late: total > slaH,
      }
      dels.push(del)
      pairs.forEach(([qstage, wstage]) => {
        const worker: Staff = STAFF.find((x) => x.id === del.by[wstage]) ?? pickOf(inDept(wstage))
        const rater: Staff = pickOf(inDept(qstage).filter((x) => x.id !== worker.id)) ?? pickOf(inDept(qstage))
        if (qrnd() > 0.67) return                       // a third of the work is never rated
        const acc = score(), comp = score(), fmt = score()
        const lowest = ([['Accuracy', acc], ['Completeness', comp], ['Formatting', fmt]] as [string, number][])
          .sort((a, b) => a[1] - b[1])[0]!
        log.push({
          d, dk: fmtDate(d), order: del.id, cl, pr, stage: wstage,
          on: worker.id, onName: worker.n, by: rater.id, byName: rater.n,
          acc, comp, fmt, avg: (acc + comp + fmt) / 3, defect: Math.min(acc, comp, fmt) <= 3,
          /* a score below 5 without a reason teaches nobody anything */
          crit: lowest[1] < 5 ? lowest[0] : null,
          note: lowest[1] < 5 ? pickOf(QCREASONS[lowest[0]]!) : null,
        })
      })
    }
  }
  return { log, dels }
}

/* Built once, lazily — 90 days of synthesis is not work to repeat per render,
   and doing it at import cost first paint for visitors who never open Reports. */
let _qc: { log: QcRow[]; dels: Delivery[] } | null = null
const qc = () => (_qc ??= makeQCLog())
export const getQCLog = (): QcRow[] => qc().log
export const getDeliveries = (): Delivery[] => qc().dels

/* ── date ranges ──
   One engine, keyed by a prefix, so Quality and Turnaround can be scoped
   independently — you often want quality over 90 days and turnaround over 7. */
export const QPRESETS: [string, string, number | null][] = [
  ['7', 'Last 7 days', 7], ['30', 'Last 30 days', 30], ['90', 'Last 90 days', 90], ['mtd', 'This month', null],
]
export interface Range { from: Date; to: Date; label: string; preset: string }

export function rangeOf(preset: string, from?: string, to?: string): Range {
  const p = preset || '30'
  if (p === 'custom' && from && to) {
    return { from: new Date(from), to: new Date(to), label: 'custom range', preset: 'custom' }
  }
  if (p === 'mtd') {
    return { from: new Date(NOW.getFullYear(), NOW.getMonth(), 1), to: NOW, label: 'this month', preset: 'mtd' }
  }
  const days = (QPRESETS.find((x) => x[0] === p) ?? QPRESETS[1]!)[2]!
  return {
    from: new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - (days - 1)),
    to: NOW, label: `last ${days} days`, preset: p,
  }
}

/* Takes a bare {from,to} because the weekly coverage loop builds windows that
   carry no label or preset — the original passes the same shape. */
export const inRange = (d: Date, r: { from: Date; to: Date }) =>
  d >= new Date(r.from.getFullYear(), r.from.getMonth(), r.from.getDate())
  && d <= new Date(r.to.getFullYear(), r.to.getMonth(), r.to.getDate(), 23, 59, 59)

export const median = (a: number[]): number => {
  if (!a.length) return 0
  const x = [...a].sort((p, q) => p - q)
  return x.length % 2 ? x[(x.length - 1) / 2]! : (x[x.length / 2 - 1]! + x[x.length / 2]!) / 2
}

export interface StageWork {
  n: string; c: number; over: number; onBudget: number; ratio: number
  causedLate: number; expected: number; vsPeers: number; erratic: boolean
  stages: Record<string, { ratio: number; over: boolean }[]>
}

/** How each person did against the clock, measured within their own departments. */
export function stageWorkOf(dels: Delivery[]): Record<string, StageWork> {
  interface Rec { d: Delivery; st: string; h: number; budget: number; ratio: number; over: boolean }
  const m: Record<string, { n: string; items: Rec[]; stages: Record<string, Rec[]> }> = {}
  dels.forEach((d) => {
    const plan = checkpoints(d.slaH, d.pr)
    ASSIGN_STAGES.forEach((stage) => {
      const name = d.byName?.[stage]; if (!name) return
      const c = plan.find((y) => y.stage === stage); if (!c || !c.budgetH) return
      const h = d.st[stage]!
      m[name] ??= { n: name, items: [], stages: {} }
      const rec: Rec = { d, st: stage, h, budget: c.budgetH, ratio: h / c.budgetH, over: h > c.budgetH }
      m[name]!.items.push(rec);
      (m[name]!.stages[stage] ??= []).push(rec)
    })
  })
  /* Departments are not equally hard to hit. RTS almost never overruns; Search
     routinely does. Judging a searcher against an RTS clerk's percentage would be
     a comparison of job, not of person — so each person is measured against the
     departments they actually worked in. */
  const dept: Record<string, { n: number; over: number; rate: number }> = {}
  Object.values(m).forEach((p) => p.items.forEach((x) => {
    dept[x.st] ??= { n: 0, over: 0, rate: 100 }
    dept[x.st]!.n++; if (x.over) dept[x.st]!.over++
  }))
  Object.keys(dept).forEach((k) => {
    dept[k]!.rate = Math.round((dept[k]!.n - dept[k]!.over) / dept[k]!.n * 100)
  })
  const out: Record<string, StageWork> = {}
  Object.values(m).forEach((p) => {
    const c = p.items.length
    const over = p.items.filter((x) => x.over).length
    const onBudget = Math.round((c - over) / c * 100)
    const ratio = median(p.items.map((x) => x.ratio))
    /* what someone doing this exact mix of stages would typically manage */
    const expected = Math.round(ASSIGN_STAGES.reduce((a, stage) => {
      const nn = (p.stages[stage] ?? []).length
      return a + nn * (dept[stage]?.rate ?? 100)
    }, 0) / c)
    out[p.n] = {
      n: p.n, c, over, onBudget, ratio,
      /* only counts against the person if their own stage was the one that overran */
      causedLate: p.items.filter((x) => x.over && x.d.late).length,
      expected, vsPeers: onBudget - expected,
      /* a good median with a poor hit rate means variance, not slowness */
      erratic: ratio <= 1.02 && onBudget < 65,
      stages: Object.fromEntries(Object.entries(p.stages).map(([k, v]) =>
        [k, v.map((x) => ({ ratio: x.ratio, over: x.over }))])),
    }
  })
  return out
}

/** The plain-English read of the two axes together. */
export function standing(q: number, vsPeers: number, teamQ: number): [string, string, string] {
  const clean = q >= teamQ - 0.03, quick = vsPeers >= -5
  if (clean && quick) return ['Fast and clean', 'v', 'Hits the budget and the quality bar. Nothing to do.']
  if (clean && !quick) return ['Careful but slow', 'r', 'Quality holds up; the time does not — and not just because of the stages they are given, since this compares them with others doing the same ones.']
  if (!clean && quick) return ['Quick, but marks come off', 'r', 'Faster than their peers and below the quality line — the classic trade, being made without anyone deciding to make it.']
  return ['Behind on both', 'd', 'Below the quality line and over the budget. This is the one to look at first.']
}
