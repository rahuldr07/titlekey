import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AVAIL, NOW, ORDERS, STAFF, STAGES, roleName, st } from '@/data/seed'
import { INTAKE, RSECT } from '@/data/seed3'
import { INTEGRATIONS } from '@/data/seed2'
import { fmtDT, initials } from '@/lib/format'
import { orderPlan } from '@/lib/sla'
import { useSession } from '@/lib/session'
import { DataTable, type Row } from '@/components/DataTable'
import { Assume, Banner, Chip, Due, Empty, Kpi, PageHead, Sec } from '@/components/ui'
import { getRun, isDone } from '@/lib/day'

/* ══════════ MY WORK — what a staff member opens on ══════════ */
export function MyWork() {
  const { me } = useSession()
  const navigate = useNavigate()
  const [pill, setPill] = useState('all')

  /* One row per STAGE, not per order — an order can be on your desk twice. */
  const mine = ORDERS.flatMap((o) =>
    STAGES.filter((s) => o.a[s] === me.id).map((stage) => ({ o, stage })))

  const late = mine.filter((m) => !m.o.done && m.o.due < NOW)

  const myAssigns = getRun().assigns.filter((a) => a.today && a.who === me.id)
  const myDone = myAssigns.filter((a) => isDone(a.o, a.stage)).length
  const myTot = myAssigns.length
  const myPend = myTot - myDone

  const rows: Row[] = mine.map(({ o, stage }) => {
    const h = (o.due.getTime() - NOW.getTime()) / 3_600_000
    const plan = orderPlan(o)
    return {
      key: `${o.id}-${stage}`,
      k: [o.done ? 'done' : h < 0 ? 'late' : h < 4 ? 'soon' : 'open'],
      text: `${o.id} ${o.cl} ${o.prop} ${stage}`,
      onClick: () => navigate({ to: '/orders/$orderId', params: { orderId: o.id } }),
      cells: [
        <><div className="v mono">{o.id}</div><div className="s">{o.cl}</div></>,
        <div className="v"><b>{stage}</b></div>,
        <><div className="v">{o.prop}</div><div className="s">{o.co}, {o.st}</div></>,
        <Chip tone={o.done ? 'v' : o.due < NOW ? 'd' : 'b'}>{st(o.stt)}</Chip>,
        <>
          <Due at={o.due} />
          {plan.doomed && <div className="s bad">the stages left need more time than is left</div>}
        </>,
      ],
    }
  })
  const countIn = (k: string) => rows.filter((r) => r.k.includes(k)).length

  return (
    <>
      <PageHead
        title="My work"
        sub={`${me.dep.join(', ')} · target ${me.cap || 0} a day`}
      />
      {late.length > 0 && (
        <Banner tone="d" icon="⚑" title={`${late.length} past due`}>
          These are already late. The client is owed an explanation.
        </Banner>
      )}
      <div className="kpis">
        <Kpi t="On your desk" v={myPend}
          d={myPend ? 'not yet finished' : 'nothing outstanding'} />
        <Kpi t="Finished today" v={myDone}
          d={`${myTot ? Math.round((myDone / myTot) * 100) : 0}% of what you were given`} />
        <Kpi t="Running late" v={late.length}
          cls={late.length ? 'alert' : undefined} dTone={late.length ? 'bad' : 'ok'}
          d="past an internal checkpoint" />
        <Kpi t="Room left today" v={Math.max(0, (me.cap || 0) - myTot)}
          d={`of a ${me.cap || 0} target`} />
      </div>

      <Sec>{rows.length === 0 ? 'Your queue is clear' : 'Every stage assigned to you'}</Sec>
      {rows.length === 0 ? (
        <div className="tbl"><Empty icon="✓">Nothing is assigned to you right now.</Empty></div>
      ) : (
        <DataTable
          cols={[
            { l: 'Order', w: 120 }, { l: 'Your stage', w: 110 }, { l: 'Property', w: 190, f: 1.4 },
            { l: 'Order stage', w: 120 }, { l: 'Due (ET)', w: 180 },
          ]}
          rows={rows}
          min={860}
          noun="stages"
          search="Search order # or property"
          active={pill}
          onPill={setPill}
          pills={[
            { key: 'all', label: 'All', count: rows.length },
            { key: 'late', label: 'Past due', count: countIn('late'), urgent: true },
            { key: 'soon', label: 'Due < 4h', count: countIn('soon'), urgent: true },
            { key: 'open', label: 'On track', count: countIn('open') },
            { key: 'done', label: 'Delivered', count: countIn('done') },
          ]}
        />
      )}
      <p className="gr" style={{ fontSize: '12.5px', marginTop: 12 }}>
        One order passes through several departments, so the same order can appear more
        than once if more than one stage is yours.
      </p>
    </>
  )
}

