/**
 * SLA decomposition — one client promise split into per-stage checkpoints.
 *
 * ⚠ The 50/11/25/10/4 split is the prototype designer's stated GUESS:
 * "I picked these shares from how the work reads, not from timings."
 *
 * It is kept here so behaviour matches the design, but it is exported as data
 * with a `source` marker so a measured percentile split can replace it once
 * real cycle times exist. Do not hard-code these numbers anywhere else.
 */
import { NOW } from '@/data/seed'
import type { Order } from '@/data/types'

export type BudgetSource = 'default-guess' | 'measured-percentile'

export interface StageShare {
  department: string
  share: number
  source: BudgetSource
}

export const STAGE_SHARES: StageShare[] = [
  { department: 'Search',    share: 0.50, source: 'default-guess' },
  { department: 'Search QC', share: 0.11, source: 'default-guess' },
  { department: 'Typing',    share: 0.25, source: 'default-guess' },
  { department: 'Typing QC', share: 0.10, source: 'default-guess' },
  { department: 'RTS',       share: 0.04, source: 'default-guess' },
]

/** Fraction of the promise held back and not allotted to any stage. */
export const BUFFER = 0.1

export interface Checkpoint {
  department: string
  budgetHours: number
  /** Cumulative hours from receipt by which this stage should be done. */
  dueAtHours: number
  done: boolean
  behind: boolean
}

export interface OrderPlan {
  rows: Checkpoint[]
  /** Behind an internal checkpoint, but still recoverable. */
  behind: boolean
  /** The stages left need more time than the promise has remaining. */
  doomed: boolean
  shortHours: number
  behindAt: string | null
}

/**
 * The distinction the dashboard depends on: an order can be not-yet-late and
 * still unable to finish on time.
 */
export function orderPlan(order: Order, now: Date = NOW): OrderPlan {
  const usable = order.promiseHours * (1 - BUFFER)
  const elapsedH = (now.getTime() - order.receivedAt.getTime()) / 3_600_000
  const remainingH = (order.dueAt.getTime() - now.getTime()) / 3_600_000

  let cumulative = 0
  const rows: Checkpoint[] = STAGE_SHARES.map((s) => {
    const budgetHours = usable * s.share
    cumulative += budgetHours
    // A stage counts as done once someone is on it and the order has moved past it.
    const done = isStageComplete(order, s.department)
    return {
      department: s.department,
      budgetHours,
      dueAtHours: cumulative,
      done,
      behind: !done && elapsedH > cumulative,
    }
  })

  const needed = rows.filter((r) => !r.done).reduce((a, r) => a + r.budgetHours, 0)
  const shortHours = needed - remainingH

  return {
    rows,
    behind: rows.some((r) => r.behind),
    doomed: !order.done && shortHours > 0,
    shortHours: Math.max(0, shortHours),
    behindAt: rows.find((r) => r.behind)?.department ?? null,
  }
}

/** Stage order defines "past it" — a stage is complete once a later one is active. */
const STAGE_SEQUENCE = ['Search', 'Search QC', 'Typing', 'Typing QC', 'RTS']

const STATUS_STAGE: Record<string, string> = {
  search: 'Search', wip: 'Search', sq: 'Search QC', typing: 'Typing',
  tqc: 'Typing QC', rts: 'RTS', upload: 'RTS', sent: 'done', docreq: 'Search',
}

function isStageComplete(order: Order, department: string): boolean {
  if (order.done) return true
  const current = STATUS_STAGE[order.status]
  if (current === 'done') return true
  const at = STAGE_SEQUENCE.indexOf(current ?? '')
  const mine = STAGE_SEQUENCE.indexOf(department)
  return at >= 0 && mine >= 0 && mine < at
}

/** True when the order cannot finish in the time its promise has left. */
export const atRisk = (order: Order, now: Date = NOW) => orderPlan(order, now).doomed
