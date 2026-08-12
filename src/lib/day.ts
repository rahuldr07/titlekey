/**
 * The simulated intake — ported from the original's makeDay() / runDay().
 *
 * The original does NOT run its engine over the eight hand-written ORDERS; it
 * generates five days of arrivals (today and the four before it), 9 hourly slots
 * each, weighted so it reads like a real day's intake rather than a round robin.
 * That stream is what drives the Assignment screen, the exception counts, the
 * Reports tabs and the Dashboard's "Today" tiles.
 */
import {
  ASSIGN_STAGES, NOW, PAIRS, STAFF, STAGES, type Staff,
} from '@/data/seed'
import { COUNTIES, RULES } from '@/data/seed2'
import { fmtDate } from '@/lib/format'

export const DAYCOUNT = 5
const dayDate = (i: number) =>
  new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - (DAYCOUNT - 1 - i))
const dayKey = (d: Date) => fmtDate(d)

/* the mix is weighted so it reads like a real day's intake rather than a round robin.
   Exported because the QC history generator draws from the same two mixes. */
export const PRODMIX = ['COS', 'COS', 'COS', 'COS', 'Update', 'Update', 'TOS', 'PRLP', 'LIEN', '10Y', '20Y', '30Y', '40Y', 'FS+']
export const CLIENTMIX = ['MGR', 'MGR', 'MGR', 'MGR', 'MGR', 'CSS', 'CSS', 'NJ', 'Morris James', 'NTC']

export interface DayOrder {
  id: string; hr: number; date: Date; dk: string; today: boolean
  recv: Date; pr: string; st: string; cl: string; co: string
  a: Record<string, string | null>
}
export interface Slot { hr: number; orders: DayOrder[] }
export interface Day { date: Date; dk: string; arrivals: Slot[] }

export function makeDay(): Day[] {
  const states = ['PA', 'GA', 'CT', 'KY', 'TN', 'AK']
  /* an order without a county cannot be judged against a county rule, and every
     real order has one — the property sits somewhere */
  const cosIn: Record<string, string[]> = {}
  states.forEach((st) => { cosIn[st] = COUNTIES.filter((c) => c.st === st).map((c) => c.n) })
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17]
  const perDay = [
    [9, 10, 8, 11, 9, 8, 10, 9, 7], [10, 11, 9, 12, 10, 9, 11, 10, 8],
    [8, 9, 7, 10, 8, 7, 9, 8, 6], [11, 12, 10, 13, 11, 10, 12, 11, 9],
    [10, 11, 9, 12, 10, 9, 11, 10, 8],
  ]
  let n = 0
  const days: Day[] = []
  for (let di = 0; di < DAYCOUNT; di++) {
    const date = dayDate(di)
    const arrivals: Slot[] = []
    hours.forEach((h, hi) => {
      const list: DayOrder[] = []
      for (let i = 0; i < perDay[di]![hi]!; i++, n++) {
        const stt = states[n % states.length]!
        const cos = cosIn[stt]?.length ? cosIn[stt]! : ['—']
        list.push({
          id: `4193${String(101 + n).padStart(3, '0')}-1`,
          hr: h, date, dk: dayKey(date), today: di === DAYCOUNT - 1,
          recv: new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, 0),
          pr: PRODMIX[n % PRODMIX.length]!,
          st: stt,
          cl: CLIENTMIX[n % CLIENTMIX.length]!,
          co: cos[n % cos.length]!,
          a: Object.fromEntries(STAGES.map((s) => [s, null])),
        })
      }
      arrivals.push({ hr: h, orders: list })
    })
    days.push({ date, dk: dayKey(date), arrivals })
  }
  return days
}

export type ExcWhy = 'capacity' | 'unavailable' | 'no-dept' | 'self'
export interface Assign {
  o: DayOrder; stage: string; who: string; hr: number; dk: string; today: boolean
}
export interface Exc {
  o: DayOrder; stage: string; why: ExcWhy; t: string; dk: string; today: boolean
}

