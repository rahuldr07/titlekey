/**
 * Stage budgets and checkpoints — ported from the original BUDGET / checkpoints /
 * orderPlan. Shares are a percentage of the clock with per-product overrides
 * (40Y and FS+ carry their own splits), and a buffer is held back at the end.
 * The base numbers are the original designer's stated placeholders.
 */
import { ASSIGN_STAGES, NOW, PAIRS, prod, type Order } from '@/data/seed'
import { BUDGET, SLA, isDefaultRule, sharesFor } from '@/data/seed2'

/** client × product → hours; most specific rule wins, then the default row. */
export function slaFor(client: string, product: string): number {
  const exact = SLA.find((r) => r.cl === client && r.pr === product)
  if (exact) return exact.h
  const cl = SLA.find((r) => r.cl === client && r.pr === 'Any')
  if (cl) return cl.h
  const def = SLA.find(isDefaultRule)
  return def?.h ?? prod(product).h
}

export interface Checkpoint { stage: string; budgetH: number; dueAtH: number }

/** The checkpoint each department must hit, as hours from arrival. */
export function checkpoints(slaH: number, pr: string): Checkpoint[] {
  const usable = slaH * (1 - BUDGET.buffer / 100)
  const shares = sharesFor(pr)
  let cum = 0
  return ASSIGN_STAGES.map((stage) => {
    const budgetH = (usable * (shares[stage] ?? 0)) / 100
    cum += budgetH
    return { stage, budgetH, dueAtH: cum }
  })
}

const STATUS_STAGE: Record<string, string> = {
  search: 'Search', wip: 'Search', sq: 'Search QC', typing: 'Typing',
  tqc: 'Typing QC', rts: 'RTS', upload: 'RTS', sent: 'done', docreq: 'Search',
}

export interface OrderPlan {
  slaH: number
  rows: (Checkpoint & { at: Date; done: boolean; current: boolean; behind: boolean })[]
  elapsed: number
  needs: number
  remaining: number
  behind: boolean
  doomed: boolean
  short: number
  behindAt: string | null
}

/** Index of the stage an order is currently in, from its status. */
export function curIdx(o: Order): number {
  const cur = STATUS_STAGE[o.stt]
  if (cur === 'done' || o.done) return ASSIGN_STAGES.length
  return Math.max(0, ASSIGN_STAGES.indexOf(cur ?? ASSIGN_STAGES[0]!))
}

const r2 = (n: number) => Math.round(n * 100) / 100

/**
 * behind = past an internal checkpoint but recoverable;
 * doomed  = not enough clock left to do the remaining work at its budgeted pace.
 *
 * The stage in progress is NOT owed its whole slice — only the part it has not
 * already used. Counting the full slice would flag an order three hours into a
 * healthy Search.
 */
export function orderPlan(o: Order, now: Date = NOW): OrderPlan {
  const h = slaFor(o.cl, o.pr)
  const cps = checkpoints(h, o.pr)
  const i = curIdx(o)
  const elapsed = (now.getTime() - o.recv.getTime()) / 36e5

  const rows = cps.map((c, idx) => ({
    ...c,
    at: new Date(o.recv.getTime() + c.dueAtH * 36e5),
    done: idx < i,
    current: idx === i,
    behind: idx >= i && elapsed > c.dueAtH,
  }))

  const at = Math.max(0, i)
  const left = at >= cps.length
    ? 0
    : Math.max(0, cps[at]!.dueAtH - elapsed) +
      cps.slice(at + 1).reduce((a, c) => a + c.budgetH, 0)
  const remaining = h - elapsed

  return {
    slaH: h, rows, elapsed, needs: left, remaining,
    behind: rows.some((r) => r.behind),
    doomed: !o.done && left > remaining,
    short: r2(left - remaining),
    behindAt: rows.find((r) => r.behind)?.stage ?? null,
  }
}

export const atRisk = (o: Order, now: Date = NOW) => !o.done && orderPlan(o, now).doomed

export const selfReview = (stage: string, whoId: string, a: Record<string, string | null>) => {
  const paired = PAIRS[stage]
  return !!paired && a[paired] === whoId
}
