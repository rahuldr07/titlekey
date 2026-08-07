/**
 * Reports — the original's six tabs exactly:
 * Received · Assigned · Turnaround · By staff · By department · Quality
 */
import { useEffect, useState } from 'react'
import { useSearch } from '@tanstack/react-router'
import { ASSIGN_STAGES, AVAIL, NOW, ORDERS, STAFF, STAGES, who } from '@/data/seed'
import { QCCRIT, QCRULES, QCSCALE } from '@/data/seed2'
import { hh } from '@/lib/format'
import { orderPlan } from '@/lib/sla'
import { useSession } from '@/lib/session'
import { Assume, Banner, Chip, Kpi, PageHead, Sec } from '@/components/ui'

const RPTABS = ['Received', 'Assigned', 'Turnaround', 'By staff', 'By department', 'Quality'] as const
type Tab = (typeof RPTABS)[number]

export function Reports() {
  const search = useSearch({ strict: false }) as { tab?: string }
  const [tab, setTab] = useState<Tab>(
    (RPTABS as readonly string[]).includes(search.tab ?? '') ? (search.tab as Tab) : 'Received',
  )
  useEffect(() => {
    if (search.tab && (RPTABS as readonly string[]).includes(search.tab)) setTab(search.tab as Tab)
  }, [search.tab])
  const { toast } = useSession()

  return (
    <>
      <PageHead
        title="Reports"
        sub="What came in, who did it, and whether it went out on time."
        actions={<button className="btn g" onClick={() => toast(`${tab.toLowerCase()} export built from the filtered rows`)}>Export</button>}
      />
      <div className="tabs">
        {RPTABS.map((t) => (
          <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Received' && <Received />}
      {tab === 'Assigned' && <Assigned />}
      {tab === 'Turnaround' && <Turnaround />}
      {tab === 'By staff' && <ByStaff />}
      {tab === 'By department' && <ByDepartment />}
      {tab === 'Quality' && <Quality />}
    </>
  )
}

/* ── Received — by client and stage, as a matrix ── */
function Received() {
  const clients = [...new Set(ORDERS.map((o) => o.cl))].sort()
  return (
    <>
      <div className="kpis">
        <Kpi t="Received" icon="✉" v={ORDERS.length} d="in the period" />
        <Kpi t="Delivered" icon="✓" v={ORDERS.filter((o) => o.done).length} dTone="ok" d="through every stage" />
        <Kpi t="Still moving" icon="◷" v={ORDERS.filter((o) => !o.done).length} dTone="warn" d="somewhere in the pipeline" />
        <Kpi t="Clients" icon="◎" v={clients.length} d="sent work" />
      </div>
      <Sec>By client and stage</Sec>
      <div className="tbl"><div className="tsc">
        <table className="mat" style={{ minWidth: 860 }}>
          <thead><tr>
            <th>Client</th><th>Received</th>
            {STAGES.map((s) => <th key={s}>{s}</th>)}
            <th>Completed</th><th>WIP</th>
          </tr></thead>
          <tbody>
            {clients.map((c) => {
              const mine = ORDERS.filter((o) => o.cl === c)
              const done = mine.filter((o) => o.done).length
              return (
                <tr key={c}>
                  <td><b>{c}</b></td>
                  <td className="n">{mine.length}</td>
                  {STAGES.map((s) => (
                    <td className="n" key={s}>
                      {mine.filter((o) => !o.done && !!o.a[s]).length || '·'}
                    </td>
                  ))}
                  <td className="n">{done}</td>
                  <td className="n">{mine.length - done}</td>
                </tr>
              )
            })}
            <tr>
              <td className="tot">Total</td>
              <td className="tot">{ORDERS.length}</td>
              {STAGES.map((s) => (
                <td className="tot" key={s}>{ORDERS.filter((o) => !o.done && !!o.a[s]).length}</td>
              ))}
              <td className="tot">{ORDERS.filter((o) => o.done).length}</td>
              <td className="tot">{ORDERS.filter((o) => !o.done).length}</td>
            </tr>
          </tbody>
        </table>
      </div></div>
    </>
  )
}

/* ── Assigned — department × staff ── */
function Assigned() {
  const GRID = '150px 190px 100px 1fr'
  return (
    <>
      <Sec>Every stage with an owner, by department and person</Sec>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 720 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Department</span><span>Person</span><span>Holding</span><span>Against target</span>
        </div>
        <div className="tb">
          {ASSIGN_STAGES.flatMap((dept) =>
            STAFF.filter((s) => s.dep.includes(dept)).map((s) => {
              const held = ORDERS.filter((o) => !o.done && o.a[dept] === s.id).length
              const pct = Math.min(100, (s.open / s.cap) * 100)
              return (
                <div className="trow" key={`${dept}-${s.id}`} style={{ gridTemplateColumns: GRID, cursor: 'default' }}>
                  <div className="cell"><div className="v">{dept}</div></div>
                  <div className="cell">
                    <div className="v">{s.n}</div>
                    {s.avail !== 'ok' && <div className="s warn">{AVAIL[s.avail]![0].toLowerCase()}</div>}
                  </div>
                  <div className="cell"><div className="v mono">{held}</div></div>
                  <div className="cell">
                    <div className="bar" style={{ maxWidth: 200 }}>
                      <i style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--bad)' : 'var(--brand2)' }} />
                    </div>
                    <div className="s">{s.open} of {s.cap}</div>
                  </div>
                </div>
              )
            }))}
        </div>
      </div></div></div>
    </>
  )
}

/* ── Turnaround — promise vs reality, the flagship ── */
function Turnaround() {
  const live = ORDERS.filter((o) => !o.done)
  const doomed = live.filter((o) => orderPlan(o).doomed).length
  const behind = live.filter((o) => { const p = orderPlan(o); return p.behind && !p.doomed }).length
  const GRID = '140px 110px 100px 110px 130px 1fr'
  return (
    <>
      <div className="kpis">
        <Kpi t="Delivered" icon="✓" v={ORDERS.filter((o) => o.done).length} dTone="ok" d="in the period" />
        <Kpi t="Cannot finish" icon="⚑" v={doomed}
          cls={doomed ? 'alert' : undefined} dTone={doomed ? 'bad' : 'ok'} d="need more time than is left" />
        <Kpi t="Behind a checkpoint" icon="◷" v={behind}
          cls={behind ? 'warnk' : undefined} dTone="warn" d="still recoverable" />
        <Kpi t="On track" icon="◎" v={live.length - doomed - behind} d="no intervention needed" />
      </div>
      <Sec>Live orders against their promise</Sec>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 840 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Order</span><span>Client</span><span>Promise</span><span>Elapsed</span><span>Left</span><span>Status</span>
        </div>
        <div className="tb">
          {live.map((o) => {
            const p = orderPlan(o)
            const slaH = (o.due.getTime() - o.recv.getTime()) / 3_600_000
            const elapsed = (NOW.getTime() - o.recv.getTime()) / 3_600_000
            const left = (o.due.getTime() - NOW.getTime()) / 3_600_000
            return (
              <div className="trow" key={o.id} style={{ gridTemplateColumns: GRID, cursor: 'default' }}>
                <div className="cell"><div className="v mono">{o.id}</div><div className="s">{o.pr}</div></div>
                <div className="cell"><div className="v">{o.cl}</div></div>
                <div className="cell"><div className="v mono">{Math.round(slaH)}h</div></div>
                <div className="cell"><div className="v mono">{hh(Math.max(0, elapsed))}</div></div>
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

/* ── By staff ── */
function ByStaff() {
  const roster = STAFF.filter((s) => s.dep.length > 0)
  const GRID = '190px 160px 100px 100px 1fr'
  return (
    <>
      <Sec>Workload by person</Sec>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 760 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Person</span><span>Departments</span><span>Open</span><span>Target</span><span>Load</span>
        </div>
        <div className="tb">
          {roster
            .map((s) => ({ s, held: ORDERS.filter((o) => !o.done && Object.values(o.a).includes(s.id)).length }))
            .sort((a, b) => b.s.open - a.s.open)
            .map(({ s, held }) => {
              const pct = Math.min(100, (s.open / s.cap) * 100)
              return (
                <div className="trow" key={s.id} style={{ gridTemplateColumns: GRID, cursor: 'default' }}>
                  <div className="cell"><div className="v">{s.n}</div>
                    <div className="s">{held} of today’s order{held === 1 ? '' : 's'} in hand</div></div>
                  <div className="cell"><div className="v gr" style={{ fontSize: '12.5px' }}>{s.dep.join(', ')}</div></div>
                  <div className="cell"><div className="v mono">{s.open}</div></div>
                  <div className="cell"><div className="v mono">{s.cap}</div></div>
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
function ByDepartment() {
  const GRID = '160px 110px 110px 110px 1fr'
  return (
    <>
      <Sec>Workload by department</Sec>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 720 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Department</span><span>Assigned</span><span>Unassigned</span><span>Delivered</span><span>Coverage</span>
        </div>
        <div className="tb">
          {STAGES.map((dept) => {
            const live = ORDERS.filter((o) => !o.done)
            const assigned = live.filter((o) => !!o.a[dept]).length
            const done = ORDERS.filter((o) => o.done && !!o.a[dept]).length
            const pct = live.length ? (assigned / live.length) * 100 : 0
            return (
              <div className="trow" key={dept} style={{ gridTemplateColumns: GRID, cursor: 'default' }}>
                <div className="cell"><div className="v"><b>{dept}</b></div></div>
                <div className="cell"><div className="v mono">{assigned}</div></div>
                <div className="cell"><div className={`v mono ${live.length - assigned ? 'warn' : ''}`}>{live.length - assigned}</div></div>
                <div className="cell"><div className="v mono ok">{done}</div></div>
                <div className="cell">
                  <div className="bar" style={{ maxWidth: 200 }}><i style={{ width: `${pct}%` }} /></div>
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

/* ── Quality — the 1–5 scale, the criteria, and how scoring works ── */
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
          The self-review rule is why {who('sk')} — in both Typing and Typing QC — is
          filtered out of QC on orders he typed, and why his avatar carries a red ring
          on the Orders screen when both stages are his.
        </p>
      </div></div>

      <Banner tone="b" icon="◔" title="Ratings happen on the order">
        Open any order → Quality tab to rate the assigned staff on this scale. Defects
        logged there are what this report aggregates.
      </Banner>
    </>
  )
}
