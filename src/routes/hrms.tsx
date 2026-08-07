import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { STAFF, who } from '@/data/seed'
import {
  ATTENDANCE, CANDIDATES, HIRESTAGES, LEAVE, LEAVEPOLICY, LEAVETYPES, LVSTATUS,
  OPENINGS, PAYMONTHS, PAYRUNS, PETTY, PETTYCFG, RUNSTATE, RUNSTEPS, SITES,
  TIMECFG, WORKING_DAYS, payslipFor, pettyBalance,
} from '@/data/seed3'
import { fmtDate, inr } from '@/lib/format'
import { useSession } from '@/lib/session'
import { Assume, Banner, Chip, Empty, Kpi, PageHead, Sec, type Tone } from '@/components/ui'

/* ══════════ ATTENDANCE ══════════ */
export function Attendance() {
  const { toast } = useSession()
  const totals = ATTENDANCE.reduce(
    (a, r) => ({ p: a.p + r.present, l: a.l + r.lateMarks, u: a.u + r.unpaid, ot: a.ot + r.otHours }),
    { p: 0, l: 0, u: 0, ot: 0 })
  const GRID = '190px 90px 80px 80px 90px 90px 1fr'

  return (
    <>
      <PageHead title="Attendance" sub={`${WORKING_DAYS} working days this month.`}
        actions={<>
          <button className="btn g" onClick={() => toast(`attendance export — ${ATTENDANCE.length} rows`)}>Export</button>
          <button className="btn" onClick={() => toast('Check-in records the device location and its accuracy, and flags anything outside the site radius')}>Check in</button>
        </>} />

      <div className="kpis">
        <Kpi t="Days present" icon="✓" v={totals.p} dTone="ok" d="across the team" />
        <Kpi t="Late marks" icon="◷" v={totals.l} cls={totals.l ? 'warnk' : undefined}
          dTone="warn" d={`${TIMECFG.lateGraceMins} min grace applies`} />
        <Kpi t="Unpaid days" icon="▲" v={totals.u} cls={totals.u ? 'alert' : undefined}
          dTone={totals.u ? 'bad' : 'ok'} d="loss of pay" />
        <Kpi t="Overtime" icon="＋" v={`${totals.ot}h`} d="beyond the standard day" />
      </div>

      <Sec>This month, by person</Sec>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 820 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Person</span><span>Present</span><span>WFH</span><span>Leave</span>
          <span>Unpaid</span><span>Late</span><span>Attendance</span>
        </div>
        <div className="tb">
          {ATTENDANCE.map((r) => {
            const pct = (r.present / WORKING_DAYS) * 100
            return (
              <div className="trow" key={r.staffId} style={{ gridTemplateColumns: GRID, cursor: 'default' }}>
                <div className="cell"><div className="v">{who(r.staffId)}</div></div>
                <div className="cell"><div className="v mono">{r.present}</div></div>
                <div className="cell"><div className="v mono">{r.wfh || <span className="gr">·</span>}</div></div>
                <div className="cell"><div className="v mono">{r.leave || <span className="gr">·</span>}</div></div>
                <div className="cell"><div className={`v mono ${r.unpaid ? 'bad' : ''}`}>{r.unpaid || <span className="gr">·</span>}</div></div>
                <div className="cell"><div className={`v mono ${r.lateMarks > 2 ? 'warn' : ''}`}>{r.lateMarks || <span className="gr">·</span>}</div></div>
                <div className="cell">
                  <div className="bar" style={{ maxWidth: 180 }}>
                    <i style={{ width: `${pct}%`, background: pct >= 90 ? 'var(--ok)' : 'var(--warn)' }} />
                  </div>
                  <div className="s">{pct.toFixed(0)}% of {WORKING_DAYS} days</div>
                </div>
              </div>
            )
          })}
        </div>
      </div></div></div>

      <Sec>How it works</Sec>
      <div className="card"><div className="cb">
        <dl className="kv">
          <dt>Late grace</dt><dd>{TIMECFG.lateGraceMins} minutes — a punch inside it is not recorded as late at all</dd>
          <dt>Rest break</dt><dd>{TIMECFG.restMins} min after {TIMECFG.restAfterMins / 60}h</dd>
          <dt>Overtime after</dt><dd>{TIMECFG.otAfterMins / 60}h in a day</dd>
          <dt>Permissions</dt><dd>{TIMECFG.permPerMonth} per month</dd>
          <dt>Sites</dt><dd>{SITES.map((s) => s.name).join(' · ')}</dd>
        </dl>
      </div></div>
      <Assume title="Waiving is a record, not an erasure">
        {' '}A waived mark stays in the log and in the export — it simply stops counting
        towards the pattern. <b>Attendance figures people cannot see the workings of are
        the ones they stop trusting</b>, so nothing here is deleted, only annotated.
      </Assume>
    </>
  )
}

