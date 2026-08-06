import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { NOW, PRODUCTS, ROLES, STAGES, STAFF, roleName, statusLabel, staffName } from '@/data/seed'
import { INTAKE, INTEGRATIONS, REPORT_SECTIONS } from '@/data/seed3'
import { LEAD_STATUS, daysSince } from '@/data/seed2'
import { api, queryKeys } from '@/lib/api'
import { fmtDate, fmtDateTime, initials, money } from '@/lib/format'
import { useSession } from '@/lib/session'
import { Banner, Chip, Due, Kpi, Loading, PageHead, SectionHead } from '@/components/ui'

/* ══════════ ORDER INTAKE ══════════ */
export function Intake() {
  const GRID = '170px 1fr 150px 110px 130px'
  const needsHuman = INTAKE.filter((i) => i.issue)

  return (
    <>
      <PageHead title="Order intake" sub="What arrived, and what to do with it."
        actions={<button className="btn">＋ New order</button>} />

      {needsHuman.length > 0 && (
        <Banner tone="r" icon="◷" title={`${needsHuman.length} need a person`}>
          These could not be turned into orders automatically.
        </Banner>
      )}

      <div className="kpis">
        <Kpi title="Waiting" icon="✉" value={INTAKE.length} detail="in the mailbox" />
        <Kpi title="Ready to create" icon="✓" value={INTAKE.length - needsHuman.length}
          detailTone="ok" detail="client and product recognised" />
        <Kpi title="Need a person" icon="⚑" value={needsHuman.length}
          tone={needsHuman.length ? 'warnk' : undefined} detailTone="warn" detail="something is missing" />
        <Kpi title="Possible duplicates" icon="⊘"
          value={INTAKE.filter((i) => i.issue?.includes('duplicate')).length}
          detail="check before creating" />
      </div>

      <SectionHead>The queue</SectionHead>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 820 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>From</span><span>Subject / property</span><span>Client</span><span>Product</span><span>Actions</span>
        </div>
        <div className="tb">
          {INTAKE.map((i) => (
            <div className="trow" key={i.id} style={{ gridTemplateColumns: GRID }}>
              <div className="cell"><div className="v" style={{ fontSize: '12.5px' }}>{i.from}</div>
                <div className="s">{fmtDateTime(i.received)}</div></div>
              <div className="cell"><div className="v">{i.subject}</div>
                {i.property && <div className="s">{i.property}</div>}
                {i.issue && <div className="s bad">{i.issue}</div>}</div>
              <div className="cell">
                {i.client ? <Chip tone="b">{i.client}</Chip> : <span className="gr">unknown</span>}
              </div>
              <div className="cell">
                {i.product ? <div className="v">{i.product}</div> : <span className="gr">—</span>}
              </div>
              <div className="cell" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button className="btn sm" disabled={!!i.issue}>Create</button>
                <button className="btn g sm">Dismiss</button>
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
  const [tab, setTab] = useState<'Capture' | 'Preview' | 'Templates'>('Capture')
  const flagged = REPORT_SECTIONS.flatMap(([, fields]) => fields).filter((f) => f[2]).length

  return (
    <>
      <PageHead title="Report generator" sub="Capture the abstract, section by section."
        actions={<>
          <button className="btn g">Export CSV</button>
          <button className="btn" disabled={flagged > 0}>
            {flagged > 0 ? `${flagged} flag${flagged === 1 ? '' : 's'} to clear` : 'Export'}
          </button>
        </>} />

      <Banner tone="r" icon="✎" title="This screen is a proposal, not a reading of your system">
        Report Generator was never captured in the reference screenshots, so this is a
        best-guess design. It assumes capture grouped by report section, every value
        carrying a source page, and export blocked until flags are cleared.
        <b> Worth 20 minutes against the real thing before it is built for real.</b>
      </Banner>

      <div className="tabs">
        {(['Capture', 'Preview', 'Templates'] as const).map((t) => (
          <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Capture' && REPORT_SECTIONS.map(([section, fields]) => (
        <div className="card" key={section} style={{ marginBottom: 16 }}>
          <div className="ch"><h2>{section}</h2>
            <div className="r gr" style={{ fontSize: '12.5px' }}>{fields.length} fields</div></div>
          <div className="cb">
            <div className="frm">
              {fields.map(([label, value, flag]) => (
                <div className="fld" key={label}>
                  <label htmlFor={`f-${label}`}>{label}</label>
                  <input className="inp" id={`f-${label}`} defaultValue={value} />
                  {flag && <div className="hint warn">Needs checking against the scan</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {tab === 'Preview' && (
        <div className="card"><div className="cb">
          {REPORT_SECTIONS.map(([section, fields]) => (
            <div key={section} style={{ marginBottom: 20 }}>
              <SectionHead>{section}</SectionHead>
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
        <div className="card"><div className="cb">
          <div className="empty"><span className="ei">▤</span>
            <p>No templates yet. Learning one needs three finished reports to read the layout from.</p>
            <button className="btn sm">＋ Add template</button></div>
        </div></div>
      )}
    </>
  )
}

/* ══════════ INTEGRATIONS ══════════ */
export function Integrations() {
  const categories = [...new Set(INTEGRATIONS.map((i) => i.category))]
  return (
    <>
      <PageHead title="Integrations" sub="What this connects to." />
      {categories.map((cat) => (
        <div key={cat}>
          <SectionHead>{cat}</SectionHead>
          <div className="kpis" style={{ marginBottom: 8 }}>
            {INTEGRATIONS.filter((i) => i.category === cat).map((i) => (
              <div className="kpi" key={i.id}>
                <div className="t">{i.name}
                  {i.status === 'Connected' && <span className="i ok">✓</span>}</div>
                <div className="d gr" style={{ marginTop: 8 }}>{i.desc}</div>
                <button className={`btn ${i.status === 'Connected' ? 'g' : ''} sm`}
                  style={{ marginTop: 10 }}>
                  {i.status === 'Connected' ? 'Configure' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
      <Banner tone="b" icon="◔" title="Connecting is not built yet">
        Each one needs credentials and an OAuth round trip.
      </Banner>
    </>
  )
}

/* ══════════ SIGN IN ══════════ */
export function SignIn() {
  const { signInAs, me } = useSession()
  const navigate = useNavigate()

  return (
    <>
      <PageHead title="Sign in" sub="Pick an account to see the product through their permissions." />
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {STAFF.map((s) => (
            <button className="rw" key={s.id} style={{ width: '100%', textAlign: 'left' }}
              onClick={() => { signInAs(s.id); navigate({ to: '/' }) }}>
              <span className="ava">{initials(s.name)}</span>
              <span><b>{s.name}</b>
                <div className="sd">{roleName(s.role)}
                  {s.departments.length ? ` · ${s.departments.join(', ')}` : ''}</div></span>
              <span className="gr">{s.id === me.id ? 'signed in' : '→'}</span>
            </button>
          ))}
        </div>
      </div></div>
      <p className="gr" style={{ fontSize: '12.5px', marginTop: 12 }}>
        A Staff account sees only its own orders and loses the configuration screens.
        That is the permission model working, not a broken page.
      </p>
    </>
  )
}

/* ══════════ DENIED ══════════ */
export function Denied() {
  const navigate = useNavigate()
  const { me } = useSession()
  return (
    <>
      <PageHead title="You do not have access to that"
        sub={`${roleName(me.role)} does not include the permission that screen needs.`} />
      <div className="card"><div className="empty">
        <span className="ei">⚿</span>
        <p>Ask a company admin to change your role, or sign in as someone who has it.</p>
        <div style={{ display: 'flex', gap: 9, justifyContent: 'center' }}>
          <button className="btn g sm" onClick={() => navigate({ to: '/signin' })}>Switch account</button>
          <button className="btn sm" onClick={() => navigate({ to: '/' })}>Go to the dashboard</button>
        </div>
      </div></div>
    </>
  )
}

/* ══════════ ONBOARDING ══════════ */
export function Onboard() {
  const [step, setStep] = useState(0)
  const steps = [
    ['Company', 'Name, state and how many people'],
    ['Departments', 'The stages an order passes through'],
    ['Products', 'What you sell and the promise on each'],
    ['Counties', 'Where you can search'],
    ['Quality', 'How work gets rated'],
  ]

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
            </div>
            <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
              <button className="btn g" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</button>
              <button className="btn" disabled={step === steps.length - 1}
                onClick={() => setStep((s) => s + 1)}>Next</button>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="ch"><h2>Progress</h2></div>
          <div className="cb">
            {steps.map(([name], i) => (
              <div className="stepn" key={name}>
                <span className={`sn ${i < step ? 'done' : i === step ? 'now' : ''}`}>
                  {i < step ? '✓' : i + 1}</span>
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/* ══════════ HOW I'M DOING ══════════ */
export function MyPerf() {
  const { me } = useSession()
  const { data: orders } = useQuery({ queryKey: queryKeys.orders, queryFn: api.orders })
  if (!orders) return <Loading what="your performance" />

  const mine = orders.filter((o) => Object.values(o.assignments).includes(me.id))
  const done = mine.filter((o) => o.done).length
  const open = mine.length - done
  const pct = mine.length ? (done / mine.length) * 100 : 0
  const peers = STAFF.filter((s) => s.departments.some((d) => me.departments.includes(d)) && s.id !== me.id)

  return (
    <>
      <PageHead title="How I'm doing" sub={`${me.departments.join(', ') || 'No department'} · against the team.`} />
      <div className="kpis">
        <Kpi title="Orders touched" icon="☰" value={mine.length} detail="assigned to you" />
        <Kpi title="Completed" icon="✓" value={done} detailTone="ok" detail={`${pct.toFixed(0)}% of yours`} />
        <Kpi title="In hand" icon="◷" value={open} detailTone="warn" detail="not yet finished" />
        <Kpi title="Daily target" icon="◎" value={me.capacity} detail="orders you can hold" />
      </div>

      <SectionHead>Against your department</SectionHead>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {[me, ...peers].map((s) => {
            const theirs = orders.filter((o) => Object.values(o.assignments).includes(s.id))
            const load = Math.min(100, (s.open / s.capacity) * 100)
            return (
              <div className="rw" key={s.id}>
                <span className={s.id === me.id ? 'br' : 'gr'}>{s.id === me.id ? '★' : '·'}</span>
                <span>
                  <b>{s.name}{s.id === me.id && <span className="gr"> — you</span>}</b>
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

/* ══════════ NEW ORDER ══════════ */
export function NewOrder() {
  const navigate = useNavigate()
  const { data: clients = [] } = useQuery({ queryKey: queryKeys.clients, queryFn: api.clients })
  const [product, setProduct] = useState(PRODUCTS[0]!.id)
  const chosen = PRODUCTS.find((p) => p.id === product)!

  return (
    <>
      <button className="btn g sm" style={{ marginBottom: 14 }}
        onClick={() => navigate({ to: '/orders' })}>← Back to orders</button>
      <PageHead title="New order" sub="The due date follows from the client promise on the product." />

      <div className="two">
        <div className="card"><div className="cb">
          <div className="frm">
            <div className="fld"><label htmlFor="no-client">Client</label>
              <select className="inp" id="no-client">
                {clients.map((c) => <option key={c.name}>{c.name}</option>)}
              </select></div>
            <div className="fld"><label htmlFor="no-product">Product</label>
              <select className="inp" id="no-product" value={product}
                onChange={(e) => setProduct(e.target.value)}>
                {PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></div>
            <div className="fld"><label htmlFor="no-prop">Property address</label>
              <input className="inp" id="no-prop" placeholder="118 Sara Ln, Johnstown" /></div>
            <div className="fld"><label htmlFor="no-county">County</label>
              <input className="inp" id="no-county" placeholder="Cambria" /></div>
            <div className="fld"><label htmlFor="no-state">State</label>
              <input className="inp" id="no-state" placeholder="PA" /></div>
          </div>
          <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
            <button className="btn g" onClick={() => navigate({ to: '/orders' })}>Cancel</button>
            <button className="btn">Create the order</button>
          </div>
        </div></div>

        <div className="card">
          <div className="ch"><h2>What this commits to</h2></div>
          <div className="cb">
            <dl className="kv">
              <dt>Fee</dt><dd className="mono">{money(chosen.fee)}</dd>
              <dt>Promise</dt><dd className="mono">{chosen.slaHours}h</dd>
              <dt>Due</dt>
              <dd><Due at={new Date(NOW.getTime() + chosen.slaHours * 3_600_000)} /></dd>
            </dl>
            <SectionHead>Stages it will pass through</SectionHead>
            {STAGES.map((s, i) => (
              <div className="stepn" key={s}>
                <span className="sn">{i + 1}</span><span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/* ══════════ LEAD DETAIL ══════════ */
export function LeadDetail() {
  const { leadId } = useParams({ from: '/leads/$leadId' })
  const navigate = useNavigate()
  const { data: lead, isLoading } = useQuery({
    queryKey: queryKeys.lead(leadId), queryFn: () => api.lead(leadId),
  })

  if (isLoading) return <Loading what="the lead" />
  if (!lead) {
    return (
      <>
        <PageHead title="That lead is not here" sub="It may have been removed." />
        <div className="card"><div className="empty"><span className="ei">·</span>
          <p>Nothing to show.</p>
          <button className="btn sm" onClick={() => navigate({ to: '/leads' })}>Back to leads</button>
        </div></div>
      </>
    )
  }

  const [label, tone] = LEAD_STATUS[lead.status]!
  return (
    <>
      <button className="btn g sm" style={{ marginBottom: 14 }}
        onClick={() => navigate({ to: '/leads' })}>← Back to leads</button>
      <PageHead title={lead.company} sub={`${lead.contact} · ${lead.state}`}
        actions={<>
          <Chip tone={tone as 'n' | 'b' | 'v' | 'r' | 'd'}>{label}</Chip>
          <button className="btn g">Add note</button>
          <button className="btn">Convert to client</button>
        </>} />

      {daysSince(lead.lastContact) >= 14 && lead.status !== 'won' && lead.status !== 'lost' && (
        <Banner tone="r" icon="◷" title={`No contact for ${daysSince(lead.lastContact)} days`}>
          They have gone quiet. Worth one more attempt before writing it off.
        </Banner>
      )}

      <div className="two">
        <div className="card">
          <div className="ch"><h2>Note</h2></div>
          <div className="cb"><p style={{ fontSize: '13.5px' }}>{lead.note}</p></div>
        </div>
        <div className="card">
          <div className="ch"><h2>Details</h2></div>
          <div className="cb">
            <dl className="kv">
              <dt>Contact</dt><dd>{lead.contact}</dd>
              <dt>Email</dt><dd>{lead.email}</dd>
              <dt>Phone</dt><dd className="mono">{lead.phone}</dd>
              <dt>State</dt><dd>{lead.state}</dd>
              <dt>Volume</dt><dd className="mono">{lead.volume}</dd>
              <dt>Last contact</dt><dd className="mono">{fmtDate(lead.lastContact)}</dd>
              <dt>Owner</dt><dd>{staffName(lead.owner)}</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  )
}

/* ══════════ NEW LEAD ══════════ */
export function NewLead() {
  const navigate = useNavigate()
  return (
    <>
      <button className="btn g sm" style={{ marginBottom: 14 }}
        onClick={() => navigate({ to: '/leads' })}>← Back to leads</button>
      <PageHead title="Add a lead" sub="Only the company name is required." />
      <div className="card"><div className="cb">
        <div className="frm">
          <div className="fld"><label htmlFor="nl-co">Company</label>
            <input className="inp" id="nl-co" placeholder="Cardinal Title Group" /></div>
          <div className="fld"><label htmlFor="nl-contact">Contact</label>
            <input className="inp" id="nl-contact" placeholder="Dana Whitmore" /></div>
          <div className="fld"><label htmlFor="nl-email">Email</label>
            <input className="inp" id="nl-email" type="email" placeholder="dana@example.com" /></div>
          <div className="fld"><label htmlFor="nl-phone">Phone</label>
            <input className="inp mono" id="nl-phone" placeholder="(614) 555-0143" /></div>
          <div className="fld"><label htmlFor="nl-state">State</label>
            <input className="inp" id="nl-state" placeholder="OH" /></div>
          <div className="fld"><label htmlFor="nl-vol">Expected volume</label>
            <input className="inp" id="nl-vol" placeholder="~120/mo" /></div>
        </div>
        <div className="fld" style={{ marginTop: 15 }}>
          <label htmlFor="nl-note">Note</label>
          <textarea className="inp" id="nl-note" placeholder="What they need, and what was agreed." />
        </div>
        <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
          <button className="btn g" onClick={() => navigate({ to: '/leads' })}>Cancel</button>
          <button className="btn">Add the lead</button>
        </div>
      </div></div>
    </>
  )
}

/* ══════════ STAFF PROFILE ══════════ */
export function Person() {
  const { staffId } = useParams({ from: '/company/staff/$staffId' })
  const navigate = useNavigate()
  const { data: orders = [] } = useQuery({ queryKey: queryKeys.orders, queryFn: api.orders })
  const person = STAFF.find((s) => s.id === staffId)

  if (!person) {
    return (
      <>
        <PageHead title="That person is not here" sub="They may have been removed." />
        <div className="card"><div className="empty"><span className="ei">·</span>
          <p>Nothing to show.</p>
          <button className="btn sm" onClick={() => navigate({ to: '/company' })}>Back to company</button>
        </div></div>
      </>
    )
  }

  const theirs = orders.filter((o) => Object.values(o.assignments).includes(person.id))
  const load = Math.min(100, (person.open / person.capacity) * 100)

  return (
    <>
      <button className="btn g sm" style={{ marginBottom: 14 }}
        onClick={() => navigate({ to: '/company' })}>← Back to company</button>
      <PageHead title={person.name} sub={`${roleName(person.role)} · ${person.departments.join(', ') || 'no department'}`} />

      <div className="kpis">
        <Kpi title="In hand" icon="☰" value={person.open} detail="not finished" />
        <Kpi title="Daily target" icon="◎" value={person.capacity} detail="orders they can hold" />
        <Kpi title="Load" icon="▤" value={`${load.toFixed(0)}%`}
          tone={load >= 100 ? 'alert' : undefined}
          detailTone={load >= 100 ? 'bad' : 'ok'} detail="against their target" />
        <Kpi title="Availability" icon="✓"
          value={person.availability === 'ok' ? 'Available' : person.availability === 'leave' ? 'On leave' : 'Off shift'}
          detailTone={person.availability === 'ok' ? 'ok' : 'warn'}
          detail={person.availability === 'ok' ? 'eligible for assignment' : 'not eligible today'} />
      </div>

      <SectionHead>Orders they are on</SectionHead>
      {theirs.length === 0 ? (
        <div className="tbl"><div className="empty"><span className="ei">·</span>
          <p>Nothing assigned right now.</p></div></div>
      ) : (
        <div className="tbl"><div className="tsc"><div style={{ minWidth: 700 }}>
          <div className="trow h" style={{ gridTemplateColumns: '150px 130px 1fr 150px' }}>
            <span>Order</span><span>Their stage</span><span>Property</span><span>Status</span>
          </div>
          <div className="tb">
            {theirs.map((o) => {
              const stage = STAGES.find((s) => o.assignments[s] === person.id)
              return (
                <div className="trow clickable" key={o.id}
                  style={{ gridTemplateColumns: '150px 130px 1fr 150px' }}
                  role="button" tabIndex={0}
                  onClick={() => navigate({ to: '/orders/$orderId', params: { orderId: o.id } })}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate({ to: '/orders/$orderId', params: { orderId: o.id } }) } }}>
                  <div className="cell"><div className="v mono">{o.id}</div>
                    <div className="s">{o.client}</div></div>
                  <div className="cell"><div className="v">{stage}</div></div>
                  <div className="cell"><div className="v">{o.property}</div></div>
                  <div className="cell"><Chip tone={o.done ? 'v' : 'b'}>{statusLabel(o.status)}</Chip></div>
                </div>
              )
            })}
          </div>
        </div></div></div>
      )}

      <SectionHead>Account</SectionHead>
      <div className="card"><div className="cb">
        <dl className="kv">
          <dt>Email</dt><dd>{person.email}</dd>
          <dt>Role</dt><dd>{roleName(person.role)}</dd>
          <dt>Permissions</dt>
          <dd style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {(ROLES.find((r) => r.id === person.role)?.permissions ?? []).map((p) => (
              <Chip key={p} tone="n">{p}</Chip>
            ))}
          </dd>
          <dt>Active</dt><dd>{person.active ? 'Yes' : 'No'}</dd>
        </dl>
        <p className="gr" style={{ fontSize: '12.5px', marginTop: 14 }}>
          HR fields (identity documents, bank details, salary) are deliberately not
          modelled — see the README.
        </p>
      </div></div>
    </>
  )
}

/* ══════════ CLIENT DETAIL ══════════ */
export function ClientDetail() {
  const { clientName } = useParams({ from: '/company/clients/$clientName' })
  const navigate = useNavigate()
  const { data: clients = [] } = useQuery({ queryKey: queryKeys.clients, queryFn: api.clients })
  const { data: orders = [] } = useQuery({ queryKey: queryKeys.orders, queryFn: api.orders })
  const client = clients.find((c) => c.name === decodeURIComponent(clientName))

  if (!client) {
    return (
      <>
        <PageHead title="That client is not here" sub="They may have been removed." />
        <div className="card"><div className="empty"><span className="ei">·</span>
          <p>Nothing to show.</p>
          <button className="btn sm" onClick={() => navigate({ to: '/company' })}>Back to company</button>
        </div></div>
      </>
    )
  }

  const theirs = orders.filter((o) => o.client === client.name)
  const owed = client.total - client.paid

  return (
    <>
      <button className="btn g sm" style={{ marginBottom: 14 }}
        onClick={() => navigate({ to: '/company' })}>← Back to company</button>
      <PageHead title={client.name} sub={`${client.orders} orders · ${client.terms}`} />

      <div className="kpis">
        <Kpi title="Orders" icon="☰" value={client.orders} detail="all time" />
        <Kpi title="Invoiced" icon="$" value={money(client.total)} detail="all time" />
        <Kpi title="Outstanding" icon="▲" value={money(owed)}
          tone={owed > 0 ? 'warnk' : undefined}
          detailTone={owed > 0 ? 'warn' : 'ok'} detail={owed > 0 ? 'not yet collected' : 'settled'} />
        <Kpi title="Live orders" icon="◷" value={theirs.filter((o) => !o.done).length}
          detail="in the pipeline now" />
      </div>

      <SectionHead>Contact</SectionHead>
      <div className="card"><div className="cb">
        <dl className="kv">
          <dt>Code</dt><dd className="mono">{client.displayCode}</dd>
          <dt>Email</dt><dd>{client.email || <span className="gr">not given</span>}</dd>
          <dt>Phone</dt><dd className="mono">{client.phone || <span className="gr">not given</span>}</dd>
          <dt>Terms</dt><dd>{client.terms}</dd>
          <dt>Active</dt><dd>{client.active ? 'Yes' : 'No'}</dd>
        </dl>
      </div></div>

      <SectionHead>Their orders</SectionHead>
      {theirs.length === 0 ? (
        <div className="tbl"><div className="empty"><span className="ei">·</span>
          <p>No orders in the current period.</p></div></div>
      ) : (
        <div className="tbl"><div className="tsc"><div style={{ minWidth: 700 }}>
          <div className="trow h" style={{ gridTemplateColumns: '150px 110px 1fr 150px' }}>
            <span>Order</span><span>Product</span><span>Property</span><span>Status</span>
          </div>
          <div className="tb">
            {theirs.map((o) => (
              <div className="trow clickable" key={o.id}
                style={{ gridTemplateColumns: '150px 110px 1fr 150px' }}
                role="button" tabIndex={0}
                onClick={() => navigate({ to: '/orders/$orderId', params: { orderId: o.id } })}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate({ to: '/orders/$orderId', params: { orderId: o.id } }) } }}>
                <div className="cell"><div className="v mono">{o.id}</div></div>
                <div className="cell"><div className="v">{o.product}</div></div>
                <div className="cell"><div className="v">{o.property}</div></div>
                <div className="cell"><Chip tone={o.done ? 'v' : 'b'}>{statusLabel(o.status)}</Chip></div>
              </div>
            ))}
          </div>
        </div></div></div>
      )}
    </>
  )
}
