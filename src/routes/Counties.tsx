import { useQuery } from '@tanstack/react-query'
import { api, queryKeys } from '@/lib/api'
import { BAD_LINK_STATES, LINK_STATE, LINK_TYPES } from '@/data/seed2'
import { Chip, Kpi, Loading, PageHead, SectionHead } from '@/components/ui'

export function Counties() {
  const { data: counties, isLoading } = useQuery({ queryKey: queryKeys.counties, queryFn: api.counties })

  if (isLoading || !counties) return <Loading what="county coverage" />

  const states = [...new Set(counties.map((c) => c.state))].sort()
  const totalLinks = counties.length * LINK_TYPES.length
  const working = counties.reduce(
    (a, c) => a + LINK_TYPES.filter((t) => c.links[t.key]?.status === 'ok').length, 0)
  const missing = counties.reduce(
    (a, c) => a + LINK_TYPES.filter((t) => (c.links[t.key]?.status ?? 'none') === 'none').length, 0)
  const broken = counties.reduce(
    (a, c) => a + LINK_TYPES.filter((t) => BAD_LINK_STATES.includes(c.links[t.key]?.status ?? 'none')).length, 0)

  const GRID = `160px 70px 100px repeat(${LINK_TYPES.length}, minmax(120px, 1fr))`

  return (
    <>
      <PageHead
        title="County coverage"
        sub={`${counties.length} counties across ${states.length} states, and where their records come from.`}
        actions={<button className="btn g">Export</button>}
      />

      <div className="kpis">
        <Kpi title="Counties" icon="◈" value={counties.length} detail={states.join(' · ')} />
        <Kpi title="Links working" icon="✓" value={working} detailTone="ok"
          detail={`of ${totalLinks} possible`} />
        <Kpi title="Not working" icon="⚑" value={broken}
          tone={broken ? 'alert' : undefined} detailTone={broken ? 'bad' : 'ok'}
          detail="broken, moved, slow or needing a login" />
        <Kpi title="No link at all" icon="·" value={missing}
          detail="searched another way" />
      </div>

      <SectionHead>Coverage by county</SectionHead>

      <div className="tbl">
        <div className="tsc">
          <div style={{ minWidth: 900 }}>
            <div className="trow h" style={{ gridTemplateColumns: GRID }}>
              <span>County</span><span>State</span><span>Index from</span>
              {LINK_TYPES.map((t) => <span key={t.key}>{t.name}</span>)}
            </div>
            <div className="tb">
              {counties.map((c) => (
                <div className="trow" key={`${c.state}-${c.name}`} style={{ gridTemplateColumns: GRID }}>
                  <div className="cell"><div className="v"><b>{c.name}</b></div></div>
                  <div className="cell"><div className="v mono">{c.state}</div></div>
                  <div className="cell">
                    <div className="v mono">
                      {c.indexFrom ?? <span className="gr">unknown</span>}
                    </div>
                  </div>
                  {LINK_TYPES.map((t) => {
                    const link = c.links[t.key]
                    const status = link?.status ?? 'none'
                    const [label, tone] = LINK_STATE[status]!
                    return (
                      <div className="cell" key={t.key}>
                        <Chip tone={tone as 'n' | 'b' | 'v' | 'r' | 'd'}>{label}</Chip>
                        {link?.url && (
                          <div className="s" style={{ wordBreak: 'break-all' }}>
                            {link.url.replace(/^https?:\/\//, '')}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="gr" style={{ fontSize: '12.5px', marginTop: 12 }}>
        "No link" is not a gap — some counties are searched by other means. What matters
        is the ones that used to work and stopped; those are on the Link monitor.
      </p>
    </>
  )
}