/* ══════════ LEAVE ══════════ */
export function Leave() {
  const { toast } = useSession()
  const pending = LEAVE.filter((l) => l.status === 'pending')
  const GRID = '170px 130px 200px 80px 150px 1fr'

  return (
    <>
      <PageHead title="Leave" sub="Requests, balances and who is covering."
        actions={<button className="btn" onClick={() => toast(`Policy: ${LEAVEPOLICY.noticeDays} days notice, at least ${LEAVEPOLICY.deptCoverMin} person must remain available`)}>Apply for leave</button>} />

      {pending.length > 0 && (
        <Banner tone="r" icon="◷" title={`${pending.length} awaiting approval`}>
          {pending.map((l) => who(l.staffId)).join(', ')}.
        </Banner>
      )}

      <div className="kpis">
        <Kpi t="Awaiting approval" icon="◷" v={pending.length}
          cls={pending.length ? 'warnk' : undefined} dTone="warn" d="need a decision" />
        <Kpi t="Approved" icon="✓" v={LEAVE.filter((l) => l.status === 'approved').length} dTone="ok" d="upcoming or taken" />
        <Kpi t="On leave today" icon="◎" v={STAFF.filter((s) => s.avail === 'leave').length} d="not eligible for assignment" />
        <Kpi t="Notice required" icon="▤" v={`${LEAVEPOLICY.noticeDays}d`} d="policy minimum" />
      </div>

      <Sec>Requests</Sec>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 880 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Person</span><span>Type</span><span>Dates</span><span>Days</span><span>Status</span><span>Reason</span>
        </div>
        <div className="tb">
          {LEAVE.map((l) => {
            const type = LEAVETYPES.find((t) => t.key === l.type)
            const [label, tone] = LVSTATUS[l.status]!
            return (
              <div className="trow" key={l.id} style={{ gridTemplateColumns: GRID, cursor: 'default' }}>
                <div className="cell"><div className="v">{who(l.staffId)}</div></div>
                <div className="cell"><div className="v">{type?.name}</div>
                  {!type?.paid && <div className="s bad">unpaid</div>}</div>
                <div className="cell"><div className="v mono" style={{ fontSize: '12.5px' }}>
                  {fmtDate(l.from)} – {fmtDate(l.to)}</div></div>
                <div className="cell"><div className="v mono">{l.days}</div></div>
                <div className="cell"><Chip tone={tone as Tone}>{label}</Chip></div>
                <div className="cell"><div className="s">{l.reason}</div></div>
              </div>
            )
          })}
        </div>
      </div></div></div>

      <Sec>Leave types and policy</Sec>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {LEAVETYPES.map((t) => (
            <div className="rw" key={t.key}>
              <span className={t.paid ? 'ok' : 'gr'}>{t.paid ? '✓' : '·'}</span>
              <span><b>{t.name}</b><div className="sd">{t.paid ? 'Paid' : 'Unpaid'}</div></span>
              <span className="mono">{t.annual ? `${t.annual}/year` : '—'}</span>
            </div>
          ))}
        </div>
        <dl className="kv" style={{ marginTop: 16 }}>
          <dt>Carry forward</dt><dd>Up to {LEAVEPOLICY.carryForwardMax} days</dd>
          <dt>Notice</dt><dd>{LEAVEPOLICY.noticeDays} days minimum</dd>
          <dt>Max consecutive</dt><dd>{LEAVEPOLICY.maxConsecutive} days</dd>
          <dt>Department cover</dt><dd>At least {LEAVEPOLICY.deptCoverMin} person must remain available</dd>
        </dl>
      </div></div>
    </>
  )
}

