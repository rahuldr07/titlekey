import { useQuery } from '@tanstack/react-query'
import { api, queryKeys } from '@/lib/api'
import { INVOICE_STATUS } from '@/data/seed2'
import { fmtDate, money } from '@/lib/format'
import { DataTable, type Row } from '@/components/DataTable'
import { Banner, Chip, Kpi, Loading, PageHead, SectionHead } from '@/components/ui'
import type { Invoice } from '@/data/seed2'

export function Billing() {
  const { data: invoices, isLoading } = useQuery({ queryKey: queryKeys.invoices, queryFn: api.invoices })
  const { data: clients = [] } = useQuery({ queryKey: queryKeys.clients, queryFn: api.clients })

  if (isLoading || !invoices) return <Loading what="invoices" />

  const outstanding = invoices.reduce((a, i) => a + (i.amount - i.paid), 0)
  const overdue = invoices.filter((i) => i.status === 'overdue')
  const overdueTotal = overdue.reduce((a, i) => a + (i.amount - i.paid), 0)
  const invoiced = invoices.reduce((a, i) => a + i.amount, 0)
  const collected = invoices.reduce((a, i) => a + i.paid, 0)

  const rows: Row<Invoice>[] = invoices.map((i) => ({
    key: i.id,
    buckets: [i.status],
    data: i,
    cells: [
      <><div className="v mono">{i.id}</div><div className="s">{i.month}</div></>,
      <div className="v">{i.client}</div>,
      <div className="v mono">{fmtDate(i.issued)}</div>,
      <div className="v mono">{i.orders}</div>,
      <div className="v mono">{money(i.amount)}</div>,
      <>
        <div className="v mono">{money(i.amount - i.paid)}</div>
        {i.paid > 0 && i.paid < i.amount && (
          <div className="s">{money(i.paid)} paid</div>
        )}
      </>,
      <Chip tone={INVOICE_STATUS[i.status]![1] as 'b' | 'r' | 'v' | 'd'}>
        {INVOICE_STATUS[i.status]![0]}
      </Chip>,
    ],
  }))

  const countIn = (k: string) => rows.filter((r) => r.buckets.includes(k)).length

  return (
    <>
      <PageHead
        title="Invoicing"
        sub="What has been billed, and what is still owed."
        actions={<button className="btn g">Export</button>}
      />

      {overdue.length > 0 && (
        <Banner tone="d" icon="⚑" title={`${money(overdueTotal)} overdue across ${overdue.length} invoices`}>
          Past the payment terms. {overdue.map((i) => i.client).join(', ')}.
        </Banner>
      )}

      <div className="kpis">
        <Kpi title="Outstanding" icon="$" value={money(outstanding)}
          tone={outstanding > 0 ? 'warnk' : undefined} detailTone="warn" detail="not yet collected" />
        <Kpi title="Overdue" icon="▲" value={money(overdueTotal)}
          tone={overdueTotal > 0 ? 'alert' : undefined}
          detailTone={overdueTotal > 0 ? 'bad' : 'ok'}
          detail={`${overdue.length} invoice${overdue.length === 1 ? '' : 's'}`} />
        <Kpi title="Invoiced" icon="▤" value={money(invoiced)} detail="across all months" />
        <Kpi title="Collected" icon="✓" value={money(collected)} detailTone="ok"
          detail={`${((collected / invoiced) * 100).toFixed(0)}% of invoiced`} />
      </div>

      <DataTable
        columns={[
          { label: 'Invoice', width: 150 },
          { label: 'Client', width: 110 },
          { label: 'Issued', width: 110 },
          { label: 'Orders', width: 80 },
          { label: 'Amount', width: 110 },
          { label: 'Outstanding', width: 120 },
          { label: 'Status', width: 110 },
        ]}
        rows={rows}
        minWidth={960}
        noun="invoices"
        searchPlaceholder="Search invoice or client"
        pills={[
          { key: 'all', label: 'All', count: rows.length },
          { key: 'overdue', label: 'Overdue', count: countIn('overdue'), urgent: true },
          { key: 'open', label: 'Open', count: countIn('open') },
          { key: 'part', label: 'Part paid', count: countIn('part') },
          { key: 'paid', label: 'Paid', count: countIn('paid') },
        ]}
      />

      <SectionHead>By client</SectionHead>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {clients.map((c) => {
            const owed = c.total - c.paid
            const pct = c.total ? (c.paid / c.total) * 100 : 0
            return (
              <div className="rw" key={c.name}>
                <span className={owed > 0 ? 'warn' : 'ok'}>{owed > 0 ? '◷' : '✓'}</span>
                <span>
                  <b>{c.name}</b>
                  <div className="sd">{c.orders} orders · {c.terms}</div>
                  <div className="bar" style={{ marginTop: 6, maxWidth: 280 }}>
                    <i style={{ width: `${pct}%`, background: 'var(--ok)' }} />
                  </div>
                </span>
                <span style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: '13.5px' }}>{money(owed)}</div>
                  <div className="s gr">of {money(c.total)}</div>
                </span>
              </div>
            )
          })}
        </div>
      </div></div>
    </>
  )
}
