import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { NOW, STAGES, statusLabel, TZ } from '@/data/seed'
import { api, queryKeys } from '@/lib/api'
import { useSession } from '@/lib/session'
import { orderPlan } from '@/lib/sla'
import { DataTable, type Row } from '@/components/DataTable'
import { Banner, Chip, Due, Kpi, Loading, PageHead, SectionHead } from '@/components/ui'
import type { Order } from '@/data/types'

/** What a staff member opens on — only the stages that are theirs. */
export function MyWork() {
  const { me } = useSession()
  const navigate = useNavigate()
  const { data: orders, isLoading } = useQuery({ queryKey: queryKeys.orders, queryFn: api.orders })

  if (isLoading || !orders) return <Loading what="your work" />

  /** One row per STAGE, not per order — an order can be on your desk twice. */
  const mine = orders.flatMap((o) =>
    STAGES.filter((s) => o.assignments[s] === me.id).map((stage) => ({ order: o, stage })),
  )

  const late = mine.filter((m) => !m.order.done && m.order.dueAt < NOW)
  const soon = mine.filter(
    (m) => !m.order.done && m.order.dueAt >= NOW &&
      (m.order.dueAt.getTime() - NOW.getTime()) / 3_600_000 < 4,
  )
  const openCount = mine.filter((m) => !m.order.done).length

  const rows: Row<Order>[] = mine.map(({ order: o, stage }) => {
    const plan = orderPlan(o)
    const h = (o.dueAt.getTime() - NOW.getTime()) / 3_600_000
    return {
      key: `${o.id}-${stage}`,
      buckets: o.done ? ['done'] : h < 0 ? ['late'] : h < 4 ? ['soon'] : ['open'],
      data: o,
      onClick: () => navigate({ to: '/orders/$orderId', params: { orderId: o.id } }),
      cells: [
        <><div className="v mono">{o.id}</div><div className="s">{o.client}</div></>,
        <div className="v"><b>{stage}</b></div>,
        <><div className="v">{o.property}</div><div className="s">{o.county}, {o.state}</div></>,
        <Chip tone={o.done ? 'v' : o.dueAt < NOW ? 'd' : 'b'}>{statusLabel(o.status)}</Chip>,
        <>
          <Due at={o.dueAt} />
          {plan.doomed && <div className="s bad">the stages left need more time than is left</div>}
        </>,
      ],
    }
  })

  const countIn = (k: string) => rows.filter((r) => r.buckets.includes(k)).length

  return (
    <>
      <PageHead
        title="My work"
        sub={me.departments.length
          ? `${me.departments.join(', ')} · ${openCount} open on your desk`
          : 'You are not a member of any department, so nothing routes to you.'}
      />

      {late.length > 0 && (
        <Banner tone="d" icon="⚑" title={`${late.length} past due`}>
          These are already late. The client is owed an explanation.
        </Banner>
      )}

      <div className="kpis">
        <Kpi title="On your desk" icon="☰" value={openCount} detail="not yet finished" />
        <Kpi title="Past due" icon="▲" value={late.length}
          tone={late.length ? 'alert' : undefined}
          detailTone={late.length ? 'bad' : 'ok'}
          detail={late.length ? 'act on these first' : 'nothing overdue'} />
        <Kpi title="Due within 4h" icon="◷" value={soon.length}
          tone={soon.length ? 'warnk' : undefined} detailTone="warn" detail="running out of time" />
        <Kpi title="Daily target" icon="◎" value={me.capacity} detail="orders you can hold" />
      </div>

      <SectionHead>Every stage assigned to you</SectionHead>

      {rows.length === 0 ? (
        <div className="tbl">
          <div className="empty"><span className="ei">✓</span>
            <p>Nothing is assigned to you right now.</p></div>
        </div>
      ) : (
        <DataTable
          columns={[
            { label: 'Order', width: 120 },
            { label: 'Your stage', width: 110 },
            { label: 'Property', width: 190, grow: 1.4 },
            { label: 'Order stage', width: 120 },
            { label: `Due (${TZ})`, width: 180 },
          ]}
          rows={rows}
          minWidth={860}
          noun="stages"
          searchPlaceholder="Search order # or property"
          pills={[
            { key: 'all', label: 'All', count: rows.length },
            { key: 'late', label: 'Past due', count: countIn('late'), urgent: true },
            { key: 'soon', label: 'Due < 4h', count: countIn('soon'), urgent: true },
            { key: 'open', label: 'On track', count: countIn('open') },
            { key: 'done', label: 'Delivered', count: countIn('done') },
          ]}
        />
      )}

      <p className="gr" style={{ fontSize: '12.5px', marginTop: 12 }}>
        One order passes through several departments, so the same order can appear
        more than once if more than one stage is yours.
      </p>
    </>
  )
}
