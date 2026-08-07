/**
 * Company — the original's eight tabs exactly:
 * Company · Staff · Clients · Departments · Roles · Workflow · Turnaround & SLA · Payroll
 * Plus the Staff profile (S.person) and Client detail (S.client) screens.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import {
  AVAIL, CLIENTS, DEPTLIST, ORDERS, PERMS, PRODUCTS, ROLELIST, STAFF, STAGES, STATUS,
  maskAadhaar, roleName, st, stColor,
} from '@/data/seed'
import { BUDGET, CLOCK, SLA, TIERS, isDefaultRule, r2, sharesFor } from '@/data/seed2'
import { fmtDate, inr, money } from '@/lib/format'
import { useSession } from '@/lib/session'
import { Assume, Banner, Chip, Empty, Kpi, PageHead, Sec } from '@/components/ui'

const COTABS = ['Company', 'Staff', 'Clients', 'Departments', 'Roles', 'Workflow', 'Turnaround & SLA', 'Payroll'] as const
type Tab = (typeof COTABS)[number]

export function Company() {
  const search = useSearch({ strict: false }) as { tab?: string }
  const [tab, setTab] = useState<Tab>(
    (COTABS as readonly string[]).includes(search.tab ?? '') ? (search.tab as Tab) : 'Company',
  )
  useEffect(() => {
    if (search.tab && (COTABS as readonly string[]).includes(search.tab)) setTab(search.tab as Tab)
  }, [search.tab])
  const { tenant } = useSession()

  return (
    <>
      <PageHead title="Company" sub={`How ${tenant.name} is set up.`} />
      <div className="tabs">
        {COTABS.map((t) => (
          <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Company' && <CompanyTab />}
      {tab === 'Staff' && <StaffTab />}
      {tab === 'Clients' && <ClientsTab />}
      {tab === 'Departments' && <DepartmentsTab />}
      {tab === 'Roles' && <RolesTab />}
      {tab === 'Workflow' && <WorkflowTab />}
      {tab === 'Turnaround & SLA' && <SlaTab />}
      {tab === 'Payroll' && <PayrollCfgTab />}
    </>
  )
}

/* ── Company ── */
function CompanyTab() {
  const { tenant, toast } = useSession()
  return (
    <>
      <div className="card"><div className="cb">
        <div className="frm">
          <div className="fld"><label htmlFor="co-name">Company name</label>
            <input className="inp" id="co-name" defaultValue={tenant.name} /></div>
          <div className="fld"><label htmlFor="co-state">Primary state</label>
            <input className="inp" id="co-state" defaultValue={tenant.state} /></div>
          <div className="fld">
            <label htmlFor="co-datefmt">Date format</label>
            <select className="inp" id="co-datefmt" defaultValue="MM/DD/YYYY"
              onChange={() => toast('One format, company-wide — honoured everywhere')}>
              <option>MM/DD/YYYY</option>
              <option>DD/MM/YYYY</option>
            </select>
            <div className="hint">
              Effective dates are legally material, so this is a single setting rather
              than a per-screen choice — and it is honoured everywhere.
            </div>
          </div>
          <div className="fld"><label htmlFor="co-plan">Plan</label>
            <div className="ro" id="co-plan">{tenant.plan}</div></div>
        </div>
      </div></div>
      <Sec>Danger zone</Sec>
      <div className="card"><div className="cb">
        <Banner tone="d" icon="⚑" title={`Every user in ${tenant.name} loses access immediately`}>
          {ORDERS.filter((o) => !o.done).length} open orders, {CLIENTS.length} clients and{' '}
          {STAFF.length} people. Export first. Once this is done there is nothing to come back to.
        </Banner>
        <div style={{ display: 'flex', gap: 9 }}>
          <button className="btn g" onClick={() => toast('Five files — orders, clients, staff, invoices, county coverage')}>
            Export everything
          </button>
          <button className="btn d" onClick={() => toast('In a real system this would be irreversible — nothing was deleted here')}>
            Close the workspace
          </button>
        </div>
      </div></div>
    </>
  )
}

