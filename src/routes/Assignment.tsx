import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ASSIGN_STAGES, PAIRS } from '@/data/seed'
import { api, queryKeys } from '@/lib/api'
import { Banner, Chip, Kpi, Loading, PageHead, SectionHead } from '@/components/ui'
import type { Order, Staff } from '@/data/types'

/**
 * Auto-assign, then review the exceptions.
 *
 * The engine places each open stage on the emptiest eligible person. Eligibility
 * is department membership × availability × capacity × NOT self-review — the
 * same person may not both do and QC one order.
 *
 * Stages it cannot place are not lost; they surface below, grouped by WHY,
 * because each cause has a different fix.
 */
type ExceptionCause = 'capacity' | 'unavailable' | 'no-dept' | 'self'

const CAUSE: Record<ExceptionCause, readonly [string, string]> = {
  capacity: ['Everyone eligible was already at their daily target',
    'Raise the target, add someone to that department, or accept the queue.'],
  unavailable: ['Everyone eligible was on leave or off shift',
    'Arrange cover, or add a rule that routes elsewhere when a department is empty.'],
  'no-dept': ['Nobody belongs to that department',
    'Add a member, or the stage cannot run at all.'],
  self: ['The only person free had already done the paired stage',
    'Self-review is blocked, so the work waited rather than being checked by its author.'],
}

interface Placement { order: Order; stage: string; who: Staff }
interface Exception { order: Order; stage: string; cause: ExceptionCause }

function runEngine(orders: Order[], staff: Staff[]) {
  const load: Record<string, number> = {}
  for (const s of staff) load[s.id] = s.open

  const placements: Placement[] = []
  const exceptions: Exception[] = []

  for (const order of orders) {
    if (order.done) continue
    for (const stage of ASSIGN_STAGES) {
      if (order.assignments[stage]) continue

      const inDept = staff.filter((s) => s.departments.includes(stage) && s.active)
      if (inDept.length === 0) { exceptions.push({ order, stage, cause: 'no-dept' }); continue }

      const available = inDept.filter((s) => s.availability === 'ok')
      if (available.length === 0) { exceptions.push({ order, stage, cause: 'unavailable' }); continue }

      // Segregation of duties: not the person who did the paired stage.
      const paired = PAIRS[stage]
      const eligible = paired
        ? available.filter((s) => order.assignments[paired] !== s.id)
        : available
      if (eligible.length === 0) { exceptions.push({ order, stage, cause: 'self' }); continue }

      const withRoom = eligible.filter((s) => (load[s.id] ?? 0) < s.capacity)
      if (withRoom.length === 0) { exceptions.push({ order, stage, cause: 'capacity' }); continue }

      // Emptiest first, measured as a fraction of their own target.
      withRoom.sort((a, b) => (load[a.id]! / a.capacity) - (load[b.id]! / b.capacity))
      const pick = withRoom[0]!
      load[pick.id] = (load[pick.id] ?? 0) + 1
      placements.push({ order, stage, who: pick })
    }
  }
  return { placements, exceptions, load }
}