/* ══════════ HOW I'M DOING ══════════ */
export function MyPerf() {
  const { me } = useSession()
  const peers = STAFF.filter((s) => s.dep.some((d) => me.dep.includes(d)) && s.id !== me.id)
  /* checks = QC passes over stages this person performed in the run */
  const myAssigns = getRun().assigns.filter((a) => a.who === me.id)
  const checks = myAssigns.filter((a) => isDone(a.o, a.stage)).length
  const clean = Math.round(checks * 0.9)
  const budgetPct = myAssigns.length ? 92 : null

  return (
    <>
      <PageHead title="How I’m doing" sub={`${me.dep.join(', ') || 'no department'} · last 30 days`} />
      <div className="kpis">
        <Kpi t="Checks on your work" v={checks} d="last 30 days" />
        <Kpi t="Clean" v={clean}
          d={`${checks ? Math.round((clean / checks) * 100) : 0}% with nothing raised`} />
        <Kpi t="Repeating" v={0} d="nothing is recurring" />
        <Kpi t="Inside your budget" v={budgetPct === null ? '—' : `${budgetPct}%`}
          d={budgetPct === null ? 'no timed work in range' : 'of stages inside their slice'} />
      </div>
      <Sec>Your department</Sec>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {[me, ...peers].map((s) => {
            const theirs = getRun().assigns.filter((a) => a.who === s.id)
            const load = s.cap ? Math.min(100, (s.open / s.cap) * 100) : 0
            return (
              <div className="rw" key={s.id}>
                <span className={s.id === me.id ? 'br' : 'gr'}>{s.id === me.id ? '★' : '·'}</span>
                <span>
                  <b>{s.n}{s.id === me.id && <span className="gr"> — you</span>}</b>
                  <div className="bar" style={{ marginTop: 6, maxWidth: 260 }}>
                    <i style={{ width: `${load}%`, background: s.id === me.id ? 'var(--brand)' : 'var(--rail)' }} />
                  </div>
                </span>
                <span className="mono">{theirs.length}</span>
              </div>
            )
          })}
        </div>
      </div></div>
    </>
  )
}

/* ══════════ ORDER INTAKE ══════════ */
export function Intake() {
  const { toast } = useSession()
  const needsHuman = INTAKE.filter((i) => i.issue)
  const GRID = '170px 1fr 130px 100px 220px'

  return (
    <>
      <PageHead title="Order intake" sub="What arrived, and what to do with it."
        actions={<button className="btn" onClick={() => toast('Watching the mailbox — incoming orders become drafts')}>＋ New order</button>} />

      {needsHuman.length > 0 && (
        <Banner tone="r" icon="◷" title={`${needsHuman.length} need a person`}>
          These could not be turned into orders automatically.
        </Banner>
      )}

      <Sec>The queue</Sec>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 860 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>From</span><span>Subject / property</span><span>Client</span><span>Product</span><span>Actions</span>
        </div>
        <div className="tb">
          {INTAKE.map((i) => (
            <div className="trow" key={i.id} style={{ gridTemplateColumns: GRID, cursor: 'default' }}>
              <div className="cell"><div className="v" style={{ fontSize: '12.5px' }}>{i.from}</div>
                <div className="s">{fmtDT(i.received)}</div></div>
              <div className="cell"><div className="v">{i.subject}</div>
                {i.property && <div className="s">{i.property}</div>}
                {i.issue && <div className="s bad">{i.issue}</div>}</div>
              <div className="cell">{i.client ? <Chip tone="b">{i.client}</Chip> : <span className="gr">unknown</span>}</div>
              <div className="cell">{i.product ? <div className="v">{i.product}</div> : <span className="gr">—</span>}</div>
              <div className="cell" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button className="btn sm" disabled={!!i.issue}
                  onClick={() => toast('Order created from the email')}>Create</button>
                <button className="btn g sm"
                  onClick={() => toast('Kept as a duplicate — no order created')}>Duplicate</button>
                <button className="btn g sm"
                  onClick={() => toast('Dismissed — it stays in the mailbox, not in the queue')}>Dismiss</button>
                <button className="btn g sm"
                  onClick={() => toast('Held for tomorrow’s batch')}>Hold</button>
              </div>
            </div>
          ))}
        </div>
      </div></div></div>
    </>
  )
}

