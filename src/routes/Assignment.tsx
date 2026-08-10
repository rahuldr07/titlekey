/**
 * Assignment — the original's five tabs:
 * Live · Exceptions · Capacity · Rules · Levels
 * Driven by the simulated intake (RUN), not the eight sample orders.
 */
import { useState } from 'react'
import { AVAIL, ASSIGN_STAGES, STAFF, who } from '@/data/seed'
import { LEVELS, RULES } from '@/data/seed2'
import { daySummary, getRun, isDone } from '@/lib/day'
import { useSession } from '@/lib/session'
import { Banner, Chip, Kpi, PageHead, Sec } from '@/components/ui'

const ATABS = ['Live', 'Exceptions', 'Capacity', 'Rules', 'Levels'] as const
type Tab = (typeof ATABS)[number]

const EXC_HEAD: Record<string, readonly [string, string]> = {
  capacity: ['Everyone eligible was already at their daily target',
    'Raise the target, add someone to that department, or accept the queue.'],
  unavailable: ['Everyone eligible was on leave or off shift',
    'Cover, or a rule that routes elsewhere when a department is empty.'],
  'no-dept': ['Nobody belongs to that department',
    'Add a member, or the stage cannot run at all.'],
  self: ['The only person free had already done the paired stage',
    'Self-review is blocked, so the work waited rather than being checked by its author.'],
}