export function Assignment() {
  const navigate = useNavigate()
  const { data: orders } = useQuery({ queryKey: queryKeys.orders, queryFn: api.orders })
  const { data: staff } = useQuery({ queryKey: queryKeys.staff, queryFn: api.staff })

  if (!orders || !staff) return <Loading what="the assignment pass" />

  const { placements, exceptions, load } = runEngine(orders, staff)

  const byCause = exceptions.reduce<Record<string, Exception[]>>((acc, e) => {
    (acc[e.cause] ??= []).push(e)
    return acc
  }, {})

  const roster = staff.filter((s) => s.departments.length > 0)

  return (
    <>
      <PageHead
        title="Assignment"
        sub="What the engine would place right now, and what it could not."
        actions={<button className="btn">Run the pass</button>}
      />

      <div className="kpis">
        <Kpi title="Would place" icon="⇄" value={placements.length} detail="stages with an owner" />
        <Kpi title="Could not place" icon="⚑" value={exceptions.length}
          tone={exceptions.length ? 'alert' : undefined}
          detailTone={exceptions.length ? 'bad' : 'ok'}
          detail={exceptions.length ? 'waiting on a person' : 'everything placed'} />
        <Kpi title="People available" icon="◎"
          value={roster.filter((s) => s.availability === 'ok').length}
          detail={`of ${roster.length} on the roster`} />
        <Kpi title="Self-review blocked" icon="⊘"
          value={(byCause.self ?? []).length}
          detail="the rule that cannot be turned off" />
      </div>

      {exceptions.length > 0 && (
        <Banner tone="r" icon="◷" title={`${exceptions.length} stages could not be placed`}>
          They are not lost — they are waiting for a person to place them by hand.
          Grouped below by why, because each cause has a different fix.
        </Banner>
      )}

      {Object.entries(byCause)
        .sort((a, b) => b[1].length - a[1].length)
        .map(([cause, list]) => {
          const [headline, remedy] = CAUSE[cause as ExceptionCause]
          return (
            <div key={cause}>
              <SectionHead>{headline} — {list.length}</SectionHead>
              <Banner tone="r" icon="◷" title="What would clear these">{remedy}</Banner>
              <div className="tbl">
                <div className="tsc">
                  <div style={{ minWidth: 700 }}>
                    <div className="trow h" style={{ gridTemplateColumns: EX_GRID }}>
                      <span>Order</span><span>Stage</span><span>Client</span><span>Product</span>
                    </div>
                    <div className="tb">
                      {list.map((e) => (
                        <div
                          key={`${e.order.id}-${e.stage}`}
                          className="trow clickable"
                          style={{ gridTemplateColumns: EX_GRID }}
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate({ to: '/orders/$orderId', params: { orderId: e.order.id } })}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter' || ev.key === ' ') {
                              ev.preventDefault()
                              navigate({ to: '/orders/$orderId', params: { orderId: e.order.id } })
                            }
                          }}
                        >
                          <div className="cell"><div className="v mono">{e.order.id}</div></div>
                          <div className="cell"><div className="v">{e.stage}</div></div>
                          <div className="cell"><div className="v">{e.order.client}</div></div>
                          <div className="cell"><div className="v">{e.order.product}</div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

      <SectionHead>What the pass would do</SectionHead>
      {placements.length === 0 ? (
        <div className="tbl"><div className="empty"><span className="ei">✓</span>
          <p>Every stage already has an owner.</p></div></div>
      ) : (
        <div className="tbl">
          <div className="tsc">
            <div style={{ minWidth: 760 }}>
              <div className="trow h" style={{ gridTemplateColumns: PL_GRID }}>
                <span>Order</span><span>Stage</span><span>Would go to</span><span>Why them</span>
              </div>
              <div className="tb">
                {placements.map((p) => (
                  <div key={`${p.order.id}-${p.stage}`} className="trow" style={{ gridTemplateColumns: PL_GRID }}>
                    <div className="cell"><div className="v mono">{p.order.id}</div>
                      <div className="s">{p.order.client}</div></div>
                    <div className="cell"><div className="v">{p.stage}</div></div>
                    <div className="cell"><div className="v">{p.who.name}</div></div>
                    <div className="cell"><div className="s">
                      emptiest in {p.stage} at {load[p.who.id]}/{p.who.capacity}
                    </div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <SectionHead>Where everyone stands</SectionHead>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {roster.map((s) => {
            const used = load[s.id] ?? 0
            const pct = Math.min(100, (used / s.capacity) * 100)
            return (
              <div className="rw" key={s.id}>
                <span className={s.availability === 'ok' ? 'ok' : 'warn'}>
                  {s.availability === 'ok' ? '✓' : '·'}
                </span>
                <span>
                  <b>{s.name}</b>
                  <div className="sd">{s.departments.join(', ')}</div>
                  <div className="bar" style={{ marginTop: 6, maxWidth: 260 }}>
                    <i style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--bad)' : 'var(--brand2)' }} />
                  </div>
                </span>
                <span style={{ textAlign: 'right' }}>
                  <span className="mono" style={{ fontSize: '12.5px' }}>{used}/{s.capacity}</span>
                  {s.availability !== 'ok' && (
                    <div style={{ marginTop: 4 }}>
                      <Chip tone="r">{s.availability === 'leave' ? 'On leave' : 'Off shift'}</Chip>
                    </div>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div></div>

      <p className="gr" style={{ fontSize: '12.5px', marginTop: 12 }}>
        The engine is greedy least-loaded: it fills the emptiest eligible person first,
        measured against their own target. That enforces a hard ceiling but does not
        guarantee an optimal placement when capacity is tight — see the note in
        <code> src/routes/Assignment.tsx</code>.
      </p>
    </>
  )
}

const EX_GRID = '150px 130px 130px 1fr'
const PL_GRID = '150px 130px 160px 1fr'
