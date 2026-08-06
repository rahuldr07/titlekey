import { useQuery } from '@tanstack/react-query'
import { api, queryKeys } from '@/lib/api'
import { BAD_LINK_STATES, LINK_CHECK, LINK_STATE, LINK_TYPES } from '@/data/seed2'
import { NOW } from '@/data/seed'
import { fmtDate } from '@/lib/format'
import { Banner, Chip, Kpi, Loading, PageHead, SectionHead } from '@/components/ui'

export function LinkMonitor() {
  const { data: counties, isLoading } = useQuery({ queryKey: queryKeys.counties, queryFn: api.counties })

  if (isLoading || !counties) return <Loading what="the link monitor" />

  const problems = counties.flatMap((c) =>
    LINK_TYPES
      .filter((t) => BAD_LINK_STATES.includes(c.links[t.key]?.status ?? 'none'))
      .map((t) => ({ county: c, type: t, link: c.links[t.key]! })),
  )

  const bySeverity = {
    broken: problems.filter((p) => p.link.status === 'broken'),
    moved: problems.filter((p) => p.link.status === 'moved'),
    auth: problems.filter((p) => p.link.status === 'auth'),
    slow: problems.filter((p) => p.link.status === 'slow'),
  }

  const nextCheck = new Date(LINK_CHECK.lastRun.getTime() + LINK_CHECK.everyDays * 86_400_000)
  const due = NOW >= nextCheck
  const daysSinceRun = Math.floor((NOW.getTime() - LINK_CHECK.lastRun.getTime()) / 86_400_000)

  const GRID = '160px 70px 110px 130px 1fr'

  return (
    <>
      <PageHead
        title="Link monitor"
        sub="County record sources, and which ones stopped working."
        actions={<button className="btn">Run the check now</button>}
      />

      {bySeverity.broken.length > 0 && (
        <Banner tone="d" icon="⚑"
          title={`${bySeverity.broken.length} source${bySeverity.broken.length === 1 ? '' : 's'} not responding`}>
          {[...new Set(bySeverity.broken.map((p) => p.county.name))].join(', ')} —
          any order needing those records is blocked until they come back or a
          replacement is found.
        </Banner>
      )}

      {due && (
        <Banner tone="r" icon="◷" title="The check is due">
          Runs every {LINK_CHECK.everyDays} days · last ran {fmtDate(LINK_CHECK.lastRun)},
          {' '}{daysSinceRun} days ago.
        </Banner>
      )}

      <div className="kpis">
        <Kpi title="Not responding" icon="⚑" value={bySeverity.broken.length}
          tone={bySeverity.broken.length ? 'alert' : undefined}
          detailTone={bySeverity.broken.length ? 'bad' : 'ok'}
          detail="dead links" />
        <Kpi title="Moved" icon="→" value={bySeverity.moved.length}
          detailTone="warn" detail="redirecting elsewhere" />
        <Kpi title="Needs a login" icon="⚿" value={bySeverity.auth.length}
          detailTone="warn" detail="credentials required" />
        <Kpi title="Very slow" icon="◷" value={bySeverity.slow.length}
          detailTone="warn" detail="usable but painful" />
      </div>

      <SectionHead>Everything that needs attention — {problems.length}</SectionHead>

      {problems.length === 0 ? (
        <div className="tbl"><div className="empty"><span className="ei">✓</span>
          <p>Every county source is working.</p></div></div>
      ) : (
        <div className="tbl">
          <div className="tsc">
            <div style={{ minWidth: 820 }}>
              <div className="trow h" style={{ gridTemplateColumns: GRID }}>
                <span>County</span><span>State</span><span>Source</span>
                <span>Status</span><span>URL</span>
              </div>
              <div className="tb">
                {problems.map((p) => {
                  const [label, tone] = LINK_STATE[p.link.status]!
                  return (
                    <div className="trow" key={`${p.county.state}-${p.county.name}-${p.type.key}`}
                      style={{ gridTemplateColumns: GRID }}>
                      <div className="cell"><div className="v"><b>{p.county.name}</b></div></div>
                      <div className="cell"><div className="v mono">{p.county.state}</div></div>
                      <div className="cell"><div className="v">{p.type.name}</div></div>
                      <div className="cell">
                        <Chip tone={tone as 'n' | 'b' | 'v' | 'r' | 'd'}>{label}</Chip>
                      </div>
                      <div className="cell">
                        <div className="s" style={{ wordBreak: 'break-all' }}>
                          {p.link.url.replace(/^https?:\/\//, '') || '—'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <SectionHead>How the check runs</SectionHead>
      <div className="card"><div className="cb">
        <dl className="kv">
          <dt>Frequency</dt><dd>Every {LINK_CHECK.everyDays} days</dd>
          <dt>Last run</dt><dd className="mono">{fmtDate(LINK_CHECK.lastRun)} · {daysSinceRun}d ago</dd>
          <dt>Next run</dt>
          <dd className="mono">
            {fmtDate(nextCheck)}{due && <span className="warn"> · overdue</span>}
          </dd>
          <dt>Notifies</dt><dd>Company admins</dd>
        </dl>
      </div></div>
    </>
  )
}