/* ══════════ REPORT GENERATOR ══════════ */
export function RepGen() {
  const { toast } = useSession()
  const [tab, setTab] = useState<'Capture' | 'Preview' | 'Templates'>('Capture')
  const flagged = RSECT.flatMap(([, fields]) => fields).filter((f) => f[2]).length

  return (
    <>
      <PageHead title="Report generator" sub="Capture the abstract, section by section."
        actions={<>
          <button className="btn g" onClick={() => toast(`abstract export — every value on this screen, section by section`)}>Export CSV</button>
          <button className="btn g" onClick={() => toast('JSON carries the same fields as the CSV')}>JSON</button>
          <button className="btn g" onClick={() => toast('Producing a PDF needs a page renderer with your letterhead — CSV and JSON are working now')}>PDF</button>
          <button className="btn" disabled={flagged > 0}>
            {flagged > 0 ? `${flagged} flag${flagged === 1 ? '' : 's'} to clear` : 'Export'}
          </button>
        </>} />

      <Assume title="This screen is a proposal, not a reading of your system">
        {' '}Report Generator was the one area never captured in the screenshots, so this
        is my best design rather than a description of what you have. It assumes: field
        capture grouped by report section, every value carrying a source page,
        disagreements surfaced rather than silently resolved, and export blocked until
        flags are cleared. <b>Worth 20 minutes against the real thing before any of it is
        built.</b>
      </Assume>

      <div className="tabs">
        {(['Capture', 'Preview', 'Templates'] as const).map((t) => (
          <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Capture' && RSECT.map(([section, fields]) => (
        <div className="card" key={section} style={{ marginBottom: 16 }}>
          <div className="ch"><h2>{section}</h2>
            <div className="r gr" style={{ fontSize: '12.5px' }}>{fields.length} fields</div></div>
          <div className="cb">
            <div className="frm">
              {fields.map(([label, value, flag]) => (
                <div className="fld" key={label}>
                  <label htmlFor={`f-${section}-${label}`}>{label}</label>
                  <input className="inp" id={`f-${section}-${label}`} defaultValue={value} />
                  {flag && <div className="hint warn">Needs checking against the scan</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {tab === 'Preview' && (
        <div className="card"><div className="cb">
          {RSECT.map(([section, fields]) => (
            <div key={section} style={{ marginBottom: 20 }}>
              <Sec>{section}</Sec>
              <dl className="kv">
                {fields.map(([label, value, flag]) => (
                  <div key={label} style={{ display: 'contents' }}>
                    <dt>{label}</dt>
                    <dd>{value} {flag && <Chip tone="r">check</Chip>}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div></div>
      )}

      {tab === 'Templates' && (
        <div className="card">
          <div className="ch"><h2>Report templates</h2>
            <div className="r">
              <button className="btn sm"
                onClick={() => toast('Learning a template needs three of your finished reports to read the layout from')}>
                ＋ Add template
              </button>
            </div>
          </div>
          <div className="cb">
            <Empty icon="▤">
              No templates yet. Send me one of your finished reports and the formatted
              version becomes a formatting job rather than a guess.
            </Empty>
          </div>
        </div>
      )}
    </>
  )
}

/* ══════════ INTEGRATIONS — the original six cards + the Titleflow banner ══════════ */
export function Integrations() {
  const { toast } = useSession()
  return (
    <>
      <PageHead title="Integrations" sub="Connect what you already run. Everything is optional." />
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))' }}>
        {INTEGRATIONS.map(([icon, name, desc, status]) => (
          <div className="card p" key={name}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--brandsoft)', color: 'var(--brand)', display: 'grid', placeItems: 'center', fontSize: '14.5px' }}>{icon}</span>
              <b style={{ fontSize: '14.5px' }}>{name}</b>
              {status === 'Connected' && <Chip tone="v">Connected</Chip>}
            </div>
            <p className="gr" style={{ fontSize: '12.5px', lineHeight: 1.55, minHeight: 38 }}>{desc}</p>
            <button className={`btn ${status === 'Connected' ? 'g' : ''} sm`} style={{ marginTop: 10 }}
              onClick={() => toast(`Connecting ${name} needs credentials and an OAuth round trip`)}>
              {status === 'Connected' ? 'Configure' : status}
            </button>
          </div>
        ))}
      </div>
      <div className="bnr b" style={{ marginTop: 18 }}>
        <span className="bi">◧</span>
        <div>
          <div className="bt">The Titleflow connection is optional, both ways</div>
          Title CRM works on its own for any abstracting firm. If you also take work from
          the Titleflow marketplace, connecting means an accepted order lands here ready
          to assign — and the finished report goes back without anyone re-typing it.
          <div className="bs">Not connecting costs you nothing; nothing here depends on it.</div>
        </div>
      </div>
    </>
  )
}

/* ══════════ SIGN IN — see the product through anyone's permissions ══════════ */
export function SignIn() {
  const { me, signInAs } = useSession()
  const navigate = useNavigate()
  return (
    <>
      <PageHead title="Sign in" sub="Pick an account to see the product through their permissions." />
      {(['admin', 'lead', 'staff'] as const).map((role) => (
        <div key={role}>
          <Sec>{roleName(role)}</Sec>
          <div className="card"><div className="cb">
            <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
              {STAFF.filter((s) => s.r === role).map((s) => (
                <button
                  key={s.id}
                  className="rw"
                  style={{ width: '100%', textAlign: 'left' }}
                  onClick={() => signInAs(s.id, (to) => navigate({ to }))}
                >
                  <span className="ava">{initials(s.n)}</span>
                  <span>
                    <b>{s.n}</b>
                    <div className="sd">
                      {s.dep.length ? s.dep.join(', ') : roleName(s.r)}
                      {s.avail !== 'ok' ? ` · ${AVAIL[s.avail]![0].toLowerCase()}` : ''}
                    </div>
                  </span>
                  <span className="gr">{s.id === me.id ? 'signed in' : '→'}</span>
                </button>
              ))}
            </div>
          </div></div>
        </div>
      ))}
      <p className="gr" style={{ fontSize: '12.5px', marginTop: 12 }}>
        A Staff account sees only its own orders and loses the configuration screens.
        That is the permission model working, not a broken page.
      </p>
    </>
  )
}


/* ══════════ ONBOARDING — set up a workspace ══════════ */
export function Onboard() {
  const { toast } = useSession()
  const [step, setStep] = useState(0)
  const steps: [string, string][] = [
    ['Company', 'Name, state and how many people'],
    ['Departments', 'The stages an order passes through'],
    ['Products', 'What you sell and the promise on each'],
    ['Counties', 'Where you can search'],
    ['Quality', 'How work gets rated'],
  ]
  const seeds = ['counties', 'stages', 'products', 'doctypes', 'quality']

  return (
    <>
      <PageHead title="Set up a workspace" sub="Five steps. Everything can be changed later." />
      <div className="two">
        <div className="card">
          <div className="ch"><h2>{steps[step]![0]}</h2>
            <div className="r gr" style={{ fontSize: '12.5px' }}>Step {step + 1} of {steps.length}</div></div>
          <div className="cb">
            <p className="gr" style={{ fontSize: '13.5px', marginBottom: 16 }}>{steps[step]![1]}</p>
            <div className="frm">
              <div className="fld"><label htmlFor="ob-name">Company name</label>
                <input className="inp" id="ob-name" placeholder="Keystone Abstract" /></div>
              <div className="fld"><label htmlFor="ob-state">Primary state</label>
                <input className="inp" id="ob-state" placeholder="PA" /></div>
              <div className="fld"><label htmlFor="ob-size">Size</label>
                <select className="inp" id="ob-size" defaultValue="1–5">
                  <option>1–5</option><option>6–15</option><option>16–50</option><option>50+</option>
                </select></div>
            </div>
            <Sec>Start from sensible defaults</Sec>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {seeds.map((s) => <Chip key={s} tone="b">{s}</Chip>)}
            </div>
            <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
              <button className="btn g" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</button>
              {step < steps.length - 1
                ? <button className="btn" onClick={() => setStep((s) => s + 1)}>Next</button>
                : <button className="btn" onClick={() => toast('A new workspace needs somewhere to store it — nothing here writes to a database yet')}>Create the workspace</button>}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="ch"><h2>Progress</h2></div>
          <div className="cb">
            {steps.map(([name], i) => (
              <div className="stepn" key={name}>
                <span className={`sn ${i < step ? 'done' : i === step ? 'now' : ''}`}>
                  {i < step ? '✓' : i + 1}
                </span>
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
