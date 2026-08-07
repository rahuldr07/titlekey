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
function stageDone(o: Order, stage: string): boolean {
  if (o.done) return true
  const cur = STATUS_STAGE[o.stt]
  if (cur === 'done') return true
  const at = ASSIGN_STAGES.indexOf(cur ?? '')
  const mine = ASSIGN_STAGES.indexOf(stage)
  return at >= 0 && mine >= 0 && mine < at
}

export interface OrderPlan {
  rows: (Checkpoint & { done: boolean; behind: boolean })[]
  behind: boolean
  doomed: boolean
  short: number
  behindAt: string | null
}

/** behind = recoverable slippage; doomed = the stages left need more time than remains. */
export function orderPlan(o: Order, now: Date = NOW): OrderPlan {
  const slaH = (o.due.getTime() - o.recv.getTime()) / 3_600_000
  const cps = checkpoints(slaH, o.pr)
  const elapsed = (now.getTime() - o.recv.getTime()) / 3_600_000
  const left = (o.due.getTime() - now.getTime()) / 3_600_000
  const rows = cps.map((cp) => {
    const done = stageDone(o, cp.stage)
    return { ...cp, done, behind: !done && elapsed > cp.dueAtH }
  })
  const needed = rows.filter((r) => !r.done).reduce((a, r) => a + r.budgetH, 0)
  const short = needed - left
  return {
    rows,
    behind: rows.some((r) => r.behind),
    doomed: !o.done && short > 0,
    short: Math.max(0, short),
    behindAt: rows.find((r) => r.behind)?.stage ?? null,
  }
}

export const atRisk = (o: Order, now: Date = NOW) => orderPlan(o, now).doomed

export const selfReview = (stage: string, whoId: string, a: Record<string, string | null>) => {
  const paired = PAIRS[stage]
  return !!paired && a[paired] === whoId
}
