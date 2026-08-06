import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ASSIGN_STAGES, NOW, STAGES, staffName } from '@/data/seed'
import { api, queryKeys } from '@/lib/api'
import { fmtDate, hoursShort } from '@/lib/format'
import { orderPlan } from '@/lib/sla'
import { Kpi, Loading, PageHead, SectionHead } from '@/components/ui'
import type { Order, Staff } from '@/data/types'

const TABS = ['Received', 'Assigned', 'Turnaround', 'By staff', 'By department'] as const
type Tab = (typeof TABS)[number]

export function Reports() {
  const [tab, setTab] = useState<Tab>('Received')
  const { data: orders } = useQuery({ queryKey: queryKeys.orders, queryFn: api.orders })
  const { data: staff } = useQuery({ queryKey: queryKeys.staff, queryFn: api.staff })

  if (!orders || !staff) return <Loading what="reports" />

  return (
    <>
      <PageHead
        title="Reports"
        sub="What came in, who did it, and whether it went out on time."
        actions={<button className="btn g">Export</button>}
      />

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Received' && <Received orders={orders} />}
      {tab === 'Assigned' && <Assigned orders={orders} staff={staff} />}
      {tab === 'Turnaround' && <Turnaround orders={orders} />}
      {tab === 'By staff' && <ByStaff orders={orders} staff={staff} />}
      {tab === 'By department' && <ByDepartment orders={orders} />}
    </>
  )
}

