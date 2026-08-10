/**
 * County coverage and the Link monitor — the original's eleven counties and four
 * link types (Recorder, Assessor, Judgment, Tax), with the checker's cadence.
 */
import { LINKCHECK, LINKTYPES, LSTATE, COUNTIES, brokenLinks, nextCheck } from '@/data/seed2'
import { NOW, days } from '@/data/seed'
import { fmtDate } from '@/lib/format'
import { useSession } from '@/lib/session'
import { Banner, Chip, Kpi, PageHead, Sec } from '@/components/ui'

/* ══════════ COUNTY COVERAGE ══════════ */
export function Counties() {
  const { toast, tenant } = useSession()
  const totalLinks = COUNTIES.length * LINKTYPES.length
  const none = COUNTIES.reduce(
    (a, c) => a + LINKTYPES.filter((t) => (c.links[t.k]?.s ?? 'none') === 'none').length, 0)
  const broken = brokenLinks().length
  const GRID = `150px 60px 90px repeat(${LINKTYPES.length}, minmax(140px, 1fr))`

  return (
    <>
      <PageHead
        title="County coverage"
        sub={`Your own county record — ${tenant.name} maintains this, and nobody else can see or change it.`}
        actions={<>
          <button className="btn g" onClick={() => toast('Importing a CSV needs a file picker and a column mapper')}>Import CSV</button>
          <button className="btn g" onClick={() => toast(`county-coverage export — ${COUNTIES.length} rows`)}>Export</button>
          <button className="btn" onClick={() => toast('A county needs a name, a state and its links')}>＋ Add county</button>
        </>}
      />

      <div className="kpis">
        <Kpi t="Counties on file" v={COUNTIES.length} d="across every state we search" />
        <Kpi t="Links held" v={`${totalLinks - none} / ${totalLinks}`}
          d={`${LINKTYPES.length} per county`} />
        <Kpi t="Not working" v={broken}
          cls={broken ? 'alert' : undefined} dTone={broken ? 'bad' : 'ok'} d="needs attention" />
        <Kpi t="Missing" v={none} d="no address on file" />
      </div>

      <Sec>Coverage by county — index year and the four record sources</Sec>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 980 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>County</span><span>State</span><span>Index from</span>
          {LINKTYPES.map((t) => <span key={t.k} title={t.note}>{t.n}</span>)}
        </div>
        <div className="tb">
          {COUNTIES.map((c) => (
            <div className="trow" key={`${c.st}-${c.n}`} style={{ gridTemplateColumns: GRID, cursor: 'default' }}>
              <div className="cell"><div className="v"><b>{c.n}</b></div></div>
              <div className="cell"><div className="v mono">{c.st}</div></div>
              <div className="cell"><div className="v mono">{c.idx ?? <span className="gr">—</span>}</div></div>
              {LINKTYPES.map((t) => {
                const link = c.links[t.k]
                const s = link?.s ?? 'none'
                const [label, tone] = LSTATE[s]!
                return (
                  <div className="cell" key={t.k}>
                    <Chip tone={tone}>{label}</Chip>
                    {link?.u && <div className="s" style={{ wordBreak: 'break-all' }}>{link.u}</div>}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div></div></div>

      <p className="gr" style={{ fontSize: '12.5px', marginTop: 12 }}>
        “No link on file” is not a gap — some counties are searched by other means. The
        ones that used to work and stopped are on the Link monitor.
      </p>
    </>
  )
}

/* ══════════ LINK MONITOR ══════════ */
export function LinkMonitor() {
  const { toast } = useSession()
  const problems = brokenLinks()
  const by = (s: string) => problems.filter((p) => p.l.s === s)
  const total = COUNTIES.length * LINKTYPES.length
  const held = COUNTIES.reduce((a, c) => a + LINKTYPES.filter((t) => (c.links[t.k]?.u ?? '') !== '').length, 0)
  const working = COUNTIES.reduce((a, c) => a + LINKTYPES.filter((t) => c.links[t.k]?.s === 'ok').length, 0)
  const due = NOW >= nextCheck()
  const GRID = '150px 60px 110px 130px 1fr 1fr'

  return (
    <>
      <PageHead
        title="Link monitor"
        sub={`Every county link is checked every ${LINKCHECK.every} days. Anything that stops working is reported here.`}
        actions={<button className="btn" onClick={() => toast('Checking every link — anything that stopped working lands here')}>Run the check now</button>}
      />

      {by('broken').length > 0 && (
        <Banner tone="d" icon="⚑"
          title={`${by('broken').length} source${by('broken').length === 1 ? '' : 's'} not working`}>
          {[...new Set(by('broken').map((p) => p.c.n))].join(', ')} — any order needing
          those records is blocked until they come back or a replacement is found.
        </Banner>
      )}
      {due && (
        <Banner tone="r" icon="◷" title="Link check is due">
          Every {LINKCHECK.every} days · last ran {fmtDate(LINKCHECK.last)}, {days(LINKCHECK.last)} days ago.
        </Banner>
      )}

      <div className="kpis">
        <Kpi t="Links on file" v={held}
          d={`of ${total} possible across ${COUNTIES.length} counties`} />
        <Kpi t="Working" v={working} d={`${held ? Math.round((working / held) * 100) : 0}% of what we hold`} />
        <Kpi t="Not working" v={problems.length}
          cls={problems.length ? 'alert' : undefined}
          dTone={problems.length ? 'bad' : 'ok'} d="listed below" />
        <Kpi t="No link at all" v={total - held} d="nothing to check" />
        <Kpi t="Next check" v={fmtDate(nextCheck())} d={`every ${LINKCHECK.every} days`} />
      </div>

      <Sec>What is broken, grouped by what went wrong</Sec>
      {problems.length === 0 ? (
        <div className="tbl"><div className="empty"><span className="ei">✓</span>
          <p>Every county source is working.</p></div></div>
      ) : (
        <div className="tbl"><div className="tsc"><div style={{ minWidth: 920 }}>
          <div className="trow h" style={{ gridTemplateColumns: GRID }}>
            <span>County</span><span>State</span><span>Source</span><span>Status</span>
            <span>What happened</span><span>URL</span>
          </div>
          <div className="tb">
            {problems.map((p) => {
              const [label, tone] = LSTATE[p.l.s]!
              return (
                <div className="trow" key={`${p.c.st}-${p.c.n}-${p.k}`}
                  style={{ gridTemplateColumns: GRID, cursor: 'default' }}>
                  <div className="cell"><div className="v"><b>{p.c.n}</b></div></div>
                  <div className="cell"><div className="v mono">{p.c.st}</div></div>
                  <div className="cell"><div className="v">{p.lbl}</div></div>
                  <div className="cell"><Chip tone={tone}>{label}</Chip></div>
                  <div className="cell">
                    <div className="s">{p.l.err ?? '—'}</div>
                    {p.l.since && <div className="s">since {fmtDate(p.l.since)}</div>}
                  </div>
                  <div className="cell"><div className="s" style={{ wordBreak: 'break-all' }}>{p.l.u || '—'}</div></div>
                </div>
              )
            })}
          </div>
        </div></div></div>
      )}

      <Sec>The check</Sec>
      <div className="card"><div className="cb">
        <dl className="kv">
          <dt>Frequency</dt><dd>Every {LINKCHECK.every} days</dd>
          <dt>Last run</dt><dd className="mono">{fmtDate(LINKCHECK.last)} · {days(LINKCHECK.last)}d ago</dd>
          <dt>Next run</dt>
          <dd className="mono">{fmtDate(nextCheck())}{due && <span className="warn"> · overdue</span>}</dd>
          <dt>Notifies</dt><dd>Company admins</dd>
        </dl>
      </div></div>
    </>
  )
}