/* ══════════ PAYROLL ══════════ */
export function Payroll() {
  const { toast } = useSession()
  const [month, setMonth] = useState(PAYMONTHS[PAYMONTHS.length - 1]!)
  const run = PAYRUNS.find((r) => r.month === month)!
  const [label, , note] = RUNSTATE[run.state]!
  const stepIndex = run.state === 'draft' ? 3 : run.state === 'locked' ? 4 : run.state === 'approved' ? 5 : 6
  const GRID = '190px 110px 110px 110px 110px 1fr'

  return (
    <>
      <PageHead title="Payroll" sub="The monthly run, step by step."
        actions={<>
          <select className="inp" value={month} onChange={(e) => setMonth(e.target.value)}
            aria-label="Payroll month" style={{ width: 'auto' }}>
            {PAYMONTHS.map((m) => <option key={m}>{m}</option>)}
          </select>
          <button className="btn g" onClick={() => toast(`salary register — ${run.headcount} rows`)}>Export register</button>
          <button className="btn" disabled={run.state !== 'draft'}
            onClick={() => toast('Locked — attendance is frozen, figures will not move')}>Lock the run</button>
        </>} />

      <Assume title="Tax slabs are the new regime, FY 2025-26">
        {' '}The arithmetic is right and the rates are current, but real TDS depends on
        declarations, other income and prior employment.{' '}
        <b>Have your provider confirm before anyone is paid on these figures.</b>
      </Assume>

      <div className="kpis">
        <Kpi t="Status" icon="▤" v={label} d={note} />
        <Kpi t="Headcount" icon="◎" v={run.headcount} d="on this run" />
        <Kpi t="Gross" icon="₹" v={inr(run.gross)} d="before deductions" />
        <Kpi t="Net payable" icon="✓" v={inr(run.net)} dTone="ok" d={`${inr(run.ded)} deducted`} />
      </div>

      <Sec>Where this run has got to</Sec>
      <div className="card"><div className="cb">
        {RUNSTEPS.map(([name, desc], i) => (
          <div className="stepn" key={name}>
            <span className={`sn ${i < stepIndex - 1 ? 'done' : i === stepIndex - 1 ? 'now' : ''}`}>
              {i < stepIndex - 1 ? '✓' : i + 1}
            </span>
            <span><b>{name}</b><div className="gr" style={{ fontSize: '11.5px' }}>{desc}</div></span>
          </div>
        ))}
      </div></div>

      <Sec>The register</Sec>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 900 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Person</span><span>Basic</span><span>HRA</span><span>Gross</span><span>Deductions</span><span>Net</span>
        </div>
        <div className="tb">
          {STAFF.filter((s) => s.dep.length).map((s) => {
            const p = payslipFor(s.id)!
            return (
              <div className="trow" key={s.id} style={{ gridTemplateColumns: GRID, cursor: 'default' }}>
                <div className="cell"><div className="v">{s.n}</div><div className="s">{s.dep.join(', ')}</div></div>
                <div className="cell"><div className="v mono">{inr(p.basic)}</div></div>
                <div className="cell"><div className="v mono">{inr(p.hra)}</div></div>
                <div className="cell"><div className="v mono">{inr(p.gross)}</div></div>
                <div className="cell"><div className="v mono warn">{inr(p.ded)}</div></div>
                <div className="cell"><div className="v mono ok"><b>{inr(p.net)}</b></div></div>
              </div>
            )
          })}
        </div>
      </div></div></div>

      <Sec>Statutory exports</Sec>
      <div className="card"><div className="cb">
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          {['Salary register', 'EPFO ECR', 'ESI return', 'Professional tax', 'Form 24Q', 'Bank file'].map((x) => (
            <button className="btn g sm" key={x}
              onClick={() => toast(`${x} — right figures in the right shape, not a portal-validated file`)}>{x}</button>
          ))}
        </div>
        <Assume title="These are the right figures in the right shape, not portal-ready files">
          {' '}Each downloads with the columns the corresponding portal asks for, from the
          same run the register came from. <b>The exact file layouts change, and each
          portal has its own validator</b> — have whoever files your returns run one
          through before you rely on it.
        </Assume>
      </div></div>
    </>
  )
}

