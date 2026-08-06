import { useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { NOW, STAGES, statusLabel, staffName, TZ } from '@/data/seed'
import { api, queryKeys } from '@/lib/api'
import { hoursShort } from '@/lib/format'
import { useSession } from '@/lib/session'
import { orderPlan } from '@/lib/sla'
import { DataTable, type Row } from '@/components/DataTable'
import { AvatarStack, Chip, Due, Loading, PageHead } from '@/components/ui'
import type { Order } from '@/data/types'

export function Orders() {
  const { tenant, me, can } = useSession()
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { filter?: string }
  const [pill, setPill] = useState(search.filter ?? 'all')
  const [product, setProduct] = useState('all')
  const [client, setClient] = useState('all')
  const [department, setDepartment] = useState('all')

  const { data: orders, isLoading } = useQuery({ queryKey: queryKeys.orders, queryFn: api.orders })

  if (isLoading || !orders) return <Loading what="orders" />

  // A staff account sees only its own orders. That is the permission working,
  // not a limitation of the screen.
  const scope = can('all')
    ? orders
    : orders.filter((o) => Object.values(o.assignments).includes(me.id))

  const base = scope.filter((o) =>
    (product === 'all' || o.product === product) &&
    (client === 'all' || o.client === client) &&
    (department === 'all' || !!o.assignments[department]),
  )

  const bucketOf = (o: Order): string[] => {
    if (o.done) return ['done']
    const h = (o.dueAt.getTime() - NOW.getTime()) / 3_600_000
    if (h < 0) return ['late']
    if (h < 4) return ['soon']
    return ['open']
  }

  const rows: Row<Order>[] = base.map((o) => {
    const plan = orderPlan(o)
    return {
      key: o.id,
      buckets: bucketOf(o),
      data: o,
      onClick: () => navigate({ to: '/orders/$orderId', params: { orderId: o.id } }),
      cells: [
        <><div className="v mono">{o.id}</div><div className="s">{o.client}</div></>,
        <div className="v">{o.product}</div>,
        <><div className="v">{o.property}</div><div className="s">{o.county}, {o.state}</div></>,
        <Chip tone={o.done ? 'v' : o.dueAt < NOW ? 'd' : 'b'}>{statusLabel(o.status)}</Chip>,
        <>
          <Due at={o.dueAt} />
          {plan.doomed && (
            <div className="s bad">short {hoursShort(plan.shortHours)} for the stages left</div>
          )}
          {!plan.doomed && plan.behind && (
            <div className="s" style={{ color: 'var(--warn)', fontWeight: 500 }}>
              behind its {plan.behindAt} checkpoint
            </div>
          )}
        </>,
        <AvatarStack
          stages={STAGES}
          assignments={o.assignments}
          names={staffName}
        />,
      ],
    }
  })

  const countIn = (k: string) => rows.filter((r) => r.buckets.includes(k)).length

  return (
    <>
      <PageHead
        title="Orders"
        sub={can('all')
          ? `Every order in ${tenant.name}. One owner per stage — the dashed circles are nobody.`
          : `The ${scope.length} order${scope.length === 1 ? '' : 's'} you are on. Your account cannot see the rest, which is the point of the permission — not a limitation of the screen.`}
        actions={<button className="btn">＋ New order</button>}
      />

      <DataTable
        columns={[
          { label: 'Order', width: 120 },
          { label: 'Product', width: 95 },
          { label: 'Property', width: 190, grow: 1.4 },
          { label: 'Stage', width: 120 },
          { label: `Due (${TZ})`, width: 180 },
          { label: 'Search · SQ · Typ · TQC · Doc · RTS', width: 190 },
        ]}
        rows={rows}
        minWidth={1080}
        total={base.length}
        noun="orders"
        searchPlaceholder="Search order #, property or client"
        activePill={pill}
        onPillChange={setPill}
        pills={[
          { key: 'all', label: 'All', count: rows.length },
          { key: 'late', label: 'Past due', count: countIn('late'), urgent: true },
          { key: 'soon', label: 'Due < 4h', count: countIn('soon'), urgent: true },
          { key: 'open', label: 'On track', count: countIn('open') },
          { key: 'done', label: 'Delivered', count: countIn('done') },
        ]}
        filters={[
          {
            label: 'Product', value: product, onChange: setProduct,
            options: [{ value: 'all', label: 'All products' },
              ...[...new Set(orders.map((o) => o.product))].sort().map((p) => ({ value: p, label: p }))],
          },
          {
            label: 'Client', value: client, onChange: setClient,
            options: [{ value: 'all', label: 'All clients' },
              ...[...new Set(orders.map((o) => o.client))].sort().map((c) => ({ value: c, label: c }))],
          },
          {
            label: 'Department', value: department, onChange: setDepartment,
            options: [{ value: 'all', label: 'All departments' },
              ...STAGES.map((d) => ({ value: d, label: d }))],
          },
        ]}
      />

      <p className="gr" style={{ fontSize: '12.5px', marginTop: 12 }}>
        A red ring on an avatar means the same person is set to both type and QC that
        order — <b>self-review</b>. Assignment blocks it; see Quality.
      </p>
    </>
  )
}