/* ── Received: what arrived, by client, and where it got to ── */
function Received({ orders }: { orders: Order[] }) {
  const clients = [...new Set(orders.map((o) => o.client))].sort()
  const GRID = `130px 90px repeat(${STAGES.length}, minmax(80px,1fr)) 90px`

  return (
    <>
      <div className="kpis">
        <Kpi title="Received" icon="✉" value={orders.length} detail="in the period" />
        <Kpi title="Delivered" icon="✓" value={orders.filter((o) => o.done).length}
          detailTone="ok" detail="through every stage" />
        <Kpi title="Still moving" icon="◷" value={orders.filter((o) => !o.done).length}
          detailTone="warn" detail="somewhere in the pipeline" />
        <Kpi title="Clients" icon="◎" value={clients.length} detail="sent work" />
      </div>

      <SectionHead>By client and stage</SectionHead>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 900 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Client</span><span>Received</span>
          {STAGES.map((s) => <span key={s}>{s}</span>)}
          <span>Delivered</span>
        </div>
        <div className="tb">
          {clients.map((c) => {
            const mine = orders.filter((o) => o.client === c)
            return (
              <div className="trow" key={c} style={{ gridTemplateColumns: GRID }}>
                <div className="cell"><div className="v"><b>{c}</b></div></div>
                <div className="cell"><div className="v mono">{mine.length}</div></div>
                {STAGES.map((s) => (
                  <div className="cell" key={s}>
                    <div className="v mono">
                      {mine.filter((o) => !o.done && !!o.assignments[s]).length || <span className="gr">·</span>}
                    </div>
                  </div>
                ))}
                <div className="cell">
                  <div className="v mono ok">{mine.filter((o) => o.done).length}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div></div></div>
    </>
  )
}

/* ── Assigned: who is holding what, by department ── */
function Assigned({ orders, staff }: { orders: Order[]; staff: Staff[] }) {
  const GRID = '150px 190px 100px 1fr'
  return (
    <>
      <SectionHead>Every stage with an owner</SectionHead>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 720 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Department</span><span>Person</span><span>Holding</span><span>Against target</span>
        </div>
        <div className="tb">
          {ASSIGN_STAGES.flatMap((dept) =>
            staff.filter((s) => s.departments.includes(dept)).map((s) => {
              const held = orders.filter((o) => !o.done && o.assignments[dept] === s.id).length
              const pct = Math.min(100, (s.open / s.capacity) * 100)
              return (
                <div className="trow" key={`${dept}-${s.id}`} style={{ gridTemplateColumns: GRID }}>
                  <div className="cell"><div className="v">{dept}</div></div>
                  <div className="cell">
                    <div className="v">{s.name}</div>
                    {s.availability !== 'ok' && (
                      <div className="s warn">{s.availability === 'leave' ? 'on leave' : 'off shift'}</div>
                    )}
                  </div>
                  <div className="cell"><div className="v mono">{held}</div></div>
                  <div className="cell">
                    <div className="bar" style={{ maxWidth: 200 }}>
                      <i style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--bad)' : 'var(--brand2)' }} />
                    </div>
                    <div className="s">{s.open} of {s.capacity}</div>
                  </div>
                </div>
              )
            }),
          )}
        </div>
      </div></div></div>
    </>
  )
}

/* ── Turnaround: promise vs reality ── */
function Turnaround({ orders }: { orders: Order[] }) {
  const delivered = orders.filter((o) => o.done)
  const live = orders.filter((o) => !o.done)
  const atRiskCount = live.filter((o) => orderPlan(o).doomed).length
  const behindCount = live.filter((o) => { const p = orderPlan(o); return p.behind && !p.doomed }).length
  const GRID = '140px 110px 100px 110px 130px 1fr'

  return (
    <>
      <div className="kpis">
        <Kpi title="Delivered" icon="✓" value={delivered.length} detailTone="ok" detail="in the period" />
        <Kpi title="Cannot finish" icon="⚑" value={atRiskCount}
          tone={atRiskCount ? 'alert' : undefined} detailTone={atRiskCount ? 'bad' : 'ok'}
          detail="need more time than is left" />
        <Kpi title="Behind a checkpoint" icon="◷" value={behindCount}
          tone={behindCount ? 'warnk' : undefined} detailTone="warn" detail="still recoverable" />
        <Kpi title="On track" icon="◎" value={live.length - atRiskCount - behindCount}
          detail="no intervention needed" />
      </div>

      <SectionHead>Live orders against their promise</SectionHead>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 840 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Order</span><span>Client</span><span>Promise</span>
          <span>Elapsed</span><span>Left</span><span>Status</span>
        </div>
        <div className="tb">
          {live.map((o) => {
            const plan = orderPlan(o)
            const elapsed = (NOW.getTime() - o.receivedAt.getTime()) / 3_600_000
            const left = (o.dueAt.getTime() - NOW.getTime()) / 3_600_000
            return (
              <div className="trow" key={o.id} style={{ gridTemplateColumns: GRID }}>
                <div className="cell"><div className="v mono">{o.id}</div>
                  <div className="s">{o.product}</div></div>
                <div className="cell"><div className="v">{o.client}</div></div>
                <div className="cell"><div className="v mono">{o.promiseHours}h</div></div>
                <div className="cell"><div className="v mono">{hoursShort(Math.max(0, elapsed))}</div></div>
                <div className="cell">
                  <div className={`v mono ${left < 0 ? 'bad' : left < 4 ? 'warn' : ''}`}>
                    {left < 0 ? `${hoursShort(-left)} over` : hoursShort(left)}
                  </div>
                </div>
                <div className="cell">
                  {plan.doomed ? (
                    <div className="v bad" style={{ fontSize: '12.5px' }}>
                      short {hoursShort(plan.shortHours)} for the stages left
                    </div>
                  ) : plan.behind ? (
                    <div className="v warn" style={{ fontSize: '12.5px' }}>
                      behind {plan.behindAt}
                    </div>
                  ) : (
                    <div className="v ok" style={{ fontSize: '12.5px' }}>on track</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div></div></div>

      <p className="gr" style={{ fontSize: '12.5px', marginTop: 12 }}>
        "Cannot finish" is computed from the per-stage budgets, not from the due date
        alone — an order can be well inside its promise and still unable to complete.
        The budgets are a guess until measured; see <code>src/lib/sla.ts</code>.
      </p>
    </>
  )
}

/* ── By staff ── */
function ByStaff({ orders, staff }: { orders: Order[]; staff: Staff[] }) {
  const roster = staff.filter((s) => s.departments.length > 0)
  const GRID = '190px 160px 100px 100px 1fr'
  return (
    <>
      <SectionHead>Workload by person</SectionHead>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 760 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Person</span><span>Departments</span><span>Open</span><span>Target</span><span>Load</span>
        </div>
        <div className="tb">
          {roster
            .map((s) => ({
              s,
              held: orders.filter((o) => !o.done && Object.values(o.assignments).includes(s.id)).length,
            }))
            .sort((a, b) => b.held - a.held)
            .map(({ s, held }) => {
              const pct = Math.min(100, (s.open / s.capacity) * 100)
              return (
                <div className="trow" key={s.id} style={{ gridTemplateColumns: GRID }}>
                  <div className="cell"><div className="v">{s.name}</div>
                    <div className="s">{held} order{held === 1 ? '' : 's'} in hand</div></div>
                  <div className="cell"><div className="v gr" style={{ fontSize: '12.5px' }}>
                    {s.departments.join(', ')}</div></div>
                  <div className="cell"><div className="v mono">{s.open}</div></div>
                  <div className="cell"><div className="v mono">{s.capacity}</div></div>
                  <div className="cell">
                    <div className="bar" style={{ maxWidth: 200 }}>
                      <i style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--bad)' : 'var(--brand2)' }} />
                    </div>
                    <div className="s">{pct.toFixed(0)}% of target</div>
                  </div>
                </div>
              )
            })}
        </div>
      </div></div></div>
    </>
  )
}

/* ── By department ── */
function ByDepartment({ orders }: { orders: Order[] }) {
  const GRID = '160px 110px 110px 110px 1fr'
  return (
    <>
      <SectionHead>Workload by department</SectionHead>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 720 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Department</span><span>Assigned</span><span>Unassigned</span>
          <span>Delivered</span><span>Coverage</span>
        </div>
        <div className="tb">
          {STAGES.map((dept) => {
            const live = orders.filter((o) => !o.done)
            const assigned = live.filter((o) => !!o.assignments[dept]).length
            const unassigned = live.length - assigned
            const done = orders.filter((o) => o.done && !!o.assignments[dept]).length
            const pct = live.length ? (assigned / live.length) * 100 : 0
            return (
              <div className="trow" key={dept} style={{ gridTemplateColumns: GRID }}>
                <div className="cell"><div className="v"><b>{dept}</b></div></div>
                <div className="cell"><div className="v mono">{assigned}</div></div>
                <div className="cell">
                  <div className={`v mono ${unassigned ? 'warn' : ''}`}>{unassigned}</div>
                </div>
                <div className="cell"><div className="v mono ok">{done}</div></div>
                <div className="cell">
                  <div className="bar" style={{ maxWidth: 200 }}>
                    <i style={{ width: `${pct}%` }} />
                  </div>
                  <div className="s">{pct.toFixed(0)}% of live orders have an owner</div>
                </div>
              </div>
            )
          })}
        </div>
      </div></div></div>
    </>
  )
}
