/**
 * HRMS — Attendance · Leave · Payroll · Payslips · My payslips · Recruitment ·
 * Petty cash. Tab sets, KPI labels and detail lines transcribed from the
 * original rather than written afresh.
 */
import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { NOW, STAFF, who } from '@/data/seed'
import {
  ATTENDANCE, CANDIDATES, HIRESTAGES, LEAVE, LEAVEPOLICY, LEAVETYPES, LVSTATUS,
  OPENINGS, PAYMONTHS, PAYRUNS, PETTY, PETTYCFG, RUNSTATE, RUNSTEPS, SITES,
  TIMECFG, WORKING_DAYS, payslipFor, pettyBalance,
} from '@/data/seed3'
import { fmtDate, inr } from '@/lib/format'
import { useSession } from '@/lib/session'
import { Assume, Banner, Chip, Empty, Kpi, PageHead, Sec, type Tone } from '@/components/ui'

const roster = () => STAFF.filter((s) => s.dep.length)

/* ══════════ ATTENDANCE — six tabs ══════════ */
const ATABS = ['Today', 'Roster', 'This month', 'Late logins', 'Patterns', 'How it works'] as const

export function Attendance() {
  const { toast } = useSession()
  const [tab, setTab] = useState<(typeof ATABS)[number]>('Today')
  const team = roster()
  const onLeave = STAFF.filter((s) => s.avail === 'leave').length
  const corrections = 3, overtime = 2, swaps = 1
  const waiting = corrections + overtime + swaps
  const lateTotal = ATTENDANCE.reduce((a, r) => a + r.lateMarks, 0)

  return (
    <>
      <PageHead
        title="Attendance"
        sub={`${fmtDate(NOW)} · ${team.filter((s) => s.avail === 'ok').length} of ${team.length} working right now`}
        actions={<>
          <button className="btn g" onClick={() => toast(`attendance export — ${ATTENDANCE.length} rows`)}>Export</button>
          <button className="btn" onClick={() => toast('Check-in records the device location and its accuracy, and flags anything outside the site radius')}>Check in</button>
        </>}
      />

      <div className="kpis">
        <Kpi t="Working now" v={team.filter((s) => s.avail === 'ok').length} d={`of ${team.length} on the team`} />
        <Kpi t="On leave today" v={onLeave} d="approved and away" />
        <Kpi t="Waiting on you" v={waiting}
          cls={waiting ? 'warnk' : undefined} dTone="warn"
          d={`${corrections} corrections · ${overtime} overtime · ${swaps} swaps`}
          onClick={() => setTab('Today')} />
        <Kpi t="Punches today" v={team.filter((s) => s.avail === 'ok').length * 2} d="in, out and breaks" />
      </div>

      <div className="tabs">
        {ATABS.map((t) => (
          <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>
            {t}
            {t === 'Today' && <span className="bdg">{waiting}</span>}
            {t === 'Late logins' && <span className="bdg">{lateTotal}</span>}
          </button>
        ))}
      </div>

      {tab === 'Today' && (
        <>
          <Sec>Today — who is in</Sec>
          <div className="card"><div className="cb">
            <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
              {team.map((s) => (
                <div className="rw" key={s.id}>
                  <span className={s.avail === 'ok' ? 'ok' : 'warn'}>{s.avail === 'ok' ? '✓' : '·'}</span>
                  <span><b>{s.n}</b><div className="sd">{s.dep.join(', ')} · {s.shift} shift</div></span>
                  <span>{s.avail === 'ok'
                    ? <Chip tone="v">In</Chip>
                    : <Chip tone={s.avail === 'leave' ? 'd' : 'r'}>{s.avail === 'leave' ? 'On leave' : 'Off shift'}</Chip>}</span>
                </div>
              ))}
            </div>
          </div></div>

          <Sec>Corrections waiting on you — {corrections}</Sec>
          <div className="card"><div className="cb">
            <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
              {team.slice(0, corrections).map((s) => (
                <div className="rw" key={s.id}>
                  <span className="warn">◷</span>
                  <span><b>{s.n}</b><div className="sd">Missed the out-punch — asks for the day to be corrected</div></span>
                  <span style={{ display: 'flex', gap: 6 }}>
                    <button className="btn g sm" onClick={() => toast('Declined — the punch log stands')}>Decline</button>
                    <button className="btn sm" onClick={() => toast('Corrected — the change stays in the log')}>Approve</button>
                  </span>
                </div>
              ))}
            </div>
          </div></div>

          <Sec>Overtime to approve — {overtime}</Sec>
          <div className="card"><div className="cb">
            <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
              {team.slice(3, 3 + overtime).map((s) => (
                <div className="rw" key={s.id}>
                  <span className="warn">＋</span>
                  <span><b>{s.n}</b><div className="sd">2.5h beyond the standard day</div></span>
                  <span><button className="btn sm" onClick={() => toast('Overtime approved')}>Approve</button></span>
                </div>
              ))}
            </div>
          </div></div>

          <Sec>Shift swaps — {swaps}</Sec>
          <div className="card"><div className="cb">
            <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
              <div className="rw">
                <span className="gr">⇄</span>
                <span><b>{team[5]?.n} ⇄ {team[6]?.n}</b><div className="sd">Swapping the early shift on {fmtDate(new Date(NOW.getTime() + 86_400_000))}</div></span>
                <span><button className="btn sm" onClick={() => toast('Swap approved')}>Approve</button></span>
              </div>
            </div>
          </div></div>
        </>
      )}

      {tab === 'Roster' && (
        <div className="card"><div className="cb">
          <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
            {team.map((s) => (
              <div className="rw" key={s.id}>
                <span className="gr">·</span>
                <span><b>{s.n}</b><div className="sd">{s.dep.join(', ')}</div></span>
                <span className="mono">{s.shift}</span>
              </div>
            ))}
          </div>
        </div></div>
      )}

      {tab === 'This month' && (
        <div className="tbl"><div className="tsc"><div style={{ minWidth: 820 }}>
          <div className="trow h" style={{ gridTemplateColumns: MONTH_GRID }}>
            <span>Person</span><span>Present</span><span>WFH</span><span>Leave</span>
            <span>Unpaid</span><span>Late</span><span>Attendance</span>
          </div>
          <div className="tb">
            {ATTENDANCE.map((r) => {
              const pct = (r.present / WORKING_DAYS) * 100
              return (
                <div className="trow" key={r.staffId} style={{ gridTemplateColumns: MONTH_GRID, cursor: 'default' }}>
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
      )}

      {tab === 'Late logins' && (
        <>
          <div className="tbl"><div className="tsc"><div style={{ minWidth: 700 }}>
            <div className="trow h" style={{ gridTemplateColumns: '190px 110px 1fr 130px' }}>
              <span>Person</span><span>Late marks</span><span>Pattern</span><span></span>
            </div>
            <div className="tb">
              {ATTENDANCE.filter((r) => r.lateMarks > 0).map((r) => (
                <div className="trow" key={r.staffId} style={{ gridTemplateColumns: '190px 110px 1fr 130px', cursor: 'default' }}>
                  <div className="cell"><div className="v">{who(r.staffId)}</div></div>
                  <div className="cell"><div className={`v mono ${r.lateMarks > 2 ? 'warn' : ''}`}>{r.lateMarks}</div></div>
                  <div className="cell"><div className="s">{r.lateMarks > 2 ? 'Repeating — worth a conversation' : 'Occasional'}</div></div>
                  <div className="cell"><button className="btn g sm" onClick={() => toast('Waived — it stays in the log, it just stops counting')}>Waive</button></div>
                </div>
              ))}
            </div>
          </div></div></div>
          <Assume title="Waiving is a record, not an erasure">
            {' '}A waived mark stays in the log and in the export — it simply stops counting
            towards the pattern. <b>Attendance figures people cannot see the workings of are
            the ones they stop trusting</b>, so nothing here is deleted, only annotated.
          </Assume>
        </>
      )}

      {tab === 'Patterns' && (
        <div className="card"><div className="cb">
          <p className="gr" style={{ fontSize: '12.5px', marginBottom: 14 }}>
            A pattern is repetition, not a single day. These are people whose late marks
            or unpaid days cluster rather than scatter.
          </p>
          <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
            {ATTENDANCE.filter((r) => r.lateMarks > 2 || r.unpaid > 0).map((r) => (
              <div className="rw" key={r.staffId}>
                <span className="warn">◷</span>
                <span><b>{who(r.staffId)}</b>
                  <div className="sd">{r.lateMarks} late · {r.unpaid} unpaid day{r.unpaid === 1 ? '' : 's'}</div></span>
                <span />
              </div>
            ))}
          </div>
        </div></div>
      )}

      {tab === 'How it works' && (
        <div className="card"><div className="cb">
          <dl className="kv">
            <dt>Late grace</dt><dd>{TIMECFG.lateGraceMins} minutes — a punch inside it is not recorded as late at all</dd>
            <dt>Rest break</dt><dd>{TIMECFG.restMins} min after {TIMECFG.restAfterMins / 60}h</dd>
            <dt>Overtime after</dt><dd>{TIMECFG.otAfterMins / 60}h in a day</dd>
            <dt>Permissions</dt><dd>{TIMECFG.permPerMonth} per month</dd>
            <dt>Sites</dt><dd>{SITES.map((s) => `${s.name}${s.radiusM ? ` (${s.radiusM}m)` : ''}`).join(' · ')}</dd>
          </dl>
          <p className="gr" style={{ fontSize: '12.5px', marginTop: 12 }}>
            What the geofence does give you: the check-in records the device location and
            its accuracy, and flags anything outside the site radius.
          </p>
        </div></div>
      )}
    </>
  )
}
const MONTH_GRID = '190px 90px 80px 80px 90px 90px 1fr'

/* ══════════ LEAVE ══════════ */
const LV_GRID = '170px 130px 190px 70px 1fr 140px'

export function Leave() {
  const { toast } = useSession()
  const pending = LEAVE.filter((l) => l.status === 'pending')
  const bal = (key: string) => LEAVETYPES.find((t) => t.key === key)?.annual ?? 0
  const taken = (key: string) => LEAVE.filter((l) => l.type === key && l.status === 'approved')
    .reduce((a, l) => a + l.days, 0)

  return (
    <>
      <PageHead
        title="Leave"
        sub={`${pending.length} waiting on you · ${LEAVE.length} across the company`}
        actions={<button className="btn" onClick={() => toast(`Policy: ${LEAVEPOLICY.noticeDays} days notice, at least ${LEAVEPOLICY.deptCoverMin} person must remain available`)}>Apply for leave</button>}
      />

      <div className="kpis">
        <Kpi t="Paid leave" v={bal('el')} d={`${taken('el')} taken of ${bal('el')} earned`} />
        <Kpi t="Casual leave" v={bal('cl')} d={`${taken('cl')} taken of ${bal('cl')} earned`} />
        <Kpi t="Sick leave" v={bal('sl')} d={`${taken('sl')} taken of ${bal('sl')} earned`} />
        <Kpi t="Compensatory off" v={2} d="0 taken" />
      </div>

      {pending.length > 0 && (
        <Banner tone="r" icon="◷" title={`${pending.length} awaiting approval`}>
          {pending.map((l) => who(l.staffId)).join(', ')}.
        </Banner>
      )}

      <div className="tbl"><div className="tsc"><div style={{ minWidth: 900 }}>
        <div className="trow h" style={{ gridTemplateColumns: LV_GRID }}>
          <span>Who</span><span>Type</span><span>Dates</span><span>Days</span><span>Reason</span><span>Decision</span>
        </div>
        <div className="tb">
          {LEAVE.map((l) => {
            const type = LEAVETYPES.find((t) => t.key === l.type)
            const [label, tone] = LVSTATUS[l.status]!
            return (
              <div className="trow" key={l.id} style={{ gridTemplateColumns: LV_GRID, cursor: 'default' }}>
                <div className="cell"><div className="v">{who(l.staffId)}</div></div>
                <div className="cell"><div className="v">{type?.name}</div>
                  {!type?.paid && <div className="s bad">unpaid</div>}</div>
                <div className="cell"><div className="v mono" style={{ fontSize: '12.5px' }}>
                  {fmtDate(l.from)} – {fmtDate(l.to)}</div></div>
                <div className="cell"><div className="v mono">{l.days}</div></div>
                <div className="cell"><div className="s">{l.reason}</div></div>
                <div className="cell">
                  {l.status === 'pending'
                    ? <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn g sm" onClick={() => toast('Declined')}>Decline</button>
                        <button className="btn sm" onClick={() => toast('Approved')}>Approve</button>
                      </div>
                    : <Chip tone={tone as Tone}>{label}</Chip>}
                </div>
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

/* ══════════ PAYROLL — four tabs ══════════ */
const PRTABS = ['The run', 'Register', 'Cost and statutory', 'Leavers'] as const
const REG_GRID = '190px 110px 110px 110px 110px 1fr'

export function Payroll() {
  const { toast } = useSession()
  const [month, setMonth] = useState(PAYMONTHS[PAYMONTHS.length - 2] ?? PAYMONTHS[0]!)
  const [tab, setTab] = useState<(typeof PRTABS)[number]>('The run')
  const run = PAYRUNS.find((r) => r.month === month)!
  const [label] = RUNSTATE[run.state]!
  const slips = roster().map((s) => payslipFor(s.id)!)
  const pf = slips.reduce((a, p) => a + p.pf, 0)
  const pt = slips.reduce((a, p) => a + p.pt, 0)
  const tds = slips.reduce((a, p) => a + p.tds, 0)
  const stepIndex = run.state === 'draft' ? 3 : run.state === 'locked' ? 4 : run.state === 'approved' ? 5 : 6
  const leavers = STAFF.filter((s) => s.leaving)
  const flagged = ATTENDANCE.filter((r) => r.unpaid > 0 || r.lateMarks > 3).length + leavers.length

  return (
    <>
      <PageHead
        title="Payroll"
        sub={`${month} · ${label} · ${run.headcount} people on the payroll`}
        actions={<>
          <select className="inp" value={month} onChange={(e) => setMonth(e.target.value)}
            aria-label="Payroll month" style={{ width: 'auto' }}>
            {PAYMONTHS.map((m) => <option key={m}>{m}</option>)}
          </select>
          <button className="btn g" onClick={() => toast(`salary register — ${run.headcount} rows`)}>Export register</button>
          <button className="btn" disabled={run.state !== 'draft'}
            onClick={() => toast('Locked — attendance is frozen, figures will not move')}>Lock the run</button>
        </>}
      />

      <div className="kpis">
        <Kpi t="On the payroll" v={run.headcount} d="all payable" />
        <Kpi t="Gross earnings" v={inr(run.gross)} d="before deductions" />
        <Kpi t="Deductions" v={inr(run.ded)} d={`PF ${inr(pf)} · PT ${inr(pt)} · TDS ${inr(tds)}`} />
        <Kpi t="Net payable" v={inr(run.net)} dTone="ok" d={`to ${run.headcount} bank accounts`} />
      </div>

      <div className="tabs">
        {PRTABS.map((t) => (
          <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>
            {t}
            {t === 'The run' && <span className="bdg">{flagged}</span>}
            {t === 'Leavers' && leavers.length > 0 && <span className="bdg">{leavers.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'The run' && (
        <>
          <Assume title="Tax slabs are the new regime, FY 2025-26">
            {' '}The arithmetic is right and the rates are current, but real TDS depends on
            declarations, other income and prior employment.{' '}
            <b>Have your provider confirm before anyone is paid on these figures.</b>
          </Assume>
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

          <Sec>Check these before approving — {flagged}</Sec>
          <div className="card"><div className="cb">
            <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
              {ATTENDANCE.filter((r) => r.unpaid > 0 || r.lateMarks > 3).map((r) => (
                <div className="rw" key={r.staffId}>
                  <span className="warn">◷</span>
                  <span><b>{who(r.staffId)}</b>
                    <div className="sd">{r.unpaid ? `${r.unpaid} unpaid day${r.unpaid === 1 ? '' : 's'}` : `${r.lateMarks} late marks`}</div></span>
                  <span className="mono gr">{inr(payslipFor(r.staffId)?.net ?? 0)}</span>
                </div>
              ))}
              {leavers.map((s) => (
                <div className="rw" key={s.id}>
                  <span className="bad">⚑</span>
                  <span><b>{s.n}</b><div className="sd">Leaving {fmtDate(s.leaving!)} — settlement due</div></span>
                  <span className="mono gr">{inr(payslipFor(s.id)?.net ?? 0)}</span>
                </div>
              ))}
            </div>
          </div></div>
        </>
      )}

      {tab === 'Register' && (
        <div className="tbl"><div className="tsc"><div style={{ minWidth: 900 }}>
          <div className="trow h" style={{ gridTemplateColumns: REG_GRID }}>
            <span>Person</span><span>Basic</span><span>HRA</span><span>Gross</span><span>Deductions</span><span>Net</span>
          </div>
          <div className="tb">
            {roster().map((s) => {
              const p = payslipFor(s.id)!
              return (
                <div className="trow" key={s.id} style={{ gridTemplateColumns: REG_GRID, cursor: 'default' }}>
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
      )}

      {tab === 'Cost and statutory' && (
        <>
          <div className="card"><div className="cb">
            <dl className="kv">
              <dt>Gross earnings</dt><dd className="mono">{inr(run.gross)}</dd>
              <dt>Provident fund</dt><dd className="mono">{inr(pf)}</dd>
              <dt>Professional tax</dt><dd className="mono">{inr(pt)}</dd>
              <dt>TDS</dt><dd className="mono">{inr(tds)}</dd>
              <dt><b>Net payable</b></dt><dd className="mono ok"><b>{inr(run.net)}</b></dd>
            </dl>
            <Sec>Statutory exports</Sec>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              {['Salary register', 'EPFO ECR', 'ESI return', 'Professional tax', 'Form 24Q', 'Bank file'].map((x) => (
                <button className="btn g sm" key={x}
                  onClick={() => toast(`${x} — right figures in the right shape, not a portal-validated file`)}>{x}</button>
              ))}
            </div>
          </div></div>
          <Assume title="These are the right figures in the right shape, not portal-ready files">
            {' '}Each downloads with the columns the corresponding portal asks for, from the
            same run the register came from. <b>The exact file layouts change, and each
            portal has its own validator</b> — have whoever files your returns run one
            through before you rely on it.
          </Assume>
        </>
      )}

      {tab === 'Leavers' && (
        <div className="card"><div className="cb">
          {leavers.length === 0
            ? <Empty icon="✓">Nobody is leaving in this run.</Empty>
            : (
              <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
                {leavers.map((s) => (
                  <div className="rw" key={s.id}>
                    <span className="bad">⚑</span>
                    <span><b>{s.n}</b>
                      <div className="sd">{s.dep.join(', ')} · last day {fmtDate(s.leaving!)}</div>
                      <div className="sd">Joined {s.doj} — settlement needs notice pay, unused leave and gratuity eligibility</div></span>
                    <span><button className="btn g sm" onClick={() => toast('Settlement needs the gratuity rules confirmed before anyone is paid on it')}>Settle</button></span>
                  </div>
                ))}
              </div>
            )}
        </div></div>
      )}
    </>
  )
}

/* ══════════ PAYSLIPS — two tabs ══════════ */
const PS_GRID = '190px 170px 120px 120px 120px 1fr'

export function Payslips() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(PAYMONTHS[PAYMONTHS.length - 2] ?? PAYMONTHS[0]!)
  const [tab, setTab] = useState<'This month' | 'One person'>('This month')
  const [person, setPerson] = useState(roster()[0]?.id ?? '')
  const slips = roster().map((s) => payslipFor(s.id)!)
  const totalNet = slips.reduce((a, p) => a + p.net, 0)
  const withUnpaid = ATTENDANCE.filter((r) => r.unpaid > 0).length + 5

  return (
    <>
      <PageHead
        title="Payslips"
        sub={`${month} · ${slips.length} published`}
        actions={
          <select className="inp" value={month} onChange={(e) => setMonth(e.target.value)}
            aria-label="Month" style={{ width: 'auto' }}>
            {PAYMONTHS.map((m) => <option key={m}>{m}</option>)}
          </select>
        }
      />

      <div className="kpis">
        <Kpi t="Payslips out" v={slips.length} d="visible to each person" />
        <Kpi t="Total net" v={inr(totalNet)} d="as credited" />
        <Kpi t="With a deduction for unpaid days" v={withUnpaid} d="the ones people query" />
        <Kpi t="Approved by" v="Harry" d={month} />
      </div>

      <div className="tabs">
        {(['This month', 'One person'] as const).map((t) => (
          <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'This month' && (
        <div className="tbl"><div className="tsc"><div style={{ minWidth: 860 }}>
          <div className="trow h" style={{ gridTemplateColumns: PS_GRID }}>
            <span>Name</span><span>Department</span><span>Gross</span><span>Deductions</span><span>Net</span><span></span>
          </div>
          <div className="tb">
            {roster().map((s) => {
              const p = payslipFor(s.id)!
              return (
                <div key={s.id} className="trow" style={{ gridTemplateColumns: PS_GRID }}
                  role="button" tabIndex={0}
                  onClick={() => navigate({ to: '/payslips/$staffId', params: { staffId: s.id } })}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate({ to: '/payslips/$staffId', params: { staffId: s.id } }) }}>
                  <div className="cell"><div className="v">{s.n}</div></div>
                  <div className="cell"><div className="v gr" style={{ fontSize: '12.5px' }}>{s.dep.join(', ')}</div></div>
                  <div className="cell"><div className="v mono">{inr(p.gross)}</div></div>
                  <div className="cell"><div className="v mono warn">{inr(p.ded)}</div></div>
                  <div className="cell"><div className="v mono ok">{inr(p.net)}</div></div>
                  <div className="cell"><div className="s gr">View →</div></div>
                </div>
              )
            })}
          </div>
        </div></div></div>
      )}

      {tab === 'One person' && (
        <div className="card"><div className="cb">
          <div className="fld" style={{ maxWidth: 280, marginBottom: 16 }}>
            <label htmlFor="ps-person">Person</label>
            <select className="inp" id="ps-person" value={person} onChange={(e) => setPerson(e.target.value)}>
              {roster().map((s) => <option key={s.id} value={s.id}>{s.n}</option>)}
            </select>
          </div>
          <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
            {[...PAYMONTHS].reverse().map((m) => {
              const run = PAYRUNS.find((r) => r.month === m)!
              const p = payslipFor(person)
              const published = run.state === 'paid'
              return (
                <div className="rw" key={m}>
                  <span className={published ? 'ok' : 'gr'}>{published ? '✓' : '◷'}</span>
                  <span><b>{m}</b><div className="sd">{published ? 'Published' : RUNSTATE[run.state]![0]}</div></span>
                  <span className="mono">{published && p ? inr(p.net) : <span className="gr">—</span>}</span>
                </div>
              )
            })}
          </div>
        </div></div>
      )}
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
      <PageHead title={p.staff.n} sub={`Payslip · ${PAYMONTHS[PAYMONTHS.length - 2]}`}
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
const MP_GRID = '150px 130px 130px 1fr'

export function MyPay() {
  const { me } = useSession()
  const p = payslipFor(me.id)
  const published = PAYRUNS.filter((r) => r.state === 'paid')

  if (!p) {
    return (
      <>
        <PageHead title="My payslips" sub="You do not have a payroll record." />
        <div className="card"><Empty icon="·">No payslips exist for this account.</Empty></div>
      </>
    )
  }

  const yearDed = p.ded * published.length
  const yearNet = p.net * published.length

  return (
    <>
      <PageHead title="My payslips" sub={`${me.n} · ${published.length} published`} />
      <div className="kpis">
        <Kpi t="Last net pay" v={inr(p.net)} d={PAYMONTHS[PAYMONTHS.length - 2]} />
        <Kpi t="Gross that month" v={inr(p.gross)} d="before deductions" />
        <Kpi t="Deducted this year" v={inr(yearDed)} d={`of which ${inr(p.tds * published.length)} tax`} />
        <Kpi t="Received this year" v={inr(yearNet)} d={`across ${published.length} months`} />
      </div>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 620 }}>
        <div className="trow h" style={{ gridTemplateColumns: MP_GRID }}>
          <span>Month</span><span>Gross</span><span>Deductions</span><span>Net pay</span>
        </div>
        <div className="tb">
          {[...PAYMONTHS].reverse().map((m) => {
            const run = PAYRUNS.find((r) => r.month === m)!
            const pub = run.state === 'paid'
            return (
              <div className="trow" key={m} style={{ gridTemplateColumns: MP_GRID, cursor: 'default' }}>
                <div className="cell"><div className="v">{m}</div>
                  {!pub && <div className="s gr">{RUNSTATE[run.state]![0]}</div>}</div>
                <div className="cell"><div className="v mono">{pub ? inr(p.gross) : <span className="gr">—</span>}</div></div>
                <div className="cell"><div className="v mono warn">{pub ? inr(p.ded) : <span className="gr">—</span>}</div></div>
                <div className="cell"><div className="v mono ok">{pub ? inr(p.net) : <span className="gr">—</span>}</div></div>
              </div>
            )
          })}
        </div>
      </div></div></div>
    </>
  )
}

/* ══════════ RECRUITMENT — no KPI tiles in the original ══════════ */
const HIRE_GRID = '180px 180px 130px 120px 1fr'

export function Hiring() {
  const { toast } = useSession()
  return (
    <>
      <PageHead
        title="Recruitment"
        sub={`${OPENINGS.reduce((a, o) => a + o.positions, 0)} positions open · ${CANDIDATES.length} candidates in the pipeline`}
        actions={<button className="btn" onClick={() => toast('An opening needs a title, a department and a headcount')}>＋ New opening</button>}
      />

      <Sec>The pipeline</Sec>
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
        <div className="trow h" style={{ gridTemplateColumns: HIRE_GRID }}>
          <span>Candidate</span><span>Opening</span><span>Stage</span><span>Applied</span><span>Note</span>
        </div>
        <div className="tb">
          {CANDIDATES.map((c) => {
            const opening = OPENINGS.find((o) => o.id === c.openingId)
            return (
              <div className="trow" key={c.id} style={{ gridTemplateColumns: HIRE_GRID, cursor: 'default' }}>
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

      <Sec>Open positions</Sec>
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

      <Banner tone="b" icon="◔" title="Marking someone joined would create their staff record, department and salary">
        <b>That step is not built yet</b> — it needs the offer figures, which live outside
        this screen.
      </Banner>
    </>
  )
}

/* ══════════ PETTY CASH ══════════ */
const PT_GRID = '110px 1fr 130px 100px 100px 110px 100px'

export function Petty() {
  const { toast } = useSession()
  const balance = pettyBalance()
  const spent = PETTY.filter((e) => e.kind === 'out').reduce((a, e) => a + e.amount, 0)
  const unvouched = PETTY.filter((e) => e.kind === 'out').slice(0, 2)
  const unvouchedTotal = unvouched.reduce((a, e) => a + e.amount, 0)
  const lastCount = new Date(NOW.getTime() - 14 * 86_400_000)

  return (
    <>
      <PageHead
        title="Petty cash"
        sub={`${PETTYCFG.custodian} holds the box · counted every ${PETTYCFG.countEvery}`}
        actions={<>
          <button className="btn g" onClick={() => toast(`The box should hold ${inr(balance)} — count it and record what you find`)}>Count the box</button>
          <button className="btn" onClick={() => toast(`Entries above ${inr(PETTYCFG.limit)} need approval`)}>＋ Add entry</button>
        </>}
      />

      <div className="kpis">
        <Kpi t="In the box, on paper" v={inr(balance)} d={`float ${inr(PETTYCFG.float)}`} />
        <Kpi t="Spent in 30 days" v={inr(spent)} d={`${PETTY.filter((e) => e.kind === 'out').length} payments`} />
        <Kpi t="Without a receipt" v={unvouched.length}
          cls={unvouched.length ? 'warnk' : undefined} dTone="warn"
          d={`${inr(unvouchedTotal)} unvouched`} />
        <Kpi t="Last counted" v={fmtDate(lastCount)} d="a count is due" />
      </div>

      <Sec>The ledger</Sec>
      <div className="tbl"><div className="tsc"><div style={{ minWidth: 860 }}>
        <div className="trow h" style={{ gridTemplateColumns: PT_GRID }}>
          <span>Date</span><span>What for</span><span>Who</span><span>Credit</span>
          <span>Debit</span><span>Balance</span><span>Voucher</span>
        </div>
        <div className="tb">
          {(() => {
            let running = PETTYCFG.float
            return [...PETTY].reverse().map((e, i) => {
              running += e.kind === 'in' ? e.amount : -e.amount
              const hasVoucher = i > 1
              return (
                <div className="trow" key={e.id} style={{ gridTemplateColumns: PT_GRID, cursor: 'default' }}>
                  <div className="cell"><div className="v mono" style={{ fontSize: '12.5px' }}>{fmtDate(e.date)}</div></div>
                  <div className="cell"><div className="v">{e.description}</div>
                    <div className="s">{e.category}</div></div>
                  <div className="cell"><div className="v" style={{ fontSize: '12.5px' }}>{who(e.by)}</div></div>
                  <div className="cell"><div className="v mono ok">{e.kind === 'in' ? inr(e.amount) : <span className="gr">—</span>}</div></div>
                  <div className="cell"><div className="v mono">{e.kind === 'out' ? inr(e.amount) : <span className="gr">—</span>}</div></div>
                  <div className="cell"><div className="v mono gr">{inr(running)}</div></div>
                  <div className="cell">
                    {hasVoucher ? <Chip tone="v">Held</Chip> : <Chip tone="r">Missing</Chip>}
                  </div>
                </div>
              )
            })
          })()}
        </div>
      </div></div></div>
    </>
  )
}
