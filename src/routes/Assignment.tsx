import { useNavigate } from '@tanstack/react-router'
import { STAFF, AVAIL, who } from '@/data/seed'
import { RULES } from '@/data/seed2'
import { EXCLABEL, runEngine, type ExceptionCause } from '@/lib/engine'
import { useSession } from '@/lib/session'
import { Banner, Chip, Kpi, PageHead, Sec } from '@/components/ui'

const CAUSE: Record<ExceptionCause, readonly [string, string]> = {
  capacity: ['Everyone eligible was already at their daily target',
    'Raise the target, add someone to that department, or accept the queue.'],
  unavailable: ['Everyone eligible was on leave or off shift',
    'Cover, or a rule that routes elsewhere when a department is empty.'],
  'no-dept': ['Nobody belongs to that department',
    'Add a member, or the stage cannot run at all.'],
  self: ['The only person free had already done the paired stage',
    'Self-review is blocked, so the work waited rather than being checked by its author.'],
}
const EX_GRID = '160px 140px 150px 1fr'
const PL_GRID = '150px 130px 160px 1fr'

export function Assignment() {
  const navigate = useNavigate()
  const { toast } = useSession()
  const { placements, exc, load } = runEngine()

  const byCause = exc.reduce<Record<string, typeof exc>>((acc, e) => {
    ;(acc[e.cause] ??= []).push(e)
    return acc
  }, {})
  const roster = STAFF.filter((s) => s.dep.length > 0)

  return (
    <>
      <PageHead
        title="Assignment"
        sub="Auto-assign on arrival, then review the exceptions."
        actions={<>
          <button className="btn g" onClick={() => toast('Dry run — nothing was changed')}>Dry run</button>
          <button className="btn" onClick={() => toast(`${placements.length} stage${placements.length === 1 ? '' : 's'} assigned`)}>Run the pass</button>
        </>}
      />

      <div className="kpis">
        <Kpi t="Would place" icon="⇄" v={placements.length} d="stages with an owner" />
        <Kpi t="Could not place" icon="⚑" v={exc.length}
          cls={exc.length ? 'alert' : undefined} dTone={exc.length ? 'bad' : 'ok'}
          d={exc.length ? 'waiting on a person' : 'everything placed'} />
        <Kpi t="People available" icon="◎" v={roster.filter((s) => s.avail === 'ok').length}
          d={`of ${roster.length} on the roster`} />
        <Kpi t="Self-review blocked" icon="⊘" v={(byCause.self ?? []).length}
          d="the rule that cannot be turned off" />
      </div>

      <Sec>The rules, in the order they run</Sec>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {RULES.map((r) => (
            <div className="rw" key={r.id}>
              <span className={r.on ? 'ok' : 'gr'}>{r.on ? '✓' : '·'}</span>
              <span>
                <b>{r.n}</b>
                <div className="sd">When {r.when} → {r.then}</div>
              </span>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Chip tone={r.k === 'block' ? 'd' : r.k === 'route' ? 'b' : r.k === 'cover' ? 'r' : 'v'}>{r.k}</Chip>
                {r.lock && <span className="gr" style={{ fontSize: '11.5px' }}>cannot be turned off</span>}
              </span>
            </div>
          ))}
        </div>
        <p className="gr" style={{ fontSize: '12.5px', marginTop: 12 }}>
          A dated change log needs somewhere to store it — nothing here writes to a
          database yet, so edits live only in this session.
        </p>
      </div></div>

      {exc.length > 0 && (
        <Banner tone="r" icon="◷" title={`${exc.length} stages the engine could not place`}>
          These are not lost — they are waiting for a person to place them by hand.
          Grouped by why, because each cause has a different fix.
        </Banner>
      )}

      {Object.entries(byCause).sort((a, b) => b[1].length - a[1].length).map(([cause, list]) => {
        const [headline, remedy] = CAUSE[cause as ExceptionCause]
        return (
          <div key={cause}>
            <Sec>{headline} — {list.length}</Sec>
            <Banner tone="r" icon="◷" title="What would clear these">{remedy}</Banner>
            <div className="tbl"><div className="tsc"><div style={{ minWidth: 760 }}>
              <div className="trow h" style={{ gridTemplateColumns: EX_GRID }}>
                <span>Order</span><span>Stage</span><span>Client</span><span>What happened</span>
              </div>
              <div className="tb">
                {list.map((e) => (
                  <div
                    key={`${e.o.id}-${e.stage}`}
                    className="trow"
                    style={{ gridTemplateColumns: EX_GRID }}
                    role="button" tabIndex={0}
                    onClick={() => navigate({ to: '/orders/$orderId', params: { orderId: e.o.id } })}
                    onKeyDown={(ev) => { if (ev.key === 'Enter') navigate({ to: '/orders/$orderId', params: { orderId: e.o.id } }) }}
                  >
                    <div className="cell"><div className="v mono" style={{ fontSize: '12.5px' }}>{e.o.id}</div>
                      <div className="s">{e.o.pr}</div></div>
                    <div className="cell"><div className="v" style={{ fontSize: '12.5px' }}>{e.stage}</div></div>
                    <div className="cell"><div className="v" style={{ fontSize: '12.5px' }}>{e.o.cl}</div></div>
                    <div className="cell"><div className="v" style={{ fontSize: '12.5px' }}>{EXCLABEL[e.cause][0]}</div></div>
                  </div>
                ))}
              </div>
            </div></div></div>
          </div>
        )
      })}

      <Sec>What the pass would do</Sec>
      {placements.length === 0 ? (
        <div className="tbl"><div className="empty"><span className="ei">✓</span>
          <p>Every stage already has an owner.</p></div></div>
      ) : (
        <div className="tbl"><div className="tsc"><div style={{ minWidth: 760 }}>
          <div className="trow h" style={{ gridTemplateColumns: PL_GRID }}>
            <span>Order</span><span>Stage</span><span>Would go to</span><span>Why them</span>
          </div>
          <div className="tb">
            {placements.map((p) => (
              <div key={`${p.o.id}-${p.stage}`} className="trow" style={{ gridTemplateColumns: PL_GRID, cursor: 'default' }}>
                <div className="cell"><div className="v mono">{p.o.id}</div><div className="s">{p.o.cl}</div></div>
                <div className="cell"><div className="v">{p.stage}</div></div>
                <div className="cell"><div className="v">{p.who.n}</div></div>
                <div className="cell"><div className="s">{p.why}</div></div>
              </div>
            ))}
          </div>
        </div></div></div>
      )}

      <Sec>Where everyone stands</Sec>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {roster.map((s) => {
            const used = load[s.id] ?? s.open
            const pct = Math.min(100, (used / s.cap) * 100)
            return (
              <div className="rw" key={s.id}>
                <span className={s.avail === 'ok' ? 'ok' : 'warn'}>{s.avail === 'ok' ? '✓' : '·'}</span>
                <span>
                  <b>{s.n}</b>
                  <div className="sd">{s.dep.join(', ')}</div>
                  <div className="bar" style={{ marginTop: 6, maxWidth: 260 }}>
                    <i style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--bad)' : 'var(--brand2)' }} />
                  </div>
                </span>
                <span style={{ textAlign: 'right' }}>
                  <span className="mono" style={{ fontSize: '12.5px' }}>{used}/{s.cap}</span>
                  {s.avail !== 'ok' && (
                    <div style={{ marginTop: 4 }}><Chip tone={AVAIL[s.avail]![1]}>{AVAIL[s.avail]![0]}</Chip></div>
                  )}
                </span>
              </div>
            )
          })}
        </div>
        <p className="gr" style={{ fontSize: '12.5px', marginTop: 12 }}>
          This follows the same rules as the automatic pass — department membership,
          availability, target, and no self-review. {who('sk')} appears in both Typing
          and Typing QC; the self-review rule filters him out of QC on orders he typed.
        </p>
      </div></div>
    </>
  )
}