/* ══════════ PAYSLIPS ══════════ */
export function Payslips() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(PAYMONTHS[PAYMONTHS.length - 1]!)
  const GRID = '190px 130px 130px 130px 1fr'
  return (
    <>
      <PageHead title="Payslips" sub={`Published payslips for ${month}.`}
        actions={
          <select className="inp" value={month} onChange={(e) => setMonth(e.target.value)}
            aria-label="Month" style={{ width: 'auto' }}>
            {PAYMONTHS.map((m) => <option key={m}>{m}</option>)}
          </select>
        } />
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 760 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Person</span><span>Gross</span><span>Deductions</span><span>Net</span><span></span>
        </div>
        <div className="tb">
          {STAFF.filter((s) => s.dep.length).map((s) => {
            const p = payslipFor(s.id)!
            return (
              <div
                key={s.id}
                className="trow"
                style={{ gridTemplateColumns: GRID }}
                role="button" tabIndex={0}
                onClick={() => navigate({ to: '/payslips/$staffId', params: { staffId: s.id } })}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate({ to: '/payslips/$staffId', params: { staffId: s.id } }) }}
              >
                <div className="cell"><div className="v">{s.n}</div></div>
                <div className="cell"><div className="v mono">{inr(p.gross)}</div></div>
                <div className="cell"><div className="v mono warn">{inr(p.ded)}</div></div>
                <div className="cell"><div className="v mono ok">{inr(p.net)}</div></div>
                <div className="cell"><div className="s gr">View →</div></div>
              </div>
            )
          })}
        </div>
      </div></div></div>
    </>
  )
}

/* ══════════ PAYSLIP DETAIL ══════════ */
export function PayslipDetail() {
  const { staffId } = useParams({ from: '/payslips/$staffId' })
  const navigate = useNavigate()
  const { toast } = useSession()
  const p = payslipFor(staffId)

  if (!p) {
    return (
      <>
        <PageHead title="That payslip is not here" sub="The person may have been removed, or the link may be out of date." />
        <div className="card">
          <Empty icon="·" action={<button className="btn sm" onClick={() => navigate({ to: '/payslips' })}>Back to payslips</button>}>
            Nothing to show.
          </Empty>
        </div>
      </>
    )
  }

  return (
    <>
      <button className="btn g sm" style={{ marginBottom: 14 }} onClick={() => navigate({ to: '/payslips' })}>
        ← Back to payslips
      </button>
      <PageHead title={p.staff.n} sub={`Payslip · ${PAYMONTHS[PAYMONTHS.length - 1]}`}
        actions={<button className="btn g" onClick={() => toast('payslip download — the same figures as this screen')}>Download</button>} />
      <div className="two">
        <div className="card">
          <div className="ch"><h2>Earnings</h2></div>
          <div className="cb">
            <dl className="kv">
              <dt>Basic</dt><dd className="mono">{inr(p.basic)}</dd>
              <dt>HRA</dt><dd className="mono">{inr(p.hra)}</dd>
              <dt>Special allowance</dt><dd className="mono">{inr(p.special)}</dd>
              <dt><b>Gross</b></dt><dd className="mono"><b>{inr(p.gross)}</b></dd>
            </dl>
            <Sec>Deductions</Sec>
            <dl className="kv">
              <dt>Provident fund</dt><dd className="mono">{inr(p.pf)}</dd>
              <dt>ESI</dt><dd className="mono">{p.esi ? inr(p.esi) : <span className="gr">not applicable</span>}</dd>
              <dt>Professional tax</dt><dd className="mono">{p.pt ? inr(p.pt) : <span className="gr">—</span>}</dd>
              <dt>TDS</dt><dd className="mono">{inr(p.tds)}</dd>
              <dt><b>Total</b></dt><dd className="mono warn"><b>{inr(p.ded)}</b></dd>
            </dl>
          </div>
        </div>
        <div className="card">
          <div className="ch"><h2>Net pay</h2></div>
          <div className="cb">
            <div className="kpi stat" style={{ padding: 0 }}>
              <div className="t">Take home</div>
              <div className="v ok">{inr(p.net)}</div>
              <div className="d gr">after {inr(p.ded)} of deductions</div>
            </div>
            <Assume title="Tax here is illustrative">
              {' '}The slabs are the new-regime rates and the arithmetic is right, but a
              real payroll takes account of declarations, other income and prior
              employment. <b>Confirm the numbers with whoever files your returns before
              anyone is paid on them.</b>
            </Assume>
            <p className="gr" style={{ fontSize: '11.5px' }}>Computer-generated. No signature is required.</p>
          </div>
        </div>
      </div>
    </>
  )
}