/** Applies the rules in order and records WHY each choice was made. */
export function runDay(days: Day[]) {
  const load: Record<string, number> = {}
  const fired: Record<string, number> = {}
  const narrowed: Record<string, number> = {}
  RULES.forEach((r) => { fired[r.id] = 0; narrowed[r.id] = 0 })

  const assigns: Assign[] = []
  const exc: Exc[] = []

  /* departments where every member is unavailable — the stage cannot run at all */
  const deptOut = [...new Set(STAGES.filter((g) => {
    const m = STAFF.filter((s) => s.dep.includes(g))
    return m.length > 0 && m.every((s) => s.avail !== 'ok')
  }))]

  for (const day of days) {
    /* A daily target resets each morning, so each day is dealt afresh. */
    STAFF.forEach((s) => { load[s.id] = s.open })
    for (const slot of day.arrivals) {
      for (const o of slot.orders) {
        for (const stage of ASSIGN_STAGES) {
          let pool: Staff[] = STAFF.filter((s) => s.dep.includes(stage) && s.active)
          fired.r1 = (fired.r1 ?? 0) + 1
          if (!pool.length) {
            exc.push({ o, stage, why: 'no-dept', t: 'Nobody belongs to that department',
              dk: day.dk, today: o.today })
            continue
          }

          const before = pool.length
          pool = pool.filter((s) => s.avail === 'ok')
          fired.r2 = (fired.r2 ?? 0) + 1
          if (pool.length < before) narrowed.r2 = (narrowed.r2 ?? 0) + 1
          if (!pool.length) {
            exc.push({ o, stage, why: 'unavailable',
              t: deptOut.includes(stage) ? 'Everyone in that department is away' : 'Everyone eligible was on leave or off shift',
              dk: day.dk, today: o.today })
            continue
          }

          /* route rules — e.g. the LIEN typing group */
          for (const r of RULES) {
            if (r.k !== 'route' || !r.on || !r.cond) continue
            if (r.cond.stage && r.cond.stage !== stage) continue
            if (r.cond.product && r.cond.product !== o.pr) continue
            if (r.cond.state && r.cond.state !== o.st) continue
            fired[r.id] = (fired[r.id] ?? 0) + 1
            const b = pool.length
            pool = pool.filter((s) => r.pool?.includes(s.id))
            if (pool.length < b) narrowed[r.id] = (narrowed[r.id] ?? 0) + 1
          }
          if (!pool.length) {
            exc.push({ o, stage, why: 'no-dept', t: 'A routing rule left nobody eligible',
              dk: day.dk, today: o.today })
            continue
          }

          /* self-review — never the person who did the paired stage */
          const paired = PAIRS[stage]
          if (paired) {
            fired.r4 = (fired.r4 ?? 0) + 1
            const b = pool.length
            pool = pool.filter((s) => o.a[paired] !== s.id)
            if (pool.length < b) narrowed.r4 = (narrowed.r4 ?? 0) + 1
          }
          if (!pool.length) {
            exc.push({ o, stage, why: 'self',
              t: 'The only person free had already done the paired stage',
              dk: day.dk, today: o.today })
            continue
          }

          fired.r3 = (fired.r3 ?? 0) + 1
          const b3 = pool.length
          pool = pool.filter((s) => (load[s.id] ?? 0) < s.cap)
          if (pool.length < b3) narrowed.r3 = (narrowed.r3 ?? 0) + 1
          if (!pool.length) {
            exc.push({ o, stage, why: 'capacity',
              t: 'Everyone eligible was already at their daily target',
              dk: day.dk, today: o.today })
            continue
          }

          /* fill the emptiest first, measured against each person's own target */
          fired.r8 = (fired.r8 ?? 0) + 1
          pool.sort((a, b) => (load[a.id]! / a.cap) - (load[b.id]! / b.cap))
          const pick = pool[0]!
          load[pick.id] = (load[pick.id] ?? 0) + 1
          o.a[stage] = pick.id
          assigns.push({ o, stage, who: pick.id, hr: o.hr, dk: day.dk, today: o.today })
        }
      }
    }
  }
  const today = days[days.length - 1]!.arrivals.flatMap((s) => s.orders)
  /* how often the self-review rule actually removed somebody — "working silently" */
  const avoided = narrowed.r4 ?? 0
  const totalStages = days.flatMap((d) => d.arrivals).flatMap((s) => s.orders).length * ASSIGN_STAGES.length
  return { assigns, exc, load, fired, narrowed, today, deptOut, avoided, totalStages }
}

