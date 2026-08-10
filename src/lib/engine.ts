/**
 * The assignment pass — the original's eligibility chain in order:
 * department membership → availability → route pools (r5) → self-review →
 * daily target → fill the emptiest first. Unplaceable stages become typed
 * exceptions, each cause with its own fix.
 */
import { ASSIGN_STAGES, DEPTLIST, ORDERS, PAIRS, STAFF, type Order, type Staff } from '@/data/seed'
import { RULES } from '@/data/seed2'

export type ExceptionCause = 'capacity' | 'unavailable' | 'no-dept' | 'self'

export const EXCLABEL: Record<ExceptionCause, readonly [string, string]> = {
  capacity: ['Everyone at their daily target', 'r'],
  'no-dept': ['No one in the department', 'd'],
  unavailable: ['Everyone on leave or off shift', 'r'],
  self: ['Only the person who did the paired stage was free', 'r'],
}

export interface Placement { o: Order; stage: string; who: Staff; why: string }
export interface Exc { o: Order; stage: string; cause: ExceptionCause }

export function runEngine(orders: Order[] = ORDERS, staff: Staff[] = STAFF) {
  const load: Record<string, number> = {}
  for (const s of staff) load[s.id] = s.open

  const placements: Placement[] = []
  const exc: Exc[] = []

  for (const o of orders) {
    if (o.done) continue
    for (const stage of ASSIGN_STAGES) {
      if (o.a[stage]) continue

      let pool = staff.filter((s) => s.dep.includes(stage) && s.active)
      if (!pool.length) { exc.push({ o, stage, cause: 'no-dept' }); continue }

      pool = pool.filter((s) => s.avail === 'ok')
      if (!pool.length) { exc.push({ o, stage, cause: 'unavailable' }); continue }

      // route rules — e.g. "LIEN typing group": only the named pool
      for (const r of RULES) {
        if (r.k !== 'route' || !r.on || !r.cond) continue
        if (r.cond.stage && r.cond.stage !== stage) continue
        if (r.cond.product && r.cond.product !== o.pr) continue
        if (r.cond.state && r.cond.state !== o.st) continue
        pool = pool.filter((s) => r.pool?.includes(s.id))
      }
      if (!pool.length) { exc.push({ o, stage, cause: 'no-dept' }); continue }

      // self-review — never the person who did the paired stage
      const paired = PAIRS[stage]
      if (paired) pool = pool.filter((s) => o.a[paired] !== s.id)
      if (!pool.length) { exc.push({ o, stage, cause: 'self' }); continue }

      pool = pool.filter((s) => (load[s.id] ?? 0) < s.cap)
      if (!pool.length) { exc.push({ o, stage, cause: 'capacity' }); continue }

      pool.sort((a, b) => (load[a.id]! / a.cap) - (load[b.id]! / b.cap))
      const pick = pool[0]!
      load[pick.id] = (load[pick.id] ?? 0) + 1
      placements.push({
        o, stage, who: pick,
        why: `emptiest in ${stage} at ${load[pick.id]}/${pick.cap}`,
      })
    }
  }
  return { placements, exc, load }
}

/**
 * Departments with nobody available at all — the original's "thin" alert.
 * Checks DEPTLIST, not just the auto-assigned stages: Doc Req has one member
 * and she is on leave, which the original reports and an ASSIGN_STAGES-only
 * check would silently miss.
 */
export function thinDepartments(): string[] {
  return DEPTLIST
    .filter((d) => !STAFF.some((s) => s.dep.includes(d.n) && s.active && s.avail === 'ok'))
    .map((d) => d.n)
}