/* ══════════ MY PAYSLIPS ══════════ */
export function MyPay() {
  const { me } = useSession()
  const p = payslipFor(me.id)

  if (!p) {
    return (
      <>
        <PageHead title="My payslips" sub="You do not have a payroll record." />
        <div className="card"><Empty icon="·">No payslips exist for this account.</Empty></div>
      </>
    )
  }

  return (
    <>
      <PageHead title="My payslips" sub="Your pay, month by month." />
      <div className="kpis">
        <Kpi t="Latest net" icon="₹" v={inr(p.net)} dTone="ok" d={PAYMONTHS[PAYMONTHS.length - 1]} />
        <Kpi t="Gross" icon="▤" v={inr(p.gross)} d="before deductions" />
        <Kpi t="Deductions" icon="−" v={inr(p.ded)} dTone="warn" d="PF, ESI, PT and TDS" />
        <Kpi t="Annual CTC" icon="◎" v={inr(p.annual)} d="cost to company" />
      </div>
      <Sec>Every month</Sec>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {[...PAYMONTHS].reverse().map((m) => {
            const run = PAYRUNS.find((r) => r.month === m)!
            const published = run.state === 'paid'
            return (
              <div className="rw" key={m}>
                <span className={published ? 'ok' : 'gr'}>{published ? '✓' : '◷'}</span>
                <span><b>{m}</b><div className="sd">{published ? 'Published' : RUNSTATE[run.state]![0]}</div></span>
                <span className="mono">{published ? inr(p.net) : <span className="gr">—</span>}</span>
              </div>
            )
          })}
        </div>
      </div></div>
    </>
  )
}

