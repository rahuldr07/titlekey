import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, queryKeys } from '@/lib/api'
import { LEAD_STATUS, STALE_BAD, STALE_WARN, daysSince, needsFollowUp } from '@/data/seed2'
import { fmtDate } from '@/lib/format'
import { DataTable, type Row } from '@/components/DataTable'
import { Banner, Chip, Kpi, Loading, PageHead, SectionHead } from '@/components/ui'
import type { Lead } from '@/data/seed2'

export function Leads() {
  const [selected, setSelected] = useState<Lead | null>(null)
  const { data: leads, isLoading } = useQuery({ queryKey: queryKeys.leads, queryFn: api.leads })

  if (isLoading || !leads) return <Loading what="leads" />

  const followUp = leads.filter(needsFollowUp)
  const open = leads.filter((l) => l.status !== 'won' && l.status !== 'lost')
  const won = leads.filter((l) => l.status === 'won')

  const rows: Row<Lead>[] = leads.map((l) => {
    const since = daysSince(l.lastContact)
    const stale = since >= STALE_BAD ? 'bad' : since >= STALE_WARN ? 'warn' : null
    return {
      key: l.id,
      buckets: [l.status, ...(needsFollowUp(l) ? ['followup'] : [])],
      data: l,
      onClick: () => setSelected(l),
      cells: [
        <><div className="v"><b>{l.company}</b></div><div className="s">{l.contact}</div></>,
        <div className="v">{l.state}</div>,
        <Chip tone={LEAD_STATUS[l.status]![1] as 'b' | 'r' | 'v' | 'd'}>
          {LEAD_STATUS[l.status]![0]}
        </Chip>,
        <div className="v mono">{l.volume}</div>,
        <>
          <div className="v mono">{fmtDate(l.lastContact)}</div>
          <div className={`s ${stale === 'bad' ? 'bad' : ''}`}
            style={stale === 'warn' ? { color: 'var(--warn)', fontWeight: 500 } : undefined}>
            {since === 0 ? 'today' : `${since}d ago`}
          </div>
        </>,
        <div className="v">{l.flagged ? <Chip tone="r">Flagged</Chip> : <span className="gr">—</span>}</div>,
      ],
    }
  })

  const countIn = (k: string) => rows.filter((r) => r.buckets.includes(k)).length

  return (
    <>
      <PageHead
        title="Leads"
        sub="Prospects, and who has gone quiet."
        actions={<button className="btn">＋ Add lead</button>}
      />

      {followUp.length > 0 && (
        <Banner tone="r" icon="◷" title={`${followUp.length} need following up`}>
          Flagged by hand, or no contact for {STALE_WARN} days or more.
        </Banner>
      )}

      <div className="kpis">
        <Kpi title="Open" icon="◎" value={open.length} detail="still in play" />
        <Kpi title="Need follow-up" icon="◷" value={followUp.length}
          tone={followUp.length ? 'warnk' : undefined} detailTone="warn"
          detail={`flagged or quiet ${STALE_WARN}d+`} />
        <Kpi title="Won" icon="✓" value={won.length} detailTone="ok" detail="signed" />
        <Kpi title="Lost" icon="·" value={leads.filter((l) => l.status === 'lost').length}
          detail="worth revisiting later" />
      </div>

      <DataTable
        columns={[
          { label: 'Company', width: 190, grow: 1.4 },
          { label: 'State', width: 70 },
          { label: 'Status', width: 110 },
          { label: 'Volume', width: 100 },
          { label: 'Last contact', width: 130 },
          { label: 'Flag', width: 90 },
        ]}
        rows={rows}
        minWidth={860}
        noun="leads"
        searchPlaceholder="Search company or contact"
        pills={[
          { key: 'all', label: 'All', count: rows.length },
          { key: 'followup', label: 'Need follow-up', count: countIn('followup'), urgent: true },
          { key: 'new', label: 'New', count: countIn('new') },
          { key: 'contacted', label: 'Contacted', count: countIn('contacted') },
          { key: 'quoted', label: 'Quoted', count: countIn('quoted') },
          { key: 'won', label: 'Won', count: countIn('won') },
        ]}
      />

      {selected && (
        <>
          <SectionHead>{selected.company}</SectionHead>
          <div className="card">
            <div className="ch">
              <h2>{selected.company}</h2>
              <div className="r">
                <Chip tone={LEAD_STATUS[selected.status]![1] as 'b' | 'r' | 'v' | 'd'}>
                  {LEAD_STATUS[selected.status]![0]}
                </Chip>
                <button className="btn g sm" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
            <div className="cb">
              <dl className="kv">
                <dt>Contact</dt><dd>{selected.contact}</dd>
                <dt>Email</dt><dd>{selected.email || <span className="gr">not given</span>}</dd>
                <dt>Phone</dt><dd className="mono">{selected.phone || <span className="gr">not given</span>}</dd>
                <dt>State</dt><dd>{selected.state}</dd>
                <dt>Volume</dt><dd className="mono">{selected.volume}</dd>
                <dt>Last contact</dt>
                <dd className="mono">{fmtDate(selected.lastContact)} · {daysSince(selected.lastContact)}d ago</dd>
              </dl>
              <SectionHead>Note</SectionHead>
              <p style={{ fontSize: '13.5px' }}>{selected.note}</p>
            </div>
          </div>
        </>
      )}
    </>
  )
}