/* ── Staff ── */
function StaffTab() {
  const navigate = useNavigate()
  const { toast } = useSession()
  const GRID = '190px 170px 130px 80px 120px 1fr'
  return (
    <>
      <div className="hd" style={{ marginBottom: 12 }}>
        <p className="sub">{STAFF.length} people. Click a row to open the profile.</p>
        <div className="r">
          <button className="btn g" onClick={() => toast('Bulk import reads a CSV — name, email, departments, role, target')}>Bulk import</button>
          <button className="btn" onClick={() => toast('Adding a person needs their departments and target')}>＋ Add person</button>
        </div>
      </div>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 860 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Name</span><span>Departments</span><span>Role</span>
          <span>Target</span><span>Availability</span><span>Email</span>
        </div>
        <div className="tb">
          {STAFF.map((s) => (
            <div
              key={s.id}
              className="trow"
              style={{ gridTemplateColumns: GRID }}
              role="button" tabIndex={0}
              onClick={() => navigate({ to: '/company/staff/$staffId', params: { staffId: s.id } })}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate({ to: '/company/staff/$staffId', params: { staffId: s.id } }) }}
            >
              <div className="cell">
                <div className="v">{s.n}</div>
                {s.leaving && <div className="s bad">leaving {fmtDate(s.leaving)}</div>}
                {s.conflict && <div className="s warn">in a stage and its QC — self-review filtered</div>}
              </div>
              <div className="cell"><div className="v gr" style={{ fontSize: '12.5px' }}>
                {s.dep.join(', ') || <span className="gr">none</span>}</div></div>
              <div className="cell"><div className="v">{roleName(s.r)}</div></div>
              <div className="cell"><div className="v mono">{s.cap || '—'}</div></div>
              <div className="cell"><Chip tone={AVAIL[s.avail]![1]}>{AVAIL[s.avail]![0]}</Chip></div>
              <div className="cell"><div className="s">{s.e}</div></div>
            </div>
          ))}
        </div>
      </div></div></div>
    </>
  )
}

/* ── Clients ── */
function ClientsTab() {
  const navigate = useNavigate()
  const { toast } = useSession()
  const GRID = '160px 80px 90px 120px 130px 100px'
  return (
    <>
      <div className="hd" style={{ marginBottom: 12 }}>
        <p className="sub">{CLIENTS.length} clients. Click a row for their orders and balance.</p>
        <div className="r">
          <button className="btn g" onClick={() => toast('clients export — every row on this screen')}>Export</button>
          <button className="btn" onClick={() => toast('A client needs a name and payment terms')}>＋ Add client</button>
        </div>
      </div>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 820 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Client</span><span>Code</span><span>Orders</span>
          <span>Invoiced</span><span>Outstanding</span><span>Terms</span>
        </div>
        <div className="tb">
          {CLIENTS.map((c) => (
            <div
              key={c.n}
              className="trow"
              style={{ gridTemplateColumns: GRID }}
              role="button" tabIndex={0}
              onClick={() => navigate({ to: '/company/clients/$clientName', params: { clientName: c.n } })}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate({ to: '/company/clients/$clientName', params: { clientName: c.n } }) }}
            >
              <div className="cell"><div className="v"><b>{c.n}</b></div>
                <div className="s">{c.e || 'no email'}</div></div>
              <div className="cell"><div className="v mono">{c.dn}</div></div>
              <div className="cell"><div className="v mono">{c.orders}</div></div>
              <div className="cell"><div className="v mono">{money(c.total)}</div></div>
              <div className="cell">
                <div className={`v mono ${c.total - c.paid > 0 ? 'warn' : 'ok'}`}>{money(r2(c.total - c.paid))}</div>
              </div>
              <div className="cell"><div className="v">{c.terms}</div></div>
            </div>
          ))}
        </div>
      </div></div></div>
    </>
  )
}