/* Lazily computed and memoised. Building the five-day stream and running
   the assignment pass over it is ~2,160 stage decisions; doing that at module
   import blocked first paint for every visitor, including ones who never open
   a screen that reads it. Screens that need it pay for it once, on first use. */
let _day: Day[] | null = null
let _run: ReturnType<typeof runDay> | null = null

export const getDay = (): Day[] => (_day ??= makeDay())
export const getRun = (): ReturnType<typeof runDay> => (_run ??= runDay(getDay()))

/* ══════════ progress ══════════
   Stages complete in order, roughly one every 1.5h after the order arrives.
   An order that landed at 9:00 has had most of the day; one at 17:00 has
   barely started. Ported from the original's STAGE_HOURS / doneCount block —
   progress is a function of TIME, not of whether a stage has an owner. */
export const STAGE_HOURS = 1.5
const stageIdx = (s: string) => ASSIGN_STAGES.indexOf(s)
const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
export const ageHrs = (o: DayOrder) =>
  Math.round((midnight(NOW) - midnight(o.date)) / 36e5) +
  (NOW.getHours() + NOW.getMinutes() / 60 - o.hr)
export const doneCount = (o: DayOrder) =>
  Math.max(0, Math.min(ASSIGN_STAGES.length, Math.floor(ageHrs(o) / STAGE_HOURS)))
export const isDone = (o: DayOrder, stage: string) => stageIdx(stage) < doneCount(o)
/** null once every stage is through — the original's curStage(). */
export const curStage = (o: DayOrder): string | null => {
  const d = doneCount(o)
  return d >= ASSIGN_STAGES.length ? null : ASSIGN_STAGES[d]!
}
/** complete · waiting · progress — the three states a board can show. */
export const orderState = (o: DayOrder): 'complete' | 'waiting' | 'progress' => {
  const d = doneCount(o)
  return d >= ASSIGN_STAGES.length ? 'complete' : d === 0 ? 'waiting' : 'progress'
}

/** Per-person: what they finished today, and what is still on their desk. */
export function staffWork() {
  const m: Record<string, { done: number; pend: number; tot: number; pct: number }> = {}
  STAFF.filter((s) => s.dep.length).forEach((s) => { m[s.id] = { done: 0, pend: 0, tot: 0, pct: 0 } })
  getRun().assigns.filter((a) => a.today).forEach((a) => {
    const r = m[a.who]; if (!r) return
    if (isDone(a.o, a.stage)) r.done++; else r.pend++
    r.tot++
  })
  Object.values(m).forEach((r) => { r.pct = r.tot ? Math.round((r.done / r.tot) * 100) : 0 })
  return m
}

/** Every day in the stream with its order count — the Reports day picker. */
export const daySummary = () => {
  getRun()                                   // ensure assignments are populated
  const days = getDay()
  return days.map((d, i) => ({
    dk: d.dk,
    date: d.date,
    today: i === days.length - 1,
    orders: d.arrivals.flatMap((s) => s.orders),
  }))
}

export const ordersFor = (dk: string | 'all') => {
  const summary = daySummary()
  return dk === 'all'
    ? summary.flatMap((d) => d.orders)
    : (summary.find((d) => d.dk === dk)?.orders ?? [])
}

/** Stage totals for today's intake — how many sit in each stage right now. */
export const stageTotals = (orders: DayOrder[]) => {
  const m: Record<string, DayOrder[]> = {}
  ASSIGN_STAGES.forEach((s) => { m[s] = [] })
  orders.forEach((o) => { const c = curStage(o); if (c) m[c]!.push(o) })
  return m
}