/* ══════════ RECRUITMENT ══════════ */
export function Hiring() {
  const { toast } = useSession()
  const GRID = '180px 180px 130px 120px 1fr'
  return (
    <>
      <PageHead title="Recruitment" sub="Openings and where each candidate has got to."
        actions={<button className="btn" onClick={() => toast('An opening needs a title, a department and a headcount')}>＋ New opening</button>} />

      <div className="kpis">
        <Kpi t="Open positions" icon="⊕" v={OPENINGS.reduce((a, o) => a + o.positions, 0)}
          d={`across ${OPENINGS.length} openings`} />
        <Kpi t="Candidates" icon="◎" v={CANDIDATES.length} d="in the pipeline" />
        <Kpi t="At offer" icon="▤" v={CANDIDATES.filter((c) => c.stage === 'Offer').length}
          dTone="warn" d="awaiting a response" />
        <Kpi t="Verification" icon="✓" v={CANDIDATES.filter((c) => c.stage === 'Verification').length}
          d="background checks running" />
      </div>

      <Sec>Openings</Sec>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {OPENINGS.map((o) => (
            <div className="rw" key={o.id}>
              <span className="gr">·</span>
              <span><b>{o.title}</b><div className="sd">{o.department} · opened {fmtDate(o.openedOn)}</div></span>
              <span><span className="mono">{o.positions}</span>
                <span className="gr" style={{ fontSize: '11.5px' }}> position{o.positions === 1 ? '' : 's'}</span></span>
            </div>
          ))}
        </div>
      </div></div>

      <Sec>Pipeline</Sec>
      <div className="pipe" style={{ marginBottom: 16 }}>
        {HIRESTAGES.map((s) => {
          const n = CANDIDATES.filter((c) => c.stage === s).length
          return (
            <span className={`pchip ${n ? '' : 'zero'}`} key={s}>
              <span className="dt" style={{ background: 'var(--brand2)' }} />{s}<span className="n">{n}</span>
            </span>
          )
        })}
      </div>

      <div className="tbl"><div className="tsc"><div style={{ minWidth: 800 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Candidate</span><span>Opening</span><span>Stage</span><span>Applied</span><span>Note</span>
        </div>
        <div className="tb">
          {CANDIDATES.map((c) => {
            const opening = OPENINGS.find((o) => o.id === c.openingId)
            return (
              <div className="trow" key={c.id} style={{ gridTemplateColumns: GRID, cursor: 'default' }}>
                <div className="cell"><div className="v"><b>{c.name}</b></div></div>
                <div className="cell"><div className="v">{opening?.title}</div>
                  <div className="s">{opening?.department}</div></div>
                <div className="cell">
                  <Chip tone={c.stage === 'Joined' ? 'v' : c.stage === 'Offer' ? 'r' : 'b'}>{c.stage}</Chip>
                </div>
                <div className="cell"><div className="v mono" style={{ fontSize: '12.5px' }}>{fmtDate(c.appliedOn)}</div></div>
                <div className="cell"><div className="s">{c.note}</div></div>
              </div>
            )
          })}
        </div>
      </div></div></div>

      <Banner tone="b" icon="◔" title="Marking someone joined would create their staff record, department and salary">
        <b>That step is not built yet</b> — it needs the offer figures, which live outside
        this screen.
      </Banner>
    </>
  )
}

/* ══════════ PETTY CASH ══════════ */
export function Petty() {
  const { toast } = useSession()
  const balance = pettyBalance()
  const spent = PETTY.filter((e) => e.kind === 'out').reduce((a, e) => a + e.amount, 0)
  const GRID = '110px 1fr 140px 110px 110px'

  return (
    <>
      <PageHead title="Petty cash"
        sub={`Float ${inr(PETTYCFG.float)} · custodian ${PETTYCFG.custodian} · counted every ${PETTYCFG.countEvery}.`}
        actions={<>
          <button className="btn g" onClick={() => toast(`The box should hold ${inr(balance)} — count it and record what you find`)}>Count the box</button>
          <button className="btn" onClick={() => toast(`Entries above ${inr(PETTYCFG.limit)} need approval`)}>＋ Add entry</button>
        </>} />

      <div className="kpis">
        <Kpi t="Balance" icon="◫" v={inr(balance)}
          cls={balance < PETTYCFG.limit ? 'warnk' : undefined}
          dTone={balance < PETTYCFG.limit ? 'warn' : 'ok'} d="should be in the box" />
        <Kpi t="Spent" icon="−" v={inr(spent)} d="this period" />
        <Kpi t="Entries" icon="▤" v={PETTY.length} d="in the ledger" />
        <Kpi t="Single-entry limit" icon="◎" v={inr(PETTYCFG.limit)} d="above it needs approval" />
      </div>

      <Sec>Ledger — running balance</Sec>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 760 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Date</span><span>Description</span><span>Category</span><span>Amount</span><span>Balance</span>
        </div>
        <div className="tb">
          {(() => {
            let running = PETTYCFG.float
            return [...PETTY].reverse().map((e) => {
              running += e.kind === 'in' ? e.amount : -e.amount
              return (
                <div className="trow" key={e.id} style={{ gridTemplateColumns: GRID, cursor: 'default' }}>
                  <div className="cell"><div className="v mono" style={{ fontSize: '12.5px' }}>{fmtDate(e.date)}</div></div>
                  <div className="cell"><div className="v">{e.description}</div><div className="s">{who(e.by)}</div></div>
                  <div className="cell"><Chip tone="n">{e.category}</Chip></div>
                  <div className="cell">
                    <div className={`v mono ${e.kind === 'in' ? 'ok' : ''}`}>
                      {e.kind === 'in' ? '+' : '−'}{inr(e.amount)}
                    </div>
                  </div>
                  <div className="cell"><div className="v mono gr">{inr(running)}</div></div>
                </div>
              )
            })
          })()}
        </div>
      </div></div></div>
    </>
  )
}
