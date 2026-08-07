import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { NOW, ORDERS, PASTDUE, STAGES, STATUS, TZ, st, stColor } from '@/data/seed'
import { runEngine } from '@/lib/engine'
import { fmtDate } from '@/lib/format'
import { atRisk, orderPlan } from '@/lib/sla'
import { useSession } from '@/lib/session'
import { Chip, Due, Kpi, Sec } from '@/components/ui'

const GRID = '130px 110px 1.4fr 150px 190px 130px'

export function Dashboard() {
  const { tenant } = useSession()
  const navigate = useNavigate()
  const [pipe, setPipe] = useState<string | null>(null)

  const soon = ORDERS.filter(
    (o) => !o.done && o.due >= NOW && (o.due.getTime() - NOW.getTime()) / 3_600_000 < 4,
  ).length
  const open = ORDERS.filter((o) => !o.done).length
  const unassigned = ORDERS.filter((o) => !o.done && Object.values(o.a).every((x) => !x)).length
  const delivered = ORDERS.filter((o) => o.done)
  const onTime = delivered.length
    ? (delivered.filter((o) => !atRisk(o)).length / delivered.length) * 100
    : null

  const counts: Record<string, number> = {}
  for (const o of ORDERS) counts[o.stt] = (counts[o.stt] ?? 0) + 1

  const shown = pipe ? ORDERS.filter((o) => o.stt === pipe) : ORDERS.filter((o) => !o.done && o.due < NOW)
  const { exc } = runEngine()
  const stillMoving = ORDERS.filter((o) => !o.done).length

  return (
    <>
      <div className="hd">
        <div>
          <h1 className="pg">Dashboard</h1>
          <p className="sub">Everything live in {tenant.name} right now.</p>
        </div>
        <div className="r">
          <button className="btn g" onClick={() => navigate({ to: '/reports' })}>Reports</button>
          <button className="btn" onClick={() => navigate({ to: '/orders/new' })}>＋ New order</button>
        </div>
      </div>

      <div className="kpis">
        <Kpi t="Past due" icon="▲" v={PASTDUE} cls={PASTDUE ? 'alert' : undefined}
          dTone={PASTDUE ? 'bad' : 'ok'}
          d={PASTDUE ? 'client already owed an explanation' : 'nothing overdue'}
          onClick={() => navigate({ to: '/orders', search: { filter: 'late' } })} />
        <Kpi t="Due within 4h" icon="◷" v={soon} cls={soon ? 'warnk' : undefined} dTone="warn"
          d="act now to stay on time"
          onClick={() => navigate({ to: '/orders', search: { filter: 'soon' } })} />
        <Kpi t="Open orders" icon="☰" v={open} d={`across ${STAGES.length} stages`}
          onClick={() => navigate({ to: '/orders', search: { filter: 'all' } })} />
        <Kpi t="Unassigned stages" icon="⇄" v={unassigned} d="nobody picked them up"
          onClick={() => navigate({ to: '/assign' })} />
        <Kpi t="On time · 30d" icon="✓"
          v={onTime === null ? '—' : `${onTime.toFixed(1)}%`}
          cls={onTime !== null && onTime < 98 ? 'warnk' : undefined}
          dTone={onTime !== null && onTime < 98 ? 'warn' : 'ok'}
          d="target 98%"
          onClick={() => navigate({ to: '/reports', search: { tab: 'Turnaround' } })} />
      </div>

      <Sec>Pipeline — click a stage to filter</Sec>
      <div className="pipe">
        {Object.keys(STATUS).map((k) => {
          const n = counts[k] ?? 0
          const on = pipe === k
          return (
            <button
              key={k}
              className={`pchip ${on ? 'on' : ''} ${n ? '' : 'zero'}`}
              aria-pressed={on}
              onClick={() => setPipe(on ? null : k)}
            >
              <span className="dt" style={{ background: stColor(k) }} />
              {st(k)}<span className="n">{n}</span>
            </button>
          )
        })}
      </div>

      <Sec>
        {pipe
          ? `${st(pipe)} — ${shown.length} order${shown.length === 1 ? '' : 's'}`
          : 'Past due — needs attention first'}
      </Sec>

      {shown.length === 0 ? (
        <div className="tbl">
          <div className="empty"><span className="ei">✓</span><p>Nothing past due. The board is clean.</p></div>
        </div>
      ) : (
        <div className="tbl"><div className="tsc"><div style={{ minWidth: 900 }}>
          <div className="trow h" style={{ gridTemplateColumns: GRID }}>
            <span>Order</span><span>Product</span><span>Property</span>
            <span>Stage</span><span>Due ({TZ})</span><span>Age in stage</span>
          </div>
          <div className="tb">
            {shown.map((o) => (
              <div
                key={o.id}
                className="trow"
                style={{ gridTemplateColumns: GRID }}
                role="button"
                tabIndex={0}
                onClick={() => navigate({ to: '/orders/$orderId', params: { orderId: o.id } })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate({ to: '/orders/$orderId', params: { orderId: o.id } })
                }}
              >
                <div className="cell"><div className="v mono">{o.id}</div><div className="s">{o.cl}</div></div>
                <div className="cell"><div className="v">{o.pr}</div></div>
                <div className="cell"><div className="v">{o.prop}</div><div className="s">{o.co}, {o.st}</div></div>
                <div className="cell"><Chip tone={o.due < NOW && !o.done ? 'd' : 'b'}>{st(o.stt)}</Chip></div>
                <div className="cell"><Due at={o.due} /></div>
                <div className="cell">
                  <div className="v" style={{ fontSize: '12.5px' }}>{o.age}</div>
                  {o.flag && <div className="s bad">{o.flag}</div>}
                  {!o.flag && orderPlan(o).doomed && !o.done && (
                    <div className="s bad">cannot finish in time</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div></div></div>
      )}

      <Sec>Today</Sec>
      <div className="kpis">
        <Kpi t="Received" v={ORDERS.length} d={`${fmtDate(NOW)} · every client`}
          onClick={() => navigate({ to: '/reports', search: { tab: 'Received' } })} />
        <Kpi t="Delivered" v={delivered.length} dTone="ok" d="through every department"
          onClick={() => navigate({ to: '/reports', search: { tab: 'Received' } })} />
        <Kpi t="Still moving" v={stillMoving} cls="warnk" dTone="warn" d="somewhere in the pipeline"
          onClick={() => navigate({ to: '/reports', search: { tab: 'Received' } })} />
        <Kpi t="Could not be placed" v={exc.length}
          cls={exc.length ? 'alert' : undefined} dTone={exc.length ? 'bad' : 'ok'}
          d="waiting on a person"
          onClick={() => navigate({ to: '/reports', search: { tab: 'By department' } })} />
      </div>
    </>
  )
}
