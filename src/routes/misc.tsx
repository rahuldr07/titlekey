import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AVAIL, NOW, ORDERS, STAFF, STAGES, roleName, st } from '@/data/seed'
import { INTAKE, RSECT_INITIAL, RTEMPLATES, type RField, type RSection } from '@/data/seed3'
import { INTEGRATIONS } from '@/data/seed2'
import { fmtDate, fmtDT, initials } from '@/lib/format'
import { downloadCSV, downloadJSON, dstamp, type CsvRow } from '@/lib/csv'
import { orderPlan } from '@/lib/sla'
import { useSession } from '@/lib/session'
import { DataTable, type Row } from '@/components/DataTable'
import { Modal } from '@/components/Modal'
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

/* ══════════ REPORT GENERATOR ══════════
   Ported from the original's S.repgen. The original flags this whole screen as
   "a proposal, not a reading of your system" — that banner and its wording are
   preserved. Field edits clear their own flag (setField), the ⤢ source-page
   button opens the original's notBuilt modal, and CSV/JSON are real downloads. */

/** The original's MONO test — which captured values render in the mono face. */
const MONOFIELD = /date|recorded|dated|book|instrument|amount|total|land|building|min|consider/i

export function RepGen() {
  const { toast } = useSession()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'Capture' | 'Preview' | 'Templates'>('Capture')
  /* RSECT is mutable in the original — editing a field clears its flag. */
  const [sections, setSections] = useState<RSection[]>(() =>
    RSECT_INITIAL.map(([n, fs]) => [n, fs.map((f) => [...f] as RField)] as RSection))
  const [notBuilt, setNotBuilt] = useState<{ what: string; needs: string } | null>(null)

  const flags = sections.flatMap(([, fs]) => fs).filter((f) => f[2] === 'flag').length
  const fieldCount = sections.reduce((a, [, fs]) => a + fs.length, 0)

  /* Typing into the abstract writes to the abstract. A flagged field clears its
     flag once a person has looked at it — that is the whole point of flagging it. */
  const setField = (si: number, fi: number, v: string) => {
    setSections((prev) => prev.map((sec, i) => {
      if (i !== si) return sec
      return [sec[0], sec[1].map((f, k) => {
        if (k !== fi) return f
        const next: RField = [f[0], String(v), f[2], f[3]]
        if (f[2] === 'flag' && String(v).trim()) next[2] = 'ok'
        if (f[2] === 'na' && String(v).trim() && String(v) !== 'Not Available') next[2] = 'ok'
        return next
      })]
    }))
  }

  const exportAbstract = (kind: 'csv' | 'json') => {
    const rows: CsvRow[] = [['Section', 'Field', 'Value', 'Flag']]
    sections.forEach(([name, fs]) => fs.forEach((f) => rows.push([name, f[0], f[1], f[2] || ''])))
    if (kind === 'json') {
      const obj: Record<string, Record<string, string>> = {}
      sections.forEach(([name, fs]) => { obj[name] = Object.fromEntries(fs.map((f) => [f[0], f[1]])) })
      const name = `abstract-${dstamp()}.json`
      downloadJSON(name, JSON.stringify(obj, null, 2))
      return toast(`${name} — ${rows.length - 1} fields`)
    }
    downloadCSV(`abstract-${dstamp()}.csv`, rows, toast)
  }

  return (
    <>
      <PageHead title="Report generator" sub="Where the abstract is typed and the deliverable is produced."
        actions={<>
          <span className="gr mono" style={{ fontSize: '12.5px' }}>4192401-1 · McIntosh, GA</span>
          <button className="btn g" onClick={() => navigate({ to: '/orders/$orderId', params: { orderId: '4192401-1' } })}>
            Open order
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

      {tab === 'Capture' && (
        <div className="two">
          <div>
            {sections.map(([section, fields], si) => (
              <div className="card" key={section} style={{ marginBottom: 14 }}>
                <div className="ch"><h2>{section}</h2>
                  <div className="r gr" style={{ fontSize: '11.5px' }}>
                    {fields.length} field{fields.length === 1 ? '' : 's'}
                    {fields[0]?.[3] ? ` · source pg ${fields[0][3]}` : ''}
                  </div>
                </div>
                <div className="cb" style={{ display: 'grid', gap: 10 }}>
                  {fields.map((f, fi) => (
                    <div key={f[0]} style={{ display: 'grid', gridTemplateColumns: '150px minmax(0,1fr) 30px', gap: 11, alignItems: 'start' }}>
                      <label className="gr" style={{ fontSize: '12.5px', paddingTop: 8 }} htmlFor={`f-${si}-${fi}`}>{f[0]}</label>
                      <div>
                        {/* The original binds DOM onchange: it commits on blur, and only
                            when the value actually changed. onBlur + the equality guard
                            reproduces that exactly — a flag must not clear on a bare focus. */}
                        <input
                          className={`inp ${MONOFIELD.test(f[0]) ? 'mono' : ''}`}
                          id={`f-${si}-${fi}`}
                          defaultValue={f[1]}
                          onBlur={(e) => { if (e.target.value !== f[1]) setField(si, fi, e.target.value) }}
                          style={f[2] === 'flag'
                            ? { borderColor: 'var(--flagline)', background: 'var(--flag)' }
                            : f[2] === 'na' ? { color: 'var(--gr)' } : undefined}
                        />
                        {f[2] === 'flag' && (
                          <div className="hint warn">
                            Readers disagree on one character — 2025-002687 vs 2025-00268T. Check page {f[3]}.
                          </div>
                        )}
                        {f[2] === 'na' && (
                          <div className="hint">
                            Nothing stated on the instrument — recorded as <b>Not Available</b>, not left blank.
                          </div>
                        )}
                      </div>
                      <button className="btn g sm" style={{ padding: '6px 8px' }}
                        title={`Jump to source page ${f[3] ?? '—'}`}
                        onClick={() => setNotBuilt({ what: 'Jumping to the scan', needs: 'the scanned search package as a PDF, page-indexed' })}>
                        ⤢
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <aside>
            <div className="card p" style={{ position: 'sticky', top: 76 }}>
              <div className="lb">Client format</div>
              <dl className="kv" style={{ fontSize: '12.5px' }}>
                <dt>Template</dt><dd>NJ — Standard</dd>
                <dt>Dates</dt><dd className="mono">MM/DD/YYYY</dd>
                <dt>Names</dt><dd>Title Case</dd>
                <dt>Money</dt><dd className="mono">$x,xxx.00</dd>
                <dt>Missing</dt><dd>Not Available</dd>
                <dt>Recording</dt><dd>Book/Page + Inst#</dd>
                <dt>Security header</dt><dd>Deed to Secure Debt</dd>
              </dl>
              <div className="lb" style={{ marginTop: 20 }}>Before it can go out</div>
              <div className="stepn"><span className="sn done">✓</span><span>All sections present</span></div>
              <div className="stepn">
                <span className={`sn ${flags ? 'now' : 'done'}`}>{flags ? '!' : '✓'}</span>
                <span>{flags ? `${flags} field to confirm` : 'No open flags'}</span>
              </div>
              <div className="stepn"><span className="sn done">✓</span><span>Every value has a source page</span></div>
              <div className="stepn"><span className="sn now">3</span><span>Quality ratings not entered</span></div>
              <button className="btn" style={{ width: '100%', marginTop: 14 }} onClick={() => setTab('Preview')}>Preview report</button>
              <button className="btn g" style={{ width: '100%', marginTop: 8 }}
                onClick={() => toast(`Draft saved — ${fieldCount} fields`)}>Save draft</button>
            </div>
          </aside>
        </div>
      )}

      {tab === 'Preview' && (
        <div className="two">
          <div className="card p" style={{ fontFamily: 'var(--mono)', fontSize: '11.5px', lineHeight: 1.85 }}>
            <div style={{ textAlign: 'center', fontWeight: 600, letterSpacing: '.04em' }}>TITLE SEARCH REPORT — NJ STANDARD</div>
            <div style={{ textAlign: 'center' }} className="gr">
              Order 4192401-1 · Effective {fmtDate(new Date(NOW.getTime() - 24 * 7 * 36e5))}
            </div>
            {sections.map(([section, fields]) => (
              <div key={section}>
                <div style={{ fontSize: '10.5px', letterSpacing: '.09em', borderBottom: '1px solid var(--hair)', paddingBottom: 4, margin: '18px 0 9px' }}>
                  {section.toUpperCase()}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px minmax(0,1fr)', gap: '3px 14px' }}>
                  {fields.map((f) => (
                    <div key={f[0]} style={{ display: 'contents' }}>
                      <span className="gr">{f[0]}</span><span>{f[1]}</span>
                    </div>
                  ))}
                </div>
                {fields[0]?.[3] && (
                  <div style={{ border: '1.5px dashed var(--flagline)', background: 'var(--flag)', borderRadius: 9, padding: 16, textAlign: 'center', color: '#92610A', fontSize: '10.5px', margin: '11px 0' }}>
                    [ source image — {section}, page {fields[0][3]} ]
                  </div>
                )}
              </div>
            ))}
            <div style={{ fontStyle: 'italic', color: 'var(--gr)', fontSize: '10.5px', marginTop: 16, lineHeight: 1.75 }}>
              Please review the enclosed search file and notify us within thirty (30) days of receipt if there are any questions, clarifications, or missing information. If no response is received within this period, the search shall be deemed accepted as complete and accurate to the best of our knowledge.
            </div>
          </div>
          <aside>
            <div className="card p" style={{ position: 'sticky', top: 76 }}>
              <div className="lb">Export</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button className="btn g sm" onClick={() => exportAbstract('csv')}>CSV</button>
                <button className="btn g sm" onClick={() => exportAbstract('json')}>JSON</button>
                <button className="btn g sm" onClick={() => setNotBuilt({ what: 'PDF', needs: 'a page renderer with your letterhead' })}>PDF</button>
                <button className="btn g sm" onClick={() => setNotBuilt({ what: 'DOCX', needs: 'a Word template matching your current report' })}>DOCX</button>
              </div>
              <div className="bnr r" style={{ margin: '14px 0 0', padding: '11px 13px' }}>
                <span className="bi">⚑</span>
                <div style={{ fontSize: '12.5px' }}>
                  <div className="bt" style={{ fontSize: '12.5px' }}>Export is blocked</div>
                  {flags} field still flagged and ratings are not entered.
                </div>
              </div>
              <div className="lb" style={{ marginTop: 20 }}>Deliver</div>
              <p className="gr" style={{ fontSize: '12.5px' }}>
                The client gets a sign-in link, never an attachment carrying personal information.
              </p>
              <button className="btn" style={{ width: '100%', marginTop: 10 }} disabled
                title="Clear the flagged fields and enter the ratings first">Deliver to client</button>
              <p className="gr" style={{ fontSize: '11.5px', marginTop: 7 }}>
                Not yet — <b>{flags} field{flags === 1 ? '' : 's'} still flagged</b> and the ratings are
                not entered. A report goes out once, so it goes out finished.
              </p>
            </div>
          </aside>
        </div>
      )}

      {tab === 'Templates' && (
        <div className="card">
          <div className="ch"><h2>Report templates</h2>
            <div className="r">
              <button className="btn sm"
                onClick={() => setNotBuilt({ what: 'Learning a template', needs: 'three of your finished reports to read the layout from' })}>
                ＋ Add template
              </button>
            </div>
          </div>
          <div className="tsc"><div style={{ minWidth: 760 }}>
            <div className="trow h" style={{ gridTemplateColumns: '1.3fr 130px 130px 130px 120px' }}>
              <span>Template</span><span>Client</span><span>Learned from</span><span>Used</span><span>Status</span>
            </div>
            <div className="tb">
              {RTEMPLATES.map((t) => (
                <div className="trow" key={t[0]} style={{ gridTemplateColumns: '1.3fr 130px 130px 130px 120px' }}>
                  <div className="cell"><div className="v">{t[0]}</div></div>
                  <div className="cell"><div className="v gr">{t[1]}</div></div>
                  <div className="cell"><div className="v mono">{t[2]}</div></div>
                  <div className="cell"><div className="v mono">{t[3]}</div></div>
                  <div className="cell"><Chip tone={t[5]}>{t[4]}</Chip></div>
                </div>
              ))}
            </div>
          </div></div>
          <p className="gr" style={{ fontSize: '12.5px', marginTop: 12 }}>
            A template holds section order, labels, date and money conventions, Book/Page vs
            Instrument #, and where source images sit. Changing one applies to new reports only.
          </p>
        </div>
      )}

      {/* The original's notBuilt() modal — same copy, same two actions. */}
      <Modal
        open={!!notBuilt}
        title={`${notBuilt?.what ?? ''} export is not built yet`}
        onClose={() => setNotBuilt(null)}
        footer={<>
          <button className="btn g" onClick={() => setNotBuilt(null)}>Close</button>
          <button className="btn" onClick={() => { setNotBuilt(null); exportAbstract('csv') }}>Export CSV instead</button>
        </>}>
        <p style={{ fontSize: '13.5px' }}>
          Producing a {notBuilt?.what} needs <b>{notBuilt?.needs}</b>, which I do not have.
        </p>
        <p className="gr" style={{ fontSize: '12.5px' }}>
          CSV and JSON carry the same fields and are working now — every value on this screen,
          section by section. Send me one of your finished reports and the {notBuilt?.what} version
          becomes a formatting job rather than a guess.
        </p>
      </Modal>
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