export function Assignment() {
  const [tab, setTab] = useState<Tab>('Live')
  const { toast } = useSession()

  const days = daySummary()
  const today = days[days.length - 1]!
  const arrived = today.orders
  const placed = getRun().assigns.filter((a) => a.today)
  const exc = getRun().exc.filter((e) => e.today)
  const totalStages = arrived.length * ASSIGN_STAGES.length
  const hours = [...new Set(arrived.map((o) => o.hr))].sort((a, b) => a - b)

  return (
    <>
      <PageHead
        title="Assignment"
        sub={`Orders arrive through the day and are placed automatically. ${exc.length} need a person.`}
        actions={<>
          <button className="btn g" onClick={() => toast('Dry run — nothing was changed')}>Dry run</button>
          <button className="btn" onClick={() => toast(`${placed.length} stages assigned`)}>Run the pass</button>
        </>}
      />

      <div className="kpis">
        <Kpi t="Arrived today" v={arrived.length} d={`across ${hours.length} hours`} />
        <Kpi t="Placed" v={placed.length} d={`of ${totalStages} stages`} />
        <Kpi t="Exceptions" v={exc.length}
          cls={exc.length ? 'alert' : undefined} dTone={exc.length ? 'bad' : 'ok'}
          d="waiting on a person" onClick={() => setTab('Exceptions')} />
        <Kpi t="Self-review avoided" v={getRun().avoided} d="rule working silently" />
      </div>

      <div className="tabs">
        {ATABS.map((t) => (
          <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>
            {t}{t === 'Exceptions' && exc.length > 0 && <span className="bdg">{exc.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'Live' && <Live />}
      {tab === 'Exceptions' && <Exceptions />}
      {tab === 'Capacity' && <Capacity />}
      {tab === 'Rules' && <Rules />}
      {tab === 'Levels' && <Levels />}
    </>
  )
}

const LIVE_GRID = `140px 80px 100px 70px repeat(${ASSIGN_STAGES.length}, minmax(110px,1fr))`

/* ── Live — arrivals by hour, then the most recent orders and who got each stage ── */
function Live() {
  const days = daySummary()
  const today = days[days.length - 1]!
  const [hour, setHour] = useState<number | null>(null)
  const byHour = today.orders.reduce<Record<number, number>>((m, o) => {
    m[o.hr] = (m[o.hr] ?? 0) + 1
    return m
  }, {})
  const hours = Object.keys(byHour).map(Number).sort((a, b) => a - b)
  const shown = (hour === null ? today.orders : today.orders.filter((o) => o.hr === hour))
    .slice()
    .reverse()
    .slice(0, 14)

  return (
    <>
      <Sec>Arrivals by hour — click to filter</Sec>
      <div className="pipe" style={{ marginBottom: 16 }}>
        {hours.map((h) => (
          <button
            key={h}
            className={`pchip ${hour === h ? 'on' : ''}`}
            aria-pressed={hour === h}
            onClick={() => setHour(hour === h ? null : h)}
          >
            <span className="dt" style={{ background: 'var(--brand2)' }} />
            {h}:00<span className="n">{byHour[h]}</span>
          </button>
        ))}
      </div>

      <Sec>Most recent orders — click one to see why it went where it did</Sec>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 1000 }}>
        <div className="trow h" style={{ gridTemplateColumns: LIVE_GRID }}>
          <span>Order</span><span>Arrived</span><span>Product</span><span>State</span>
          {ASSIGN_STAGES.map((s) => <span key={s}>{s}</span>)}
        </div>
        <div className="tb">
          {shown.map((o) => (
            <div className="trow" key={o.id} style={{ gridTemplateColumns: LIVE_GRID, cursor: 'default' }}>
              <div className="cell"><div className="v mono" style={{ fontSize: '12.5px' }}>{o.id}</div>
                <div className="s">{o.cl}</div></div>
              <div className="cell"><div className="v mono" style={{ fontSize: '12.5px' }}>{o.hr}:00</div></div>
              <div className="cell"><div className="v">{o.pr}</div></div>
              <div className="cell"><div className="v mono">{o.st}</div></div>
              {ASSIGN_STAGES.map((s) => (
                <div className="cell" key={s}>
                  {o.a[s]
                    ? <div className="v" style={{ fontSize: '12.5px' }}>{who(o.a[s])}</div>
                    : <span className="gr" style={{ fontSize: '12.5px' }}>—</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div></div></div>
    </>
  )
}

const EX_GRID = '160px 140px 130px 90px 1fr'

/* ── Exceptions — grouped by why, because each cause has a different fix ── */
function Exceptions() {
  const exc = getRun().exc.filter((e) => e.today)
  const byCause = exc.reduce<Record<string, typeof exc>>((acc, e) => {
    ;(acc[e.why] ??= []).push(e)
    return acc
  }, {})

  if (!exc.length) {
    return (
      <div className="tbl"><div className="empty"><span className="ei">✓</span>
        <p>Every stage that arrived today found an owner.</p></div></div>
    )
  }

  return (
    <>
      <Banner tone="r" icon="◷" title={`${exc.length} stages the engine could not place`}>
        These are not lost — they are waiting for a person to place them by hand.
        Grouped by why, because each cause has a different fix.
      </Banner>
      {Object.entries(byCause).sort((a, b) => b[1].length - a[1].length).map(([cause, list]) => {
        const [headline, remedy] = EXC_HEAD[cause] ?? [cause, '']
        return (
          <div key={cause}>
            <Sec>{headline} — {list.length}</Sec>
            <Banner tone="r" icon="◷" title="What would clear these">{remedy}</Banner>
            <div className="tbl"><div className="tsc"><div style={{ minWidth: 800 }}>
              <div className="trow h" style={{ gridTemplateColumns: EX_GRID }}>
                <span>Order</span><span>Stage</span><span>Client</span><span>Arrived</span><span>What happened</span>
              </div>
              <div className="tb">
                {list.map((e, i) => (
                  <div className="trow" key={`${e.o.id}-${e.stage}-${i}`}
                    style={{ gridTemplateColumns: EX_GRID, cursor: 'default' }}>
                    <div className="cell"><div className="v mono" style={{ fontSize: '12.5px' }}>{e.o.id}</div>
                      <div className="s">{e.o.pr}</div></div>
                    <div className="cell"><div className="v" style={{ fontSize: '12.5px' }}>{e.stage}</div></div>
                    <div className="cell"><div className="v" style={{ fontSize: '12.5px' }}>{e.o.cl}</div></div>
                    <div className="cell"><div className="v mono" style={{ fontSize: '12.5px' }}>{e.o.hr}:00</div></div>
                    <div className="cell"><div className="v" style={{ fontSize: '12.5px' }}>{e.t}</div></div>
                  </div>
                ))}
              </div>
            </div></div></div>
          </div>
        )
      })}
    </>
  )
}

/* ── Capacity — where everyone stands against their own target ── */
function Capacity() {
  const roster = STAFF.filter((s) => s.dep.length > 0)
  const placed = getRun().assigns.filter((a) => a.today)
  return (
    <>
      <Sec>Where everyone stands</Sec>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {roster.map((s) => {
            const used = getRun().load[s.id] ?? s.open
            const mine = placed.filter((a) => a.who === s.id)
            const done = mine.filter((a) => isDone(a.o, a.stage)).length
            const pct = Math.min(100, (used / s.cap) * 100)
            return (
              <div className="rw" key={s.id}>
                <span className={s.avail === 'ok' ? 'ok' : 'warn'}>{s.avail === 'ok' ? '✓' : '·'}</span>
                <span>
                  <b>{s.n}</b>
                  <div className="sd">{s.dep.join(', ')} · {mine.length} placed today, {done} done</div>
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
      </div></div>
    </>
  )
}

/* ── Rules — in the order they run, with how often each was consulted ── */
function Rules() {
  const { toast } = useSession()
  return (
    <>
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
                <span className="mono gr" style={{ fontSize: '11.5px' }}>
                  {getRun().fired[r.id] ?? 0} checks
                </span>
                <Chip tone={r.k === 'block' ? 'd' : r.k === 'route' ? 'b' : r.k === 'cover' ? 'r' : 'v'}>{r.k}</Chip>
                {r.lock && <span className="gr" style={{ fontSize: '11.5px' }}>locked</span>}
              </span>
            </div>
          ))}
        </div>
        <p className="gr" style={{ fontSize: '12.5px', marginTop: 12 }}>
          A rule checked thousands of times that never removed anybody is doing nothing,
          and the count on its own hides that — the self-review rule narrowed the pool{' '}
          <b>{getRun().avoided}</b> times in this run.
          {' '}A dated change log needs somewhere to store it; nothing here writes to a
          database yet, so edits live only in this session.
        </p>
        <div style={{ display: 'flex', gap: 9, marginTop: 12 }}>
          <button className="btn g sm" onClick={() => toast('Rule change history — current state and how often each rule was consulted today')}>History</button>
          <button className="btn sm" onClick={() => toast('A rule needs a condition and a pool before it can run')}>＋ Add rule</button>
        </div>
      </div></div>
    </>
  )
}

/* ── Levels — who can work what ── */
function Levels() {
  return (
    <>
      <Banner tone="b" icon="◔" title="Nobody searches every state and nobody types every product">
        A level is a coverage envelope. Somebody with <b>no</b> level is not restricted —
        defaulting the other way would mean a new person can do nothing.
        Coverage is checked on {['Search', 'Search QC'].join(' and ')}.
      </Banner>
      <Sec>Coverage levels</Sec>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {LEVELS.map((l) => (
            <div className="rw" key={l.id}>
              <span className="gr">·</span>
              <span>
                <b>{l.n}</b>
                <div className="sd">{l.note}</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 7 }}>
                  <Chip tone="b">
                    {l.states === 'all' ? 'Every state' : `${(l.states as string[]).join(' · ')}`}
                  </Chip>
                  <Chip tone="v">
                    {l.products === 'all' ? 'Every product' : `${(l.products as string[]).length} products`}
                  </Chip>
                  {Object.keys(l.counties).length > 0 && (
                    <Chip tone="r">
                      named counties: {Object.entries(l.counties).map(([st, cs]) => `${st} — ${cs.join(', ')}`).join(' · ')}
                    </Chip>
                  )}
                </div>
              </span>
              <span />
            </div>
          ))}
        </div>
      </div></div>
    </>
  )
}
