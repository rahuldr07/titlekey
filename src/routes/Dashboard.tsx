import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { NOW, STAGES, STATUS, statusColor, statusLabel, TZ } from '@/data/seed'
import { api, queryKeys } from '@/lib/api'
import { useSession } from '@/lib/session'
import { atRisk } from '@/lib/sla'
import { Chip, Due, Kpi, Loading, PageHead, SectionHead } from '@/components/ui'

export function Dashboard() {
  const { tenant } = useSession()
  const navigate = useNavigate()
  const [stageFilter, setStageFilter] = useState<string | null>(null)
  const { data: orders, isLoading } = useQuery({ queryKey: queryKeys.orders, queryFn: api.orders })

  if (isLoading || !orders) return <Loading what="the dashboard" />

  const pastDue = orders.filter((o) => !o.done && o.dueAt < NOW)
  const soon = orders.filter(
    (o) => !o.done && o.dueAt >= NOW && (o.dueAt.getTime() - NOW.getTime()) / 3_600_000 < 4,
  )
  const open = orders.filter((o) => !o.done)
  const unassigned = orders.filter(
    (o) => !o.done && Object.values(o.assignments).every((x) => !x),
  )
  const delivered = orders.filter((o) => o.done)
  const onTimePct = delivered.length
    ? (delivered.filter((o) => o.dueAt >= o.receivedAt).length / delivered.length) * 100
    : null

  const counts: Record<string, number> = {}
  for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1

  const shown = stageFilter ? orders.filter((o) => o.status === stageFilter) : pastDue

  return (
    <>
      <PageHead
        title="Dashboard"
        sub={`Everything live in ${tenant.name} right now.`}
        actions={
          <>
            <button className="btn g" onClick={() => navigate({ to: '/reports' })}>Reports</button>
            <button className="btn" onClick={() => navigate({ to: '/orders' })}>＋ New order</button>
          </>
        }
      />

      <div className="kpis">
        <Kpi
          title="Past due" icon="▲" value={pastDue.length}
          tone={pastDue.length ? 'alert' : undefined}
          detailTone={pastDue.length ? 'bad' : 'ok'}
          detail={pastDue.length ? 'client already owed an explanation' : 'nothing overdue'}
          onClick={() => navigate({ to: '/orders', search: { filter: 'late' } })}
        />
        <Kpi
          title="Due within 4h" icon="◷" value={soon.length}
          tone={soon.length ? 'warnk' : undefined} detailTone="warn"
          detail="act now to stay on time"
          onClick={() => navigate({ to: '/orders', search: { filter: 'soon' } })}
        />
        <Kpi
          title="Open orders" icon="☰" value={open.length}
          detail={`across ${STAGES.length} stages`}
          onClick={() => navigate({ to: '/orders', search: { filter: 'all' } })}
        />
        <Kpi
          title="Unassigned stages" icon="⇄" value={unassigned.length}
          detail="nobody picked them up"
          onClick={() => navigate({ to: '/assign' })}
        />
        <Kpi
          title="On time · 30d" icon="✓"
          value={onTimePct === null ? '—' : `${onTimePct.toFixed(1)}%`}
          tone={onTimePct !== null && onTimePct < 98 ? 'warnk' : undefined}
          detailTone={onTimePct !== null && onTimePct < 98 ? 'warn' : 'ok'}
          detail="target 98%"
        />
      </div>

      <SectionHead>Pipeline — click a stage to filter</SectionHead>
      <div className="pipe">
        {Object.keys(STATUS).map((k) => {
          const n = counts[k] ?? 0
          const on = stageFilter === k
          return (
            <button
              key={k}
              type="button"
              className={`pchip ${on ? 'on' : ''} ${n ? '' : 'zero'}`}
              aria-pressed={on}
              onClick={() => setStageFilter(on ? null : k)}
            >
              <span className="dt" style={{ background: statusColor(k) }} />
              {statusLabel(k)}
              <span className="n">{n}</span>
            </button>
          )
        })}
      </div>

      <SectionHead>
        {stageFilter
          ? `${statusLabel(stageFilter)} — ${shown.length} order${shown.length === 1 ? '' : 's'}`
          : 'Past due — needs attention first'}
      </SectionHead>

      {shown.length === 0 ? (
        <div className="tbl">
          <div className="empty"><span className="ei">✓</span><p>Nothing past due. The board is clean.</p></div>
        </div>
      ) : (
        <div className="tbl">
          <div className="tsc">
            <div style={{ minWidth: 900 }}>
              <div className="trow h" style={{ gridTemplateColumns: GRID }}>
                <span>Order</span><span>Product</span><span>Property</span>
                <span>Stage</span><span>Due ({TZ})</span><span>Age in stage</span>
              </div>
              <div className="tb">
                {shown.map((o) => (
                  <div
                    key={o.id}
                    className="trow clickable"
                    style={{ gridTemplateColumns: GRID }}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate({ to: '/orders/$orderId', params: { orderId: o.id } })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate({ to: '/orders/$orderId', params: { orderId: o.id } })
                      }
                    }}
                  >
                    <div className="cell">
                      <div className="v mono">{o.id}</div><div className="s">{o.client}</div>
                    </div>
                    <div className="cell"><div className="v">{o.product}</div></div>
                    <div className="cell">
                      <div className="v">{o.property}</div>
                      <div className="s">{o.county}, {o.state}</div>
                    </div>
                    <div className="cell">
                      <Chip tone={o.dueAt < NOW && !o.done ? 'd' : 'b'}>{statusLabel(o.status)}</Chip>
                    </div>
                    <div className="cell"><Due at={o.dueAt} /></div>
                    <div className="cell">
                      <div className="v" style={{ fontSize: '12.5px' }}>{o.age}</div>
                      {o.flag && <div className="s bad">{o.flag}</div>}
                      {!o.flag && atRisk(o) && <div className="s bad">cannot finish in time</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const GRID = '130px 110px 1.4fr 150px 190px 130px'
