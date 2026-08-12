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
  daySummary, getRun, curStage, isDone, ordersFor, staffWork, stageTotals,
} from '@/lib/day'
import { fmtDate, hh } from '@/lib/format'
import {
  QCDAYS, QPRESETS, getDeliveries, getQCLog, inRange, rangeOf, stageWorkOf, standing,
} from '@/lib/qc'
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

  const today = daySummary()[daySummary().length - 1]!
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
        {daySummary().map((d) => (
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
          All {daySummary().length} days
          <span className="n">{daySummary().reduce((a, d) => a + d.orders.length, 0)}</span>
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
  const assigns = getRun().assigns.filter((a) => day === 'all' || a.dk === day)
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
              const pct = Math.min(100, (getRun().load[s.id] ?? s.open) / s.cap * 100)
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
                    <div className="s">{getRun().load[s.id] ?? s.open} of {s.cap}</div>
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
  const assigns = getRun().assigns.filter((a) => day === 'all' || a.dk === day)
  const exc = getRun().exc.filter((e) => day === 'all' || e.dk === day)
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

/* ── Quality ──
   The original splits this tab in two: "The scores" (S._qualityReport, the
   90-day synthesis) and "How scoring works" (S._qualityCfg, the rule config).
   React previously shipped only the second half. */
function Quality() {
  const [sub, setSub] = useState<'The scores' | 'How scoring works'>('The scores')
  return (
    <>
      <div className="seg" style={{ marginBottom: 18 }}>
        {(['The scores', 'How scoring works'] as const).map((x) => (
          <button key={x} className={sub === x ? 'on' : ''} aria-pressed={sub === x}
            onClick={() => setSub(x)}>{x}</button>
        ))}
      </div>
      {sub === 'How scoring works' ? <QualityCfg /> : <QualityReport />}
    </>
  )
}

/* ── The scores — ported from S._qualityReport ── */
function QualityReport() {
  const [preset, setPreset] = useState('30')
  const r = rangeOf(preset)
  const dels = getDeliveries().filter((x) => inRange(x.d, r))
  const rows = getQCLog().filter((x) => inRange(x.d, r))
  const opportunities = dels.length * 2                    // two QC stages per delivery
  const cover = opportunities ? Math.round(rows.length / opportunities * 100) : 0
  const overall = rows.length ? rows.reduce((a, x) => a + x.avg, 0) / rows.length : 0
  const defects = rows.filter((x) => x.defect)
  const spread = [...new Set(rows.map((x) => Math.round(x.avg)))].length

  /* per person — keyed on the name stored at rating time, so leavers still appear */
  const by: Record<string, { n: string; c: number; acc: number; comp: number; fmt: number; def: number }> = {}
  rows.forEach((x) => {
    by[x.onName] ??= { n: x.onName, c: 0, acc: 0, comp: 0, fmt: 0, def: 0 }
    const p = by[x.onName]!
    p.c++; p.acc += x.acc; p.comp += x.comp; p.fmt += x.fmt; if (x.defect) p.def++
  })
  const TW = stageWorkOf(dels)
  const people = Object.values(by)
    .map((p) => ({ ...p, o: (p.acc + p.comp + p.fmt) / (3 * p.c), tw: TW[p.n] ?? null }))
    .sort((x, y) => y.c - x.c)

  /* coverage week by week — the reason a range is worth having */
  const weeks: { from: Date; to: Date; pct: number; n: number }[] = []
  for (let end = new Date(r.to); end >= r.from; end = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 7)) {
    const stt = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6)
    const w = { from: stt < r.from ? r.from : stt, to: end }
    const d2 = getDeliveries().filter((x) => inRange(x.d, w)).length * 2
    const g = getQCLog().filter((x) => inRange(x.d, w))
    weeks.unshift({ ...w, pct: d2 ? Math.round(g.length / d2 * 100) : 0, n: g.length })
    if (weeks.length > 14) break
  }

  const bar = (
    <>
      <div className="fbar" role="group" aria-label="Date range">
        {QPRESETS.map((p) => (
          <button key={p[0]} className={`pill ${r.preset === p[0] ? 'on' : ''}`}
            aria-pressed={r.preset === p[0]} onClick={() => setPreset(p[0])}>{p[1]}</button>
        ))}
      </div>
      <p className="cnt"><span>ⓘ</span> Showing <b>{fmtDate(r.from)}</b> to <b>{fmtDate(r.to)}</b> — every
        figure below follows this range. History goes back {QCDAYS} days.</p>
    </>
  )

  if (!dels.length) {
    return <>{bar}
      <div className="empty" style={{ padding: '40px 10px' }}><span className="ei">★</span>
        <p>No deliveries in this range, so there is nothing to score.</p>
        <button className="btn g sm" onClick={() => setPreset('30')}>Back to the last 30 days</button>
      </div></>
  }

  return (
    <>
      {bar}
      <div className="bnr r"><span className="bi">★</span><div>
        <div className="bt">{spread <= 2 ? 'These scores are not separating anyone' : 'Coverage is the weak point, not the scale'}</div>
        {cover}% of the work in this range was rated at all, and the average is {overall.toFixed(2)} out
        of 5{spread <= 2 ? ' with almost no spread' : ''}. A measure where everyone is near-perfect ranks nobody.
        <div className="bs">Making a rating mandatory before delivery, and scoring three criteria instead of one, fixes both.</div>
      </div></div>

      <div className="kpis">
        <div className="kpi"><div className="t">Delivered</div><div className="v">{dels.length.toLocaleString()}</div>
          <div className="d gr">{r.label}</div></div>
        <div className={`kpi ${cover < 90 ? 'warnk' : ''}`}><div className="t">Rated</div>
          <div className={`v ${cover < 90 ? 'warn' : 'ok'}`}>{cover}%</div>
          <div className="d gr">{rows.length.toLocaleString()} of {opportunities.toLocaleString()} checks</div></div>
        <div className="kpi"><div className="t">Average score</div>
          <div className={`v ${spread <= 2 ? 'warn' : ''}`}>{overall.toFixed(2)}</div>
          <div className="d gr">{spread <= 2 ? 'no spread' : `${spread} distinct levels`}</div></div>
        <div className={`kpi ${defects.length ? 'alert' : ''}`}><div className="t">Defects logged</div>
          <div className="v">{defects.length}</div>
          <div className="d gr">a 3 or below on any criterion</div></div>
      </div>

      <div className="card p" style={{ marginTop: 18 }}>
        <div className="lb">Coverage week by week — is rating becoming a habit?</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 120, margin: '14px 0 4px' }}>
          {weeks.map((wk) => (
            <div key={wk.to.toISOString()} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', gap: 5 }}
              title={`${fmtDate(wk.from)} – ${fmtDate(wk.to)}: ${wk.pct}% rated, ${wk.n} checks`}>
              <span className="mono gr" style={{ fontSize: '10.5px', textAlign: 'center' }}>{wk.pct}%</span>
              <span style={{ background: wk.pct >= 90 ? 'var(--ok)' : wk.pct >= 70 ? 'var(--brand2)' : 'var(--warn)', borderRadius: '5px 5px 0 0', height: `${Math.max(3, wk.pct)}%` }} />
              <span className="mono gr" style={{ fontSize: '9.5px', textAlign: 'center' }}>
                {String(wk.to.getMonth() + 1).padStart(2, '0')}/{String(wk.to.getDate()).padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
        <p className="gr" style={{ fontSize: '12.5px', marginTop: 10 }}>
          Bars are the share of checks actually filled in, week ending. Amber is below 70%. The scores
          themselves barely move — coverage is the variable worth watching.
        </p>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="ch"><h2>By person</h2>
          <div className="r gr" style={{ fontSize: '12.5px' }}>{people.length} rated in this range</div></div>
        <div className="tsc"><table className="mat" style={{ minWidth: 860 }}>
          <thead><tr>
            <th>Staff</th>
            <th style={{ textAlign: 'right' }}>Rated</th>
            <th style={{ textAlign: 'right' }}>Defects</th>
            <th style={{ textAlign: 'right' }}>Quality</th>
            <th style={{ textAlign: 'right' }} title="Stages of work they did in this range">Stages</th>
            <th style={{ textAlign: 'right' }} title="How often they finished inside budget, next to what others doing the same stages manage">On budget</th>
            <th style={{ textAlign: 'right' }} title="Median time taken as a multiple of the budget">vs budget</th>
            <th>Standing</th>
          </tr></thead>
          <tbody>
            {people.map((p) => {
              const t = p.tw
              const sd = t ? standing(p.o, t.vsPeers, overall) : null
              return (
                <tr key={p.n}>
                  <td><b>{p.n}</b>{STAFF.some((x) => x.n === p.n) ? '' : <span className="chip n">no longer here</span>}</td>
                  <td className="n mono">{p.c}</td>
                  <td className={`n mono ${p.def ? 'warn' : 'gr'}`}>{p.def || '—'}</td>
                  <td className="n mono">{p.o.toFixed(2)}</td>
                  <td className="n mono gr">{t ? t.c : '—'}</td>
                  <td className={`n mono ${t ? (t.vsPeers >= -5 ? 'ok' : t.vsPeers >= -15 ? 'warn' : 'bad') : 'gr'}`}>
                    {t ? `${t.onBudget}%` : '—'}
                    {t && <div className="s gr">peers {t.expected}%</div>}
                  </td>
                  <td className={`n mono ${t ? (t.ratio <= 1 ? 'ok' : 'warn') : 'gr'}`}>{t ? `${t.ratio.toFixed(2)}×` : '—'}</td>
                  <td>{sd ? <Chip tone={sd[1]}>{sd[0]}</Chip> : <span className="gr">—</span>}</td>
                </tr>
              )
            })}
            <tr>
              <td style={{ fontWeight: 700 }}>Everyone</td>
              <td className="tot">{rows.length}</td>
              <td className="tot">{defects.length}</td>
              <td className="tot">{overall.toFixed(2)}</td>
              <td colSpan={4} />
            </tr>
          </tbody>
        </table></div>
      </div>
    </>
  )
}

/* ── How scoring works — the original's S._qualityCfg ── */
function QualityCfg() {
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
          The self-review rule removed somebody {getRun().avoided} times in this run — that is
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