/* ── Departments ── */
function DepartmentsTab() {
  return (
    <>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {DEPTLIST.map((d, i) => {
            const members = STAFF.filter((s) => s.dep.includes(d.n))
            return (
              <div className="rw" key={d.id}>
                <span className="mono gr">{i + 1}</span>
                <span>
                  <b>{d.n}</b>
                  <div className="sd">{d.desc} · {members.length} member{members.length === 1 ? '' : 's'}</div>
                </span>
                <span style={{ display: 'flex', gap: 6 }}>
                  {d.auto ? <Chip tone="b">Auto-assigned</Chip> : <Chip tone="n">On demand</Chip>}
                  {d.pair && <Chip tone="v">QCs {d.pair}</Chip>}
                </span>
              </div>
            )
          })}
        </div>
      </div></div>
      <Banner tone="b" icon="◔" title="Departments are data, not a hard-coded list">
        <b>auto</b> means part of the automatic assignment pass; <b>pair</b> marks the QC
        of a stage — which is what the self-review rule keys off.
      </Banner>
    </>
  )
}

/* ── Roles ── */
function RolesTab() {
  return (
    <>
      <p className="sub" style={{ marginBottom: 12 }}>
        What each role can do, and who holds it. {ROLELIST.length} roles.
      </p>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {ROLELIST.map((r) => {
            const holders = STAFF.filter((s) => s.r === r.id)
            return (
              <div className="rw" key={r.id}>
                <span className={r.lock ? 'gr' : 'ok'}>{r.lock ? '⚿' : '·'}</span>
                <span>
                  <b>{r.n}</b>
                  <div className="sd">{r.desc} · {holders.length} {holders.length === 1 ? 'person' : 'people'}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 7 }}>
                    {r.p.map((p) => <Chip key={p} tone="n">{PERMS.find((x) => x.k === p)?.n ?? p}</Chip>)}
                  </div>
                </span>
                <span className="gr" style={{ fontSize: '11.5px' }}>{r.lock ? 'cannot be deleted' : ''}</span>
              </div>
            )
          })}
        </div>
      </div></div>
      <Banner tone="r" icon="⊘" title="Override a blocking rule is granted to nobody">
        Not even Company admin holds it. A permission nobody has is a deliberate
        statement that blocking rules block. The admin role must always keep managing
        people and configuration, or the workspace locks itself out.
      </Banner>
    </>
  )
}

/* ── Workflow ── */
function WorkflowTab() {
  return (
    <>
      <p className="sub" style={{ marginBottom: 12 }}>
        The {Object.keys(STATUS).length} statuses an order can carry, in pipeline order.
      </p>
      <div className="card"><div className="cb">
        <div className="pipe">
          {Object.keys(STATUS).map((k) => (
            <span className="pchip" key={k}>
              <span className="dt" style={{ background: stColor(k) }} />{st(k)}
            </span>
          ))}
        </div>
      </div></div>
      <Sec>The clock and each status</Sec>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {Object.entries(CLOCK.pause).map(([status, paused]) => (
            <div className="rw" key={status}>
              <span className={paused ? 'warn' : 'ok'}>{paused ? '◷' : '▶'}</span>
              <span><b>{status}</b>
                <div className="sd">{paused ? 'The clock pauses — waiting on someone else' : 'The clock runs'}</div></span>
              <span />
            </div>
          ))}
        </div>
      </div></div>
    </>
  )
}

