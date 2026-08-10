import { useState } from 'react'
import { CLIENTS } from '@/data/seed'
import { INVOICES, ISTATUS, MONTHS, r2 } from '@/data/seed2'
import { fmtDate, money } from '@/lib/format'
import { useSession } from '@/lib/session'
import { DataTable, type Row } from '@/components/DataTable'
import { Banner, Chip, Kpi, PageHead, Sec } from '@/components/ui'

/** Invoicing — invoices generated so each client's rows sum exactly to their
 *  lifetime total and paid figure, as the original does, so this page and the
 *  client page can never disagree. */
export function Billing() {
  const { toast } = useSession()
  const [pill, setPill] = useState('all')
  const [cf, setCf] = useState('all')
  const [mf, setMf] = useState('all')

  const base = INVOICES.filter((i) =>
    (cf === 'all' || i.cl === cf) && (mf === 'all' || i.m === mf))

  const outstanding = r2(base.reduce((a, i) => a + (i.amt - i.paid), 0))
  const overdue = base.filter((i) => i.st === 'overdue')
  const overdueTotal = r2(overdue.reduce((a, i) => a + (i.amt - i.paid), 0))
  const invoiced = r2(base.reduce((a, i) => a + i.amt, 0))
  const collected = r2(base.reduce((a, i) => a + i.paid, 0))

  const rows: Row[] = base.map((i) => {
    const [label, tone] = ISTATUS[i.st]!
    const owing = i.amt - i.paid > 0
    return {
      key: i.id,
      k: [i.st, ...(owing ? ['owing'] : [])],
      text: `${i.id} ${i.cl} ${i.m}`,
      cells: [
        <><div className="v mono">{i.id}</div><div className="s">{i.m}</div></>,
        <div className="v">{i.cl}</div>,
        <div className="v mono" style={{ fontSize: '12.5px' }}>{fmtDate(i.issued)}</div>,
        <div className="v mono">{i.orders}</div>,
        <div className="v mono">{money(i.amt)}</div>,
        <>
          <div className="v mono">{money(r2(i.amt - i.paid))}</div>
          {i.paid > 0 && i.paid < i.amt && <div className="s">{money(i.paid)} paid</div>}
        </>,
        <Chip tone={tone}>{label}</Chip>,
      ],
    }
  })
  const countIn = (k: string) => rows.filter((r) => r.k.includes(k)).length

  return (
    <>
      <PageHead
        title="Invoicing"
        sub="Raised when an order is delivered. Every figure below follows the filters."
        actions={<button className="btn g" onClick={() => toast(`invoices export — ${base.length} rows`)}>Export</button>}
      />

      {overdue.length > 0 && (
        <Banner tone="d" icon="⚑" title={`${money(overdueTotal)} overdue across ${overdue.length} invoices`}>
          Past the payment terms. {[...new Set(overdue.map((i) => i.cl))].join(', ')}.
        </Banner>
      )}

      <div className="kpis">
        <Kpi t="Invoiced" v={money(invoiced)}
          d={`${base.length} invoices · ${cf === 'all' && mf === 'all' ? 'everything' : 'filtered'}`} />
        <Kpi t="Paid" v={money(collected)} dTone="ok"
          d={invoiced ? `${Math.round((collected / invoiced) * 100)}% collected` : '—'} />
        <Kpi t="Outstanding" v={money(outstanding)}
          cls={outstanding > 0 ? 'warnk' : undefined} dTone="warn" d="still to collect" />
        <Kpi t="Overdue" v={money(overdueTotal)}
          cls={overdueTotal > 0 ? 'alert' : undefined} dTone={overdueTotal > 0 ? 'bad' : 'ok'}
          d={`${overdue.length} invoice${overdue.length === 1 ? '' : 's'}`} />
      </div>

      <Sec>By client and month — click any figure to filter to it</Sec>
      <div className="tbl"><div className="tsc">
        <table className="mat" style={{ minWidth: 820 }}>
          <thead><tr>
            <th>Client</th>{MONTHS.map((m) => <th key={m}>{m}</th>)}<th>Total</th>
          </tr></thead>
          <tbody>
            {CLIENTS.filter((c) => c.total > 0).map((c) => (
              <tr key={c.n} className="clk">
                <td><b>{c.n}</b></td>
                {MONTHS.map((m) => {
                  const cell = INVOICES.filter((i) => i.cl === c.n && i.m === m)
                    .reduce((a, i) => a + i.amt, 0)
                  return (
                    <td className="n" key={m}
                      onClick={() => { setCf(c.n); setMf(m) }}>
                      {cell ? money(r2(cell)) : <span className="gr">·</span>}
                    </td>
                  )
                })}
                <td className="tot">{money(c.total)}</td>
              </tr>
            ))}
            <tr>
              <td className="tot">Total</td>
              {MONTHS.map((m) => (
                <td className="tot" key={m}>
                  {money(r2(INVOICES.filter((i) => i.m === m).reduce((a, i) => a + i.amt, 0)))}
                </td>
              ))}
              <td className="tot">{money(r2(INVOICES.reduce((a, i) => a + i.amt, 0)))}</td>
            </tr>
          </tbody>
        </table>
      </div></div>

      <Sec>All invoices</Sec>

      <DataTable
        cols={[
          { l: 'Invoice', w: 150 }, { l: 'Client', w: 110 }, { l: 'Issued', w: 110 },
          { l: 'Orders', w: 80 }, { l: 'Amount', w: 110 }, { l: 'Outstanding', w: 120 },
          { l: 'Status', w: 110 },
        ]}
        rows={rows}
        min={960}
        noun="invoices"
        search="Search invoice or client"
        active={pill}
        onPill={setPill}
        pills={[
          { key: 'all', label: 'All', count: rows.length },
          { key: 'overdue', label: 'Overdue', count: countIn('overdue'), urgent: true },
          { key: 'owing', label: 'Owing', count: countIn('owing') },
          { key: 'open', label: 'Open', count: countIn('open') },
          { key: 'part', label: 'Part paid', count: countIn('part') },
          { key: 'paid', label: 'Paid', count: countIn('paid') },
        ]}
        filters={[
          { label: 'Client', value: cf, onChange: setCf,
            options: [['all', 'All clients'], ...CLIENTS.filter((c) => c.total > 0).map((c): [string, string] => [c.n, c.n])] },
          { label: 'Month', value: mf, onChange: setMf,
            options: [['all', 'All months'], ...MONTHS.map((m): [string, string] => [m, m])] },
        ]}
      />

    </>
  )
}
