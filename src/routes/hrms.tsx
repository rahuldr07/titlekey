import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { STAFF, staffName } from '@/data/seed'
import {
  ATTENDANCE, CANDIDATES, HIRE_STAGES, LEAVE, LEAVE_POLICY, LEAVE_STATUS, LEAVE_TYPES,
  OPENINGS, PAY_MONTHS, PAY_RUNS, PETTY, PETTY_CFG, RUN_STATE, RUN_STEPS, SITES,
  TIME_CFG, WORKING_DAYS, payslipFor, pettyBalance,
} from '@/data/seed3'
import { api, queryKeys } from '@/lib/api'
import { fmtDate } from '@/lib/format'
import { useSession } from '@/lib/session'
import { Banner, Chip, Kpi, Loading, PageHead, SectionHead } from '@/components/ui'

const inr = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })

/* ══════════ ATTENDANCE ══════════ */
export function Attendance() {
  const { data: staff } = useQuery({ queryKey: queryKeys.staff, queryFn: api.staff })
  if (!staff) return <Loading what="attendance" />

  const totalPresent = ATTENDANCE.reduce((a, r) => a + r.present, 0)
  const totalLate = ATTENDANCE.reduce((a, r) => a + r.lateMarks, 0)
  const totalUnpaid = ATTENDANCE.reduce((a, r) => a + r.unpaid, 0)
  const totalOt = ATTENDANCE.reduce((a, r) => a + r.otHours, 0)
  const GRID = '190px 90px 80px 80px 90px 90px 1fr'

  return (
    <>
      <PageHead title="Attendance" sub={`${WORKING_DAYS} working days this month.`}
        actions={<><button className="btn g">Export</button><button className="btn">Check in</button></>} />

      <div className="kpis">
        <Kpi title="Days present" icon="✓" value={totalPresent} detailTone="ok" detail="across the team" />
        <Kpi title="Late marks" icon="◷" value={totalLate} tone={totalLate ? 'warnk' : undefined}
          detailTone="warn" detail={`${TIME_CFG.lateGraceMins} min grace applies`} />
        <Kpi title="Unpaid days" icon="▲" value={totalUnpaid} tone={totalUnpaid ? 'alert' : undefined}
          detailTone={totalUnpaid ? 'bad' : 'ok'} detail="loss of pay" />
        <Kpi title="Overtime" icon="＋" value={`${totalOt}h`} detail="beyond the standard day" />
      </div>

      <SectionHead>This month, by person</SectionHead>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 820 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Person</span><span>Present</span><span>WFH</span><span>Leave</span>
          <span>Unpaid</span><span>Late</span><span>Attendance</span>
        </div>
        <div className="tb">
          {ATTENDANCE.map((r) => {
            const pct = (r.present / WORKING_DAYS) * 100
            return (
              <div className="trow" key={r.staffId} style={{ gridTemplateColumns: GRID }}>
                <div className="cell"><div className="v">{staffName(r.staffId)}</div></div>
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

      <SectionHead>How it works</SectionHead>
      <div className="card"><div className="cb">
        <dl className="kv">
          <dt>Late grace</dt><dd>{TIME_CFG.lateGraceMins} minutes — a punch inside it is not recorded as late</dd>
          <dt>Rest break</dt><dd>{TIME_CFG.restMins} min after {TIME_CFG.restAfterMins / 60}h</dd>
          <dt>Overtime after</dt><dd>{TIME_CFG.otAfterMins / 60}h in a day</dd>
          <dt>Permissions</dt><dd>{TIME_CFG.permissionsPerMonth} per month</dd>
          <dt>Sites</dt><dd>{SITES.map((s) => s.name).join(' · ')}</dd>
        </dl>
      </div></div>
      <Banner tone="b" icon="◔" title="Waiving is a record, not an erasure">
        A waived late mark stays in the log and in the export — it simply stops counting
        towards the pattern.
      </Banner>
    </>
  )
}

/* ══════════ LEAVE ══════════ */
export function Leave() {
  const pending = LEAVE.filter((l) => l.status === 'pending')
  const approved = LEAVE.filter((l) => l.status === 'approved')
  const GRID = '170px 130px 200px 80px 140px 1fr'

  return (
    <>
      <PageHead title="Leave" sub="Requests, balances and who is covering."
        actions={<button className="btn">Apply for leave</button>} />

      {pending.length > 0 && (
        <Banner tone="r" icon="◷" title={`${pending.length} awaiting approval`}>
          {pending.map((l) => staffName(l.staffId)).join(', ')}.
        </Banner>
      )}

      <div className="kpis">
        <Kpi title="Awaiting approval" icon="◷" value={pending.length}
          tone={pending.length ? 'warnk' : undefined} detailTone="warn" detail="need a decision" />
        <Kpi title="Approved" icon="✓" value={approved.length} detailTone="ok" detail="upcoming or taken" />
        <Kpi title="On leave today" icon="◎" value={STAFF.filter((s) => s.availability === 'leave').length}
          detail="not eligible for assignment" />
        <Kpi title="Notice required" icon="▤" value={`${LEAVE_POLICY.noticeDays}d`} detail="policy minimum" />
      </div>

      <SectionHead>Requests</SectionHead>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 860 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Person</span><span>Type</span><span>Dates</span><span>Days</span><span>Status</span><span>Reason</span>
        </div>
        <div className="tb">
          {LEAVE.map((l) => {
            const type = LEAVE_TYPES.find((t) => t.key === l.type)
            const [label, tone] = LEAVE_STATUS[l.status]!
            return (
              <div className="trow" key={l.id} style={{ gridTemplateColumns: GRID }}>
                <div className="cell"><div className="v">{staffName(l.staffId)}</div></div>
                <div className="cell"><div className="v">{type?.name}</div>
                  {!type?.paid && <div className="s bad">unpaid</div>}</div>
                <div className="cell"><div className="v mono" style={{ fontSize: '12.5px' }}>
                  {fmtDate(l.from)} – {fmtDate(l.to)}</div></div>
                <div className="cell"><div className="v mono">{l.days}</div></div>
                <div className="cell"><Chip tone={tone as 'n' | 'b' | 'v' | 'r' | 'd'}>{label}</Chip></div>
                <div className="cell"><div className="s">{l.reason}</div></div>
              </div>
            )
          })}
        </div>
      </div></div></div>

      <SectionHead>Leave types and policy</SectionHead>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {LEAVE_TYPES.map((t) => (
            <div className="rw" key={t.key}>
              <span className={t.paid ? 'ok' : 'gr'}>{t.paid ? '✓' : '·'}</span>
              <span><b>{t.name}</b><div className="sd">{t.paid ? 'Paid' : 'Unpaid'}</div></span>
              <span className="mono">{t.annual ? `${t.annual}/year` : '—'}</span>
            </div>
          ))}
        </div>
        <dl className="kv" style={{ marginTop: 16 }}>
          <dt>Carry forward</dt><dd>Up to {LEAVE_POLICY.carryForwardMax} days</dd>
          <dt>Notice</dt><dd>{LEAVE_POLICY.noticeDays} days minimum</dd>
          <dt>Max consecutive</dt><dd>{LEAVE_POLICY.maxConsecutive} days</dd>
          <dt>Department cover</dt><dd>At least {LEAVE_POLICY.deptCoverMin} person must remain available</dd>
        </dl>
      </div></div>
    </>
  )
}

/* ══════════ PAYROLL ══════════ */
export function Payroll() {
  const [month, setMonth] = useState(PAY_MONTHS[PAY_MONTHS.length - 1]!)
  const run = PAY_RUNS.find((r) => r.month === month)!
  const [label, , note] = RUN_STATE[run.state]!
  const stepIndex = run.state === 'draft' ? 2 : run.state === 'locked' ? 3 : run.state === 'approved' ? 4 : 5
  const GRID = '190px 110px 110px 110px 110px 1fr'

  return (
    <>
      <PageHead title="Payroll" sub="The monthly run, step by step."
        actions={
          <>
            <select className="inp" value={month} onChange={(e) => setMonth(e.target.value)}
              aria-label="Payroll month" style={{ width: 'auto' }}>
              {PAY_MONTHS.map((m) => <option key={m}>{m}</option>)}
            </select>
            <button className="btn g">Export register</button>
            <button className="btn" disabled={run.state !== 'draft'}>Lock the run</button>
          </>
        } />

      <Banner tone="r" icon="✎" title="Tax figures are illustrative">
        The arithmetic is right, but real TDS depends on declarations, other income and
        prior employment. <b>Confirm with whoever files your returns before anyone is
        paid on these figures.</b>
      </Banner>

      <div className="kpis">
        <Kpi title="Status" icon="▤" value={label} detail={note} />
        <Kpi title="Headcount" icon="◎" value={run.headcount} detail="on this run" />
        <Kpi title="Gross" icon="₹" value={inr(run.gross)} detail="before deductions" />
        <Kpi title="Net payable" icon="✓" value={inr(run.net)} detailTone="ok"
          detail={`${inr(run.deductions)} deducted`} />
      </div>

      <SectionHead>Where this run has got to</SectionHead>
      <div className="card"><div className="cb">
        {RUN_STEPS.map(([name, desc], i) => (
          <div className="stepn" key={name}>
            <span className={`sn ${i < stepIndex ? 'done' : i === stepIndex ? 'now' : ''}`}>
              {i < stepIndex ? '✓' : i + 1}
            </span>
            <span>
              <b>{name}</b>
              <div className="gr" style={{ fontSize: '11.5px' }}>{desc}</div>
            </span>
          </div>
        ))}
      </div></div>

      <SectionHead>The register</SectionHead>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 900 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Person</span><span>Basic</span><span>HRA</span><span>Gross</span>
          <span>Deductions</span><span>Net</span>
        </div>
        <div className="tb">
          {STAFF.filter((s) => s.departments.length).map((s) => {
            const p = payslipFor(s.id)!
            return (
              <div className="trow" key={s.id} style={{ gridTemplateColumns: GRID }}>
                <div className="cell"><div className="v">{s.name}</div>
                  <div className="s">{s.departments.join(', ')}</div></div>
                <div className="cell"><div className="v mono">{inr(p.basic)}</div></div>
                <div className="cell"><div className="v mono">{inr(p.hra)}</div></div>
                <div className="cell"><div className="v mono">{inr(p.gross)}</div></div>
                <div className="cell"><div className="v mono warn">{inr(p.deductions)}</div></div>
                <div className="cell"><div className="v mono ok"><b>{inr(p.net)}</b></div></div>
              </div>
            )
          })}
        </div>
      </div></div></div>

      <SectionHead>Statutory exports</SectionHead>
      <div className="card"><div className="cb">
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          {['Salary register', 'EPFO ECR', 'ESI return', 'Professional tax', 'Form 24Q', 'Bank file'].map((x) => (
            <button className="btn g sm" key={x}>{x}</button>
          ))}
        </div>
        <p className="gr" style={{ fontSize: '12.5px', marginTop: 12 }}>
          Right figures in the right shape, not portal-validated files. Each portal has
          its own validator — run one through before relying on it.
        </p>
      </div></div>
    </>
  )
}

/* ══════════ PAYSLIPS ══════════ */
export function Payslips() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(PAY_MONTHS[PAY_MONTHS.length - 1]!)
  const GRID = '190px 130px 130px 130px 1fr'

  return (
    <>
      <PageHead title="Payslips" sub={`Published payslips for ${month}.`}
        actions={
          <select className="inp" value={month} onChange={(e) => setMonth(e.target.value)}
            aria-label="Month" style={{ width: 'auto' }}>
            {PAY_MONTHS.map((m) => <option key={m}>{m}</option>)}
          </select>
        } />

      <div className="tbl"><div className="tsc"><div style={{ minWidth: 760 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Person</span><span>Gross</span><span>Deductions</span><span>Net</span><span></span>
        </div>
        <div className="tb">
          {STAFF.filter((s) => s.departments.length).map((s) => {
            const p = payslipFor(s.id)!
            return (
              <div className="trow clickable" key={s.id} style={{ gridTemplateColumns: GRID }}
                role="button" tabIndex={0}
                onClick={() => navigate({ to: '/payslips/$staffId', params: { staffId: s.id } })}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate({ to: '/payslips/$staffId', params: { staffId: s.id } }) } }}>
                <div className="cell"><div className="v">{s.name}</div></div>
                <div className="cell"><div className="v mono">{inr(p.gross)}</div></div>
                <div className="cell"><div className="v mono warn">{inr(p.deductions)}</div></div>
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
  const p = payslipFor(staffId)

  if (!p) {
    return (
      <>
        <PageHead title="That payslip is not here" sub="The person may have been removed." />
        <div className="card"><div className="empty"><span className="ei">·</span>
          <p>Nothing to show.</p>
          <button className="btn sm" onClick={() => navigate({ to: '/payslips' })}>Back to payslips</button>
        </div></div>
      </>
    )
  }

  return (
    <>
      <button className="btn g sm" style={{ marginBottom: 14 }}
        onClick={() => navigate({ to: '/payslips' })}>← Back to payslips</button>
      <PageHead title={p.staff.name} sub={`Payslip · ${PAY_MONTHS[PAY_MONTHS.length - 1]}`}
        actions={<button className="btn g">Download</button>} />

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
            <SectionHead>Deductions</SectionHead>
            <dl className="kv">
              <dt>Provident fund</dt><dd className="mono">{inr(p.pf)}</dd>
              <dt>ESI</dt><dd className="mono">{p.esi ? inr(p.esi) : <span className="gr">not applicable</span>}</dd>
              <dt>Professional tax</dt><dd className="mono">{inr(p.pt)}</dd>
              <dt>TDS</dt><dd className="mono">{inr(p.tds)}</dd>
              <dt><b>Total</b></dt><dd className="mono warn"><b>{inr(p.deductions)}</b></dd>
            </dl>
          </div>
        </div>

        <div className="card">
          <div className="ch"><h2>Net pay</h2></div>
          <div className="cb">
            <div className="kpi stat" style={{ padding: 0 }}>
              <div className="t">Take home</div>
              <div className="v ok">{inr(p.net)}</div>
              <div className="d gr">after {inr(p.deductions)} of deductions</div>
            </div>
            <p className="gr" style={{ fontSize: '11.5px', marginTop: 16 }}>
              Computer-generated. No signature is required.
            </p>
          </div>
        </div>
      </div>

      <Banner tone="r" icon="✎" title="Tax here is illustrative">
        The arithmetic is right, but a real payroll accounts for declarations, other
        income and prior employment. Confirm before anyone is paid on these figures.
      </Banner>
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
        <div className="card"><div className="empty"><span className="ei">·</span>
          <p>No payslips exist for this account.</p></div></div>
      </>
    )
  }

  return (
    <>
      <PageHead title="My payslips" sub="Your pay, month by month." />
      <div className="kpis">
        <Kpi title="Latest net" icon="₹" value={inr(p.net)} detailTone="ok"
          detail={PAY_MONTHS[PAY_MONTHS.length - 1]} />
        <Kpi title="Gross" icon="▤" value={inr(p.gross)} detail="before deductions" />
        <Kpi title="Deductions" icon="−" value={inr(p.deductions)} detailTone="warn"
          detail="PF, ESI, PT and TDS" />
        <Kpi title="Annual CTC" icon="◎" value={inr(p.annual)} detail="cost to company" />
      </div>

      <SectionHead>Every month</SectionHead>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {[...PAY_MONTHS].reverse().map((m) => {
            const run = PAY_RUNS.find((r) => r.month === m)!
            const published = run.state === 'paid'
            return (
              <div className="rw" key={m}>
                <span className={published ? 'ok' : 'gr'}>{published ? '✓' : '◷'}</span>
                <span><b>{m}</b>
                  <div className="sd">{published ? 'Published' : RUN_STATE[run.state]![0]}</div></span>
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
  const GRID = '180px 180px 130px 120px 1fr'
  return (
    <>
      <PageHead title="Recruitment" sub="Openings and where each candidate has got to."
        actions={<button className="btn">＋ New opening</button>} />

      <div className="kpis">
        <Kpi title="Open positions" icon="⊕" value={OPENINGS.reduce((a, o) => a + o.positions, 0)}
          detail={`across ${OPENINGS.length} openings`} />
        <Kpi title="Candidates" icon="◎" value={CANDIDATES.length} detail="in the pipeline" />
        <Kpi title="At offer" icon="▤" value={CANDIDATES.filter((c) => c.stage === 'Offer').length}
          detailTone="warn" detail="awaiting a response" />
        <Kpi title="Verification" icon="✓" value={CANDIDATES.filter((c) => c.stage === 'Verification').length}
          detail="background checks running" />
      </div>

      <SectionHead>Openings</SectionHead>
      <div className="card"><div className="cb">
        <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
          {OPENINGS.map((o) => (
            <div className="rw" key={o.id}>
              <span className="gr">·</span>
              <span><b>{o.title}</b>
                <div className="sd">{o.department} · opened {fmtDate(o.openedOn)}</div></span>
              <span>
                <span className="mono">{o.positions}</span>
                <span className="gr" style={{ fontSize: '11.5px' }}> position{o.positions === 1 ? '' : 's'}</span>
              </span>
            </div>
          ))}
        </div>
      </div></div>

      <SectionHead>Pipeline</SectionHead>
      <div className="pipe" style={{ marginBottom: 16 }}>
        {HIRE_STAGES.map((s) => {
          const n = CANDIDATES.filter((c) => c.stage === s).length
          return (
            <span className={`pchip ${n ? '' : 'zero'}`} key={s}>
              <span className="dt" style={{ background: 'var(--brand2)' }} />{s}
              <span className="n">{n}</span>
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
              <div className="trow" key={c.id} style={{ gridTemplateColumns: GRID }}>
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

      <Banner tone="b" icon="◔" title="Marking someone joined is not wired up">
        It would create their staff record, department and salary — which needs the offer
        figures, and those live outside this screen.
      </Banner>
    </>
  )
}

/* ══════════ PETTY CASH ══════════ */
export function Petty() {
  const balance = pettyBalance()
  const spent = PETTY.filter((e) => e.kind === 'out').reduce((a, e) => a + e.amount, 0)
  const GRID = '110px 1fr 140px 110px 110px'

  return (
    <>
      <PageHead title="Petty cash" sub={`Float ${inr(PETTY_CFG.float)} · custodian ${PETTY_CFG.custodian}.`}
        actions={<><button className="btn g">Count the box</button><button className="btn">＋ Add entry</button></>} />

      {balance < PETTY_CFG.limit && (
        <Banner tone="r" icon="◷" title="Running low">
          Balance is below the {inr(PETTY_CFG.limit)} reorder point. Top up the float.
        </Banner>
      )}

      <div className="kpis">
        <Kpi title="Balance" icon="◫" value={inr(balance)}
          tone={balance < PETTY_CFG.limit ? 'warnk' : undefined}
          detailTone={balance < PETTY_CFG.limit ? 'warn' : 'ok'} detail="should be in the box" />
        <Kpi title="Spent" icon="−" value={inr(spent)} detail="this period" />
        <Kpi title="Entries" icon="▤" value={PETTY.length} detail="in the ledger" />
        <Kpi title="Counted" icon="✓" value={PETTY_CFG.countEvery} detail="reconciliation frequency" />
      </div>

      <SectionHead>Ledger</SectionHead>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 720 }}>
        <div className="trow h" style={{ gridTemplateColumns: GRID }}>
          <span>Date</span><span>Description</span><span>Category</span><span>Amount</span><span>Balance</span>
        </div>
        <div className="tb">
          {(() => {
            let running = PETTY_CFG.float
            return [...PETTY].reverse().map((e) => {
              running += e.kind === 'in' ? e.amount : -e.amount
              return (
                <div className="trow" key={e.id} style={{ gridTemplateColumns: GRID }}>
                  <div className="cell"><div className="v mono" style={{ fontSize: '12.5px' }}>{fmtDate(e.date)}</div></div>
                  <div className="cell"><div className="v">{e.description}</div>
                    <div className="s">{staffName(e.by)}</div></div>
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