/* ── Turnaround & SLA ── */
function SlaTab() {
  const usable = (h: number) => h * (1 - BUDGET.buffer / 100)
  return (
    <>
      <Assume title="These hours are placeholders">
        {' '}I don’t have your real commitments, so every row below is a guess.{' '}
        <b>Replace them with what you’ve actually promised each client</b> — the whole
        due-date system is only as honest as this table.
      </Assume>

      <Sec>Turnaround by client and product — most specific rule wins</Sec>
      <div className="tbl"><div className="tsc">
        <table className="mat" style={{ minWidth: 560 }}>
          <thead><tr><th>Client</th><th>Product</th><th>Hours</th></tr></thead>
          <tbody>
            {SLA.map((row, i) => (
              <tr key={i}>
                <td>{isDefaultRule(row) ? <span className="gr">{row.cl}</span> : <b>{row.cl}</b>}</td>
                <td>{row.pr}</td>
                <td className="n">{row.h}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>

      <Sec>Priority tiers</Sec>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {TIERS.map((t) => (
            <div className="rw" key={t.id}>
              <span className="gr">·</span>
              <span><b>{t.n}</b>
                <div className="sd">
                  {t.mult === 1 ? 'The promise as quoted' : `${t.mult * 100}% of the standard clock`}
                  {t.up ? ` · +$${t.up} on the fee` : ''}
                </div></span>
              <span className="mono">×{t.mult}</span>
            </div>
          ))}
        </div>
      </div></div>

      <Sec>Stage budgets — shares of the clock, buffer held back</Sec>
      <Assume title="The 50/11/25/10/4 split is my guess, not your data">
        {' '}I picked these shares from how the work reads, not from timings.{' '}
        <b>Take a week of finished orders and measure how long each department actually
        held them</b> — the median is your split. Until then every checkpoint below is
        directionally right and numerically invented.
      </Assume>
      <Banner tone="b" icon="◷" title="A client promise of 24 hours is not a Search department promise of 24 hours">
        A 24h promise with the {BUDGET.buffer}% buffer gives {usable(24).toFixed(1)}h of
        usable stage time; 40Y and FS+ carry their own splits.
      </Banner>
      <div className="card"><div className="cb">
        {(['base', '40Y', 'FS+'] as const).map((key) => {
          const shares = key === 'base' ? BUDGET.base : sharesFor(key)
          return (
            <div key={key} style={{ marginBottom: 18 }}>
              <div className="lb">{key === 'base' ? 'Every product' : `${key} override`}</div>
              <div className="split" style={{ marginBottom: 6 }}>
                {Object.entries(shares).map(([stage, pct], i) => (
                  <span key={stage} title={`${stage} ${pct}%`}
                    style={{ width: `${pct}%`, background: ['#3B82F6', '#8B5CF6', '#A855F7', '#C026D3', '#06B6D4'][i] }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '11.5px', color: 'var(--gr)' }}>
                {Object.entries(shares).map(([stage, pct]) => (
                  <span key={stage}><b className="mono">{pct}%</b> {stage}</span>
                ))}
                <span><b className="mono">{BUDGET.buffer}%</b> buffer</span>
              </div>
            </div>
          )
        })}
      </div></div>

      <Sec>How the clock runs</Sec>
      <div className="card"><div className="cb">
        <dl className="kv">
          <dt>Starts</dt><dd>When the order email arrives</dd>
          <dt>Runs</dt><dd>24×7, including weekends</dd>
          <dt>Zone</dt><dd>{CLOCK.tz} — the client’s zone; deadlines are stated in it</dd>
          <dt>Pauses in</dt>
          <dd>{Object.entries(CLOCK.pause).filter(([, v]) => v).map(([k]) => k).join(', ')}</dd>
        </dl>
      </div></div>
    </>
  )
}

/* ── Payroll config ── */
function PayrollCfgTab() {
  return (
    <>
      <Assume title="Tax slabs are the new regime, FY 2025-26">
        {' '}The arithmetic is right and the rates are current, but real TDS depends on
        declarations, other income and prior employment.{' '}
        <b>Have your provider confirm before anyone is paid on these figures.</b>
      </Assume>
      <div className="card"><div className="cb">
        <dl className="kv">
          <dt>Pay cycle</dt><dd>Monthly, last working day</dd>
          <dt>Basic</dt><dd>50% of monthly CTC</dd>
          <dt>HRA</dt><dd>40% of basic</dd>
          <dt>PF</dt><dd>12% of basic, wage ceiling ₹15,000</dd>
          <dt>ESI</dt><dd>0.75% of gross when gross ≤ ₹21,000</dd>
          <dt>Professional tax</dt><dd>Karnataka slabs — ₹200 above ₹25,000</dd>
          <dt>Standard deduction</dt><dd>₹75,000, new regime</dd>
        </dl>
        <p className="gr" style={{ fontSize: '12.5px', marginTop: 14 }}>
          The run itself lives under HRMS → Payroll. Statutory exports (ECR, ESI, PT,
          24Q, bank file) download from the run.
        </p>
      </div></div>
    </>
  )
}

/* ══════════ STAFF PROFILE — the original S.person, HR fields redacted ══════════ */
export function Person() {
  const { staffId } = useParams({ from: '/company/staff/$staffId' })
  const navigate = useNavigate()
  const { toast } = useSession()
  const [showAadhaar, setShowAadhaar] = useState(false)
  const s = STAFF.find((x) => x.id === staffId)

  if (!s) {
    return (
      <>
        <PageHead title="That person is not here" sub="They may have been removed, or the link may be out of date." />
        <div className="card">
          <Empty icon="·" action={<button className="btn sm" onClick={() => navigate({ to: '/company' })}>Back to staff</button>}>
            Nothing to show.
          </Empty>
        </div>
      </>
    )
  }

  const theirs = ORDERS.filter((o) => Object.values(o.a).includes(s.id))
  const load = s.cap ? Math.min(100, (s.open / s.cap) * 100) : 0

  return (
    <>
      <button className="btn g sm" style={{ marginBottom: 14 }}
        onClick={() => navigate({ to: '/company', search: { tab: 'Staff' } })}>← Back to staff</button>
      <PageHead
        title={s.n}
        sub={`${roleName(s.r)} · ${s.dep.join(', ') || 'no department'}`}
        actions={<>
          <Chip tone={AVAIL[s.avail]![1]}>{AVAIL[s.avail]![0]}</Chip>
          {s.leaving && <Chip tone="d">Leaving {fmtDate(s.leaving)}</Chip>}
        </>}
      />

      <div className="kpis">
        <Kpi t="In hand" icon="☰" v={s.open} d="not finished" />
        <Kpi t="Daily target" icon="◎" v={s.cap || '—'} d="orders they can hold" />
        <Kpi t="Load" icon="▤" v={`${load.toFixed(0)}%`}
          cls={load >= 100 ? 'alert' : undefined} dTone={load >= 100 ? 'bad' : 'ok'} d="against their target" />
        <Kpi t="Annual CTC" icon="₹" v={inr(s.ctc)} d="cost to company" />
      </div>

      <div className="two">
        <div>
          <Sec>Orders they are on</Sec>
          {theirs.length === 0 ? (
            <div className="tbl"><div className="empty"><span className="ei">·</span>
              <p>Nothing assigned right now.</p></div></div>
          ) : (
            <div className="tbl"><div className="tsc"><div style={{ minWidth: 640 }}>
              <div className="trow h" style={{ gridTemplateColumns: '140px 130px 1fr 130px' }}>
                <span>Order</span><span>Their stage</span><span>Property</span><span>Status</span>
              </div>
              <div className="tb">
                {theirs.map((o) => {
                  const stage = STAGES.find((x) => o.a[x] === s.id)
                  return (
                    <div
                      key={o.id}
                      className="trow"
                      style={{ gridTemplateColumns: '140px 130px 1fr 130px' }}
                      role="button" tabIndex={0}
                      onClick={() => navigate({ to: '/orders/$orderId', params: { orderId: o.id } })}
                      onKeyDown={(e) => { if (e.key === 'Enter') navigate({ to: '/orders/$orderId', params: { orderId: o.id } }) }}
                    >
                      <div className="cell"><div className="v mono">{o.id}</div><div className="s">{o.cl}</div></div>
                      <div className="cell"><div className="v">{stage}</div></div>
                      <div className="cell"><div className="v">{o.prop}</div></div>
                      <div className="cell"><Chip tone={o.done ? 'v' : 'b'}>{st(o.stt)}</Chip></div>
                    </div>
                  )
                })}
              </div>
            </div></div></div>
          )}
        </div>

        <div>
          <div className="card">
            <div className="ch"><h2>Contact & HR record</h2></div>
            <div className="cb">
              <dl className="kv">
                <dt>Email</dt><dd>{s.e}</dd>
                <dt>Mobile</dt><dd className="mono">{s.mob}</dd>
                <dt>Address</dt><dd>{s.addr}</dd>
                <dt>Emergency</dt><dd>{s.emg.n} ({s.emg.rel}) · <span className="mono">{s.emg.mob}</span></dd>
                <dt>Joined</dt><dd className="mono">{s.doj}</dd>
                <dt>Born</dt><dd className="mono">{s.dob}</dd>
                <dt>Shift</dt><dd>{s.shift}</dd>
                <dt>PAN</dt><dd className="mono">{s.pan}</dd>
                <dt>UAN</dt><dd className="mono">{s.uan}</dd>
                <dt>ESIC</dt><dd className="mono">{s.esicNo}</dd>
                <dt>Bank</dt><dd className="mono">{s.bank.acct} · {s.bank.ifsc}</dd>
                <dt>Aadhaar</dt>
                <dd>
                  <span className="mono">{showAadhaar ? s.aadhaar : maskAadhaar(s.aadhaar)}</span>{' '}
                  {!showAadhaar && (
                    <button className="btn g sm" onClick={() => { setShowAadhaar(true); toast('Reveal is a deliberate act — it would be logged') }}>
                      Reveal
                    </button>
                  )}
                </dd>
              </dl>
              <p className="gr" style={{ fontSize: '11.5px', marginTop: 12 }}>
                An Aadhaar number shown in full to anyone with the page open is a
                liability. The last four identify the record; the rest is a deliberate
                act. Values here are redacted placeholders in this public copy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ══════════ CLIENT DETAIL — the original S.client ══════════ */
export function ClientDetail() {
  const { clientName } = useParams({ from: '/company/clients/$clientName' })
  const navigate = useNavigate()
  const c = CLIENTS.find((x) => x.n === decodeURIComponent(clientName))

  if (!c) {
    return (
      <>
        <PageHead title="That client is not here" sub="They may have been removed, or the link may be out of date." />
        <div className="card">
          <Empty icon="·" action={<button className="btn sm" onClick={() => navigate({ to: '/company', search: { tab: 'Clients' } })}>Back to clients</button>}>
            Nothing to show.
          </Empty>
        </div>
      </>
    )
  }

  const theirs = ORDERS.filter((o) => o.cl === c.n)
  const owed = r2(c.total - c.paid)

  return (
    <>
      <button className="btn g sm" style={{ marginBottom: 14 }}
        onClick={() => navigate({ to: '/company', search: { tab: 'Clients' } })}>← Back to clients</button>
      <PageHead title={c.n} sub={`${c.orders} orders · ${c.terms}`} />
      <div className="kpis">
        <Kpi t="Orders" icon="☰" v={c.orders} d="all time" />
        <Kpi t="Invoiced" icon="$" v={money(c.total)} d="all time" />
        <Kpi t="Outstanding" icon="▲" v={money(owed)}
          cls={owed > 0 ? 'warnk' : undefined} dTone={owed > 0 ? 'warn' : 'ok'}
          d={owed > 0 ? 'not yet collected' : 'settled'} />
        <Kpi t="Live orders" icon="◷" v={theirs.filter((o) => !o.done).length} d="in the pipeline now" />
      </div>

      <Sec>Contact</Sec>
      <div className="card"><div className="cb">
        <dl className="kv">
          <dt>Code</dt><dd className="mono">{c.dn}</dd>
          <dt>Email</dt><dd>{c.e || <span className="gr">not given</span>}</dd>
          <dt>Phone</dt><dd className="mono">{c.p || <span className="gr">not given</span>}</dd>
          <dt>Terms</dt><dd>{c.terms}</dd>
        </dl>
      </div></div>

      <Sec>Their orders in the current period</Sec>
      {theirs.length === 0 ? (
        <div className="tbl"><div className="empty"><span className="ei">·</span>
          <p>No orders in the current period.</p></div></div>
      ) : (
        <div className="tbl"><div className="tsc"><div style={{ minWidth: 700 }}>
          <div className="trow h" style={{ gridTemplateColumns: '140px 110px 1fr 130px' }}>
            <span>Order</span><span>Product</span><span>Property</span><span>Status</span>
          </div>
          <div className="tb">
            {theirs.map((o) => (
              <div
                key={o.id}
                className="trow"
                style={{ gridTemplateColumns: '140px 110px 1fr 130px' }}
                role="button" tabIndex={0}
                onClick={() => navigate({ to: '/orders/$orderId', params: { orderId: o.id } })}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate({ to: '/orders/$orderId', params: { orderId: o.id } }) }}
              >
                <div className="cell"><div className="v mono">{o.id}</div></div>
                <div className="cell"><div className="v">{PRODUCTS.find((p) => p.id === o.pr)?.n ?? o.pr}</div></div>
                <div className="cell"><div className="v">{o.prop}</div></div>
                <div className="cell"><Chip tone={o.done ? 'v' : 'b'}>{st(o.stt)}</Chip></div>
              </div>
            ))}
          </div>
        </div></div></div>
      )}
    </>
  )
}
