/**
 * Reports — the original's six tabs, driven by the simulated intake:
 * Received · Assigned · Turnaround · By staff · By department · Quality
 * A day picker across the five days sits above them, and every figure follows it.
 */
import { useEffect, useState } from 'react'
import { useSearch } from '@tanstack/react-router'
import { ASSIGN_STAGES, AVAIL, CLIENTS, NOW, ORDERS, STAFF, STAGES, who } from '@/data/seed'
import { QCCRIT, QCRULES, QCSCALE } from '@/data/seed2'
import {
  DAY_SUMMARY, RUN, curStage, isDone, ordersFor, staffWork, stageTotals,
} from '@/lib/day'
import { hh } from '@/lib/format'
import { orderPlan } from '@/lib/sla'
import { useSession } from '@/lib/session'
import { Assume, Banner, Chip, Kpi, PageHead, Sec } from '@/components/ui'

const RPTABS = ['Received', 'Assigned', 'Turnaround', 'By staff', 'By department', 'Quality'] as const
type Tab = (typeof RPTABS)[number]

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function Reports() {
  const search = useSearch({ strict: false }) as { tab?: string }
  const [tab, setTab] = useState<Tab>(
    (RPTABS as readonly string[]).includes(search.tab ?? '') ? (search.tab as Tab) : 'Received',
  )
  useEffect(() => {
    if (search.tab && (RPTABS as readonly string[]).includes(search.tab)) setTab(search.tab as Tab)
  }, [search.tab])

  const today = DAY_SUMMARY[DAY_SUMMARY.length - 1]!
  const [day, setDay] = useState<string>(today.dk)
  const { toast } = useSession()

  const orders = ordersFor(day)
  const completed = orders.filter((o) => !curStage(o))
  const wip = orders.filter((o) => curStage(o))
  const clientsOrdering = new Set(orders.map((o) => o.cl)).size

  return (
    <>
      <PageHead
        title="Reports"
        sub="Everything about the day in one place — what came in, who it went to, how fast, and how good."
        actions={<button className="btn g" onClick={() => toast(`${tab.toLowerCase()} export built from the filtered rows`)}>Export</button>}
      />

      {/* the day picker — every figure below follows it */}
      <div className="fbar">
        {DAY_SUMMARY.map((d) => (
          <button
            key={d.dk}
            className={`pill ${day === d.dk ? 'on' : ''}`}
            aria-pressed={day === d.dk}
            onClick={() => setDay(d.dk)}
          >
            {d.today ? 'Today' : DOW[d.date.getDay()]} {d.dk}
            <span className="n">{d.orders.length}</span>
          </button>
        ))}
        <button
          className={`pill ${day === 'all' ? 'on' : ''}`}
          aria-pressed={day === 'all'}
          onClick={() => setDay('all')}
        >
          All {DAY_SUMMARY.length} days
          <span className="n">{DAY_SUMMARY.reduce((a, d) => a + d.orders.length, 0)}</span>
        </button>
      </div>

      <div className="kpis">
        <Kpi t="Orders received" v={orders.length}
          d={`${day === 'all' ? 'all five days' : day} · click to see`}
          onClick={() => setTab('Received')} />
        <Kpi t="Completed" v={completed.length}
          d={`${orders.length ? Math.round((completed.length / orders.length) * 100) : 0}% of intake · click to see`}
          onClick={() => setTab('Turnaround')} />
        <Kpi t="Work in progress" v={wip.length}
          d="still moving through the stages · showing these"
          onClick={() => setTab('Received')} />
        <Kpi t="Clients ordering" v={clientsOrdering}
          d={`of ${CLIENTS.length} on the books · click to see`}
          onClick={() => setTab('Received')} />
      </div>

      <div className="tabs">
        {RPTABS.map((t) => (
          <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Received' && <Received day={day} />}
      {tab === 'Assigned' && <Assigned day={day} />}
      {tab === 'Turnaround' && <Turnaround day={day} />}
      {tab === 'By staff' && <ByStaff />}
      {tab === 'By department' && <ByDepartment day={day} />}
      {tab === 'Quality' && <Quality />}
    </>
  )
}

const R_GRID = '90px 150px 120px 110px 160px 1fr'

/* ── Received — where every order currently sits, grouped by stage ── */
function Received({ day }: { day: string }) {
  const orders = ordersFor(day)
  const byStage = stageTotals(orders)
  return (
    <>
      {ASSIGN_STAGES.map((stage) => {
        const list = byStage[stage] ?? []
        if (!list.length) return null
        return (
          <div key={stage}>
            <Sec>{stage} — {list.length}</Sec>
            <div className="tbl"><div className="tsc"><div style={{ minWidth: 840 }}>
              <div className="trow h" style={{ gridTemplateColumns: R_GRID }}>
                <span>Arrived</span><span>Order</span><span>Client</span>
                <span>Product</span><span>Where it is now</span><span>County</span>
              </div>
              <div className="tb">
                {list.map((o) => (
                  <div className="trow" key={o.id} style={{ gridTemplateColumns: R_GRID, cursor: 'default' }}>
                    <div className="cell"><div className="v mono" style={{ fontSize: '12.5px' }}>{o.hr}:00</div></div>
                    <div className="cell"><div className="v mono" style={{ fontSize: '12.5px' }}>{o.id}</div></div>
                    <div className="cell"><div className="v">{o.cl}</div></div>
                    <div className="cell"><div className="v">{o.pr}</div></div>
                    <div className="cell"><Chip tone="b">{stage}</Chip></div>
                    <div className="cell"><div className="v" style={{ fontSize: '12.5px' }}>{o.co}, {o.st}</div></div>
                  </div>
                ))}
              </div>
            </div></div></div>
          </div>
        )
      })}
      <Sec>Completed — {orders.filter((o) => !curStage(o)).length}</Sec>
      <div className="card"><div className="cb">
        <p className="gr" style={{ fontSize: '12.5px', margin: 0 }}>
          Through every department. Stages complete in order, roughly one every 1.5
          hours after the order arrives — an order that landed at 9:00 has had most of
          the day; one at 17:00 has barely started.
        </p>
      </div></div>
    </>
  )
}

/* ── Assigned — department × person for the chosen day ── */
function Assigned({ day }: { day: string }) {
  const GRID = '150px 190px 100px 100px 1fr'
  const assigns = RUN.assigns.filter((a) => day === 'all' || a.dk === day)
  return (
    <>
      <Sec>Every stage with an owner — {assigns.length}</Sec>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 760 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Department</span><span>Person</span><span>Placed</span><span>Done</span><span>Against target</span>
        </div>
        <div className="tb">
          {ASSIGN_STAGES.flatMap((dept) =>
            STAFF.filter((s) => s.dep.includes(dept)).map((s) => {
              const mine = assigns.filter((a) => a.stage === dept && a.who === s.id)
              const done = mine.filter((a) => isDone(a.o, a.stage)).length
              const pct = Math.min(100, (RUN.load[s.id] ?? s.open) / s.cap * 100)
              return (
                <div className="trow" key={`${dept}-${s.id}`} style={{ gridTemplateColumns: GRID, cursor: 'default' }}>
                  <div className="cell"><div className="v">{dept}</div></div>
                  <div className="cell">
                    <div className="v">{s.n}</div>
                    {s.avail !== 'ok' && <div className="s warn">{AVAIL[s.avail]![0].toLowerCase()}</div>}
                  </div>
                  <div className="cell"><div className="v mono">{mine.length}</div></div>
                  <div className="cell"><div className="v mono ok">{done}</div></div>
                  <div className="cell">
                    <div className="bar" style={{ maxWidth: 180 }}>
                      <i style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--bad)' : 'var(--brand2)' }} />
                    </div>
                    <div className="s">{RUN.load[s.id] ?? s.open} of {s.cap}</div>
                  </div>
                </div>
              )
            }))}
        </div>
      </div></div></div>
    </>
  )
}

/* ── Turnaround — promise vs reality on the live sample orders ── */
function Turnaround({ day }: { day: string }) {
  const orders = ordersFor(day)
  const complete = orders.filter((o) => !curStage(o))
  const live = ORDERS.filter((o) => !o.done)
  const doomed = live.filter((o) => orderPlan(o).doomed).length
  const behind = live.filter((o) => { const p = orderPlan(o); return p.behind && !p.doomed }).length
  const GRID = '140px 110px 100px 110px 130px 1fr'
  return (
    <>
      <div className="kpis">
        <Kpi t="Completed" v={complete.length} dTone="ok"
          d={`${orders.length ? Math.round((complete.length / orders.length) * 100) : 0}% of intake`} />
        <Kpi t="Cannot finish" v={doomed}
          cls={doomed ? 'alert' : undefined} dTone={doomed ? 'bad' : 'ok'} d="need more time than is left" />
        <Kpi t="Behind a checkpoint" v={behind}
          cls={behind ? 'warnk' : undefined} dTone="warn" d="still recoverable" />
        <Kpi t="On track" v={live.length - doomed - behind} d="no intervention needed" />
      </div>
      <Sec>Live orders against their promise</Sec>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 840 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Order</span><span>Client</span><span>Promise</span><span>Elapsed</span><span>Left</span><span>Status</span>
        </div>
        <div className="tb">
          {live.map((o) => {
            const p = orderPlan(o)
            const left = (o.due.getTime() - NOW.getTime()) / 3_600_000
            return (
              <div className="trow" key={o.id} style={{ gridTemplateColumns: GRID, cursor: 'default' }}>
                <div className="cell"><div className="v mono">{o.id}</div><div className="s">{o.pr}</div></div>
                <div className="cell"><div className="v">{o.cl}</div></div>
                <div className="cell"><div className="v mono">{p.slaH}h</div></div>
                <div className="cell"><div className="v mono">{hh(Math.max(0, p.elapsed))}</div></div>
                <div className="cell">
                  <div className={`v mono ${left < 0 ? 'bad' : left < 4 ? 'warn' : ''}`}>
                    {left < 0 ? `${hh(-left)} over` : hh(left)}
                  </div>
                </div>
                <div className="cell">
                  {p.doomed
                    ? <div className="v bad" style={{ fontSize: '12.5px' }}>short {hh(p.short)} for the stages left</div>
                    : p.behind
                      ? <div className="v warn" style={{ fontSize: '12.5px' }}>behind {p.behindAt}</div>
                      : <div className="v ok" style={{ fontSize: '12.5px' }}>on track</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div></div></div>
      <Assume title="The stage split is the designer's guess, not your data">
        {' '}The 50/11/25/10/4 base shares (with 40Y and FS+ overrides) were picked from
        how the work reads, not from timings. Take a week of finished orders and measure
        how long each department actually held them — the median is your split.
      </Assume>
    </>
  )
}

/* ── By staff — today's throughput per person ── */
function ByStaff() {
  const work = staffWork()
  const rows = Object.entries(work)
    .map(([id, w]) => ({ id, ...w, s: STAFF.find((x) => x.id === id)! }))
    .filter((r) => r.tot > 0)
    .sort((a, b) => b.tot - a.tot)
  const GRID = '190px 160px 90px 90px 90px 1fr'
  return (
    <>
      <Sec>Today, by person — {rows.reduce((a, r) => a + r.tot, 0)} stages</Sec>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 780 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Person</span><span>Departments</span><span>Done</span>
          <span>Pending</span><span>Total</span><span>% complete</span>
        </div>
        <div className="tb">
          {rows.map((r) => (
            <div className="trow" key={r.id} style={{ gridTemplateColumns: GRID, cursor: 'default' }}>
              <div className="cell"><div className="v">{r.s.n}</div></div>
              <div className="cell"><div className="v gr" style={{ fontSize: '12.5px' }}>{r.s.dep.join(', ')}</div></div>
              <div className="cell"><div className="v mono ok">{r.done}</div></div>
              <div className="cell"><div className="v mono warn">{r.pend}</div></div>
              <div className="cell"><div className="v mono">{r.tot}</div></div>
              <div className="cell">
                <div className="split" style={{ maxWidth: 180 }}>
                  <span style={{ width: `${r.pct}%`, background: 'var(--ok)' }} />
                  <span style={{ width: `${100 - r.pct}%`, background: 'var(--warn)' }} />
                </div>
                <div className="s">{r.pct}% of {r.tot} complete</div>
              </div>
            </div>
          ))}
        </div>
      </div></div></div>
    </>
  )
}

/* ── By department ── */
function ByDepartment({ day }: { day: string }) {
  const assigns = RUN.assigns.filter((a) => day === 'all' || a.dk === day)
  const exc = RUN.exc.filter((e) => day === 'all' || e.dk === day)
  const GRID = '160px 100px 100px 110px 1fr'
  return (
    <>
      <Sec>Workload by department</Sec>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 740 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Department</span><span>Placed</span><span>Done</span><span>Exceptions</span><span>% complete</span>
        </div>
        <div className="tb">
          {STAGES.map((dept) => {
            const mine = assigns.filter((a) => a.stage === dept)
            const done = mine.filter((a) => isDone(a.o, a.stage)).length
            const ex = exc.filter((e) => e.stage === dept).length
            const pct = mine.length ? Math.round((done / mine.length) * 100) : 0
            return (
              <div className="trow" key={dept} style={{ gridTemplateColumns: GRID, cursor: 'default' }}>
                <div className="cell"><div className="v"><b>{dept}</b></div></div>
                <div className="cell"><div className="v mono">{mine.length}</div></div>
                <div className="cell"><div className="v mono ok">{done}</div></div>
                <div className="cell"><div className={`v mono ${ex ? 'bad' : ''}`}>{ex || '·'}</div></div>
                <div className="cell">
                  <div className="bar" style={{ maxWidth: 180 }}><i style={{ width: `${pct}%` }} /></div>
                  <div className="s">{pct}% complete</div>
                </div>
              </div>
            )
          })}
        </div>
      </div></div></div>
    </>
  )
}

/* ── Quality ── */
function Quality() {
  const { toast } = useSession()
  return (
    <>
      <Sec>The scale</Sec>
      <div className="kpis">
        {QCSCALE.map(([n, label, tone]) => (
          <div className="kpi stat" key={n}>
            <div className="t">{label}</div>
            <div className="v">{n}</div>
            <div className="d"><Chip tone={tone}>{label}</Chip></div>
          </div>
        ))}
      </div>

      <Sec>The criteria</Sec>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {QCCRIT.map(([n, d]) => (
            <div className="rw" key={n}>
              <span className="gr">·</span>
              <span><b>{n}</b><div className="sd">{d}</div></span>
              <span />
            </div>
          ))}
        </div>
      </div></div>

      <Sec>How scoring works</Sec>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {QCRULES.map((r) => (
            <div className="rw" key={r.k}>
              <span className={r.on ? 'ok' : 'gr'}>{r.on ? '✓' : '·'}</span>
              <span>
                <b>{r.n}</b>
                <div className="sd">{r.d}</div>
                <div className="sd" style={{ color: 'var(--warn)' }}>{r.cost}</div>
              </span>
              <span>
                <button className="btn g sm" onClick={() => toast('Rule edits live only in this session — nothing writes to a database yet')}>
                  {r.on ? 'On' : 'Off'}
                </button>
              </span>
            </div>
          ))}
        </div>
        <p className="gr" style={{ fontSize: '12.5px', marginTop: 12 }}>
          The self-review rule removed somebody {RUN.avoided} times in this run — that is
          why {who('sk')}, who is in both Typing and Typing QC, is filtered out of QC on
          orders he typed.
        </p>
      </div></div>

      <Banner tone="b" icon="◔" title="Ratings happen on the order">
        Open any order → Quality tab to rate the assigned staff on this scale. Defects
        logged there are what this report aggregates.
      </Banner>
    </>
  )
}
