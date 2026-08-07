import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { who } from '@/data/seed'
import {
  LEADS, LSTATUS, STALE_BAD, STALE_WARN, isStale, lastTouch, leadAge, needsFollowUp,
} from '@/data/seed2'
import { fmtDate } from '@/lib/format'
import { useSession } from '@/lib/session'
import { DataTable, type Row } from '@/components/DataTable'
import { Banner, Chip, Empty, Kpi, PageHead, Sec } from '@/components/ui'

/* ══════════ LEADS LIST ══════════ */
export function Leads() {
  const navigate = useNavigate()
  const { toast } = useSession()
  const [pill, setPill] = useState('all')

  const followUp = LEADS.filter(needsFollowUp)
  const open = LEADS.filter((l) => !['won', 'lost'].includes(l.st))

  const rows: Row[] = LEADS.map((l) => {
    const age = leadAge(l)
    const main = l.contacts.find((c) => c.main) ?? l.contacts[0]!
    const [label, tone] = LSTATUS[l.st]!
    return {
      key: l.id,
      k: [l.st, ...(needsFollowUp(l) ? ['followup'] : [])],
      text: `${l.co} ${l.loc} ${main.n} ${main.e}`,
      onClick: () => navigate({ to: '/leads/$leadId', params: { leadId: l.id } }),
      cells: [
        <><div className="v"><b>{l.co}</b></div><div className="s">{l.loc}</div></>,
        <><div className="v" style={{ fontSize: '12.5px' }}>{main.n}</div><div className="s">{main.role}</div></>,
        <Chip tone={tone}>{label}</Chip>,
        <>
          <div className="v mono" style={{ fontSize: '12.5px' }}>{fmtDate(lastTouch(l))}</div>
          <div className={`s ${age >= STALE_BAD ? 'bad' : ''}`}
            style={age >= STALE_WARN && age < STALE_BAD ? { color: 'var(--warn)', fontWeight: 500 } : undefined}>
            {age === 0 ? 'today' : `${age}d ago`}
          </div>
        </>,
        <div className="v">{l.flag ? <Chip tone="r">Flagged</Chip> : <span className="gr">—</span>}</div>,
      ],
    }
  })
  const countIn = (k: string) => rows.filter((r) => r.k.includes(k)).length

  return (
    <>
      <PageHead
        title="Leads"
        sub="Free-form statuses, no enforced pipeline. A follow-up alert is raised by hand or derived from how long the lead has gone quiet."
        actions={<>
          <button className="btn g" onClick={() => toast('Importing a CSV needs a file picker and a column mapper')}>Import</button>
          <button className="btn" onClick={() => navigate({ to: '/leads/new' })}>＋ Add lead</button>
        </>}
      />

      {followUp.length > 0 && (
        <Banner tone="r" icon="◷" title={`${followUp.length} need following up`}>
          Flagged by hand, or no contact for {STALE_WARN} days or more.
        </Banner>
      )}

      <div className="kpis">
        <Kpi t="Open" icon="◎" v={open.length} d="still in play" />
        <Kpi t="Need follow-up" icon="◷" v={followUp.length}
          cls={followUp.length ? 'warnk' : undefined} dTone="warn" d={`flagged or quiet ${STALE_WARN}d+`} />
        <Kpi t="Won" icon="✓" v={LEADS.filter((l) => l.st === 'won').length} dTone="ok" d="signed" />
        <Kpi t="Lost / not now" icon="·"
          v={LEADS.filter((l) => ['lost', 'notnow'].includes(l.st)).length} d="worth revisiting later" />
      </div>

      <DataTable
        cols={[
          { l: 'Company', w: 190, f: 1.4 }, { l: 'Contact', w: 160 }, { l: 'Status', w: 110 },
          { l: 'Last contact', w: 130 }, { l: 'Flag', w: 90 },
        ]}
        rows={rows}
        min={820}
        noun="leads"
        search="Search company or contact"
        active={pill}
        onPill={setPill}
        pills={[
          { key: 'all', label: 'All', count: rows.length },
          { key: 'followup', label: 'Need follow-up', count: countIn('followup'), urgent: true },
          { key: 'new', label: 'New', count: countIn('new') },
          { key: 'contacted', label: 'Contacted', count: countIn('contacted') },
          { key: 'interested', label: 'Interested', count: countIn('interested') },
          { key: 'notnow', label: 'Not now', count: countIn('notnow') },
          { key: 'won', label: 'Won', count: countIn('won') },
          { key: 'lost', label: 'Lost', count: countIn('lost') },
        ]}
      />
    </>
  )
}

/* ══════════ LEAD DETAIL — contacts and the full note history ══════════ */
export function LeadDetail() {
  const { leadId } = useParams({ from: '/leads/$leadId' })
  const navigate = useNavigate()
  const { toast } = useSession()
  const l = LEADS.find((x) => x.id === leadId)

  if (!l) {
    return (
      <>
        <PageHead title="That lead is not here" sub="It may have been removed, or the link may be out of date." />
        <div className="card">
          <Empty icon="·" action={<button className="btn sm" onClick={() => navigate({ to: '/leads' })}>Back to leads</button>}>
            Nothing to show.
          </Empty>
        </div>
      </>
    )
  }

  const [label, tone] = LSTATUS[l.st]!
  return (
    <>
      <button className="btn g sm" style={{ marginBottom: 14 }} onClick={() => navigate({ to: '/leads' })}>
        ← Back to leads
      </button>
      <PageHead
        title={l.co}
        sub={l.loc}
        actions={<>
          <Chip tone={tone}>{label}</Chip>
          {l.flag && <Chip tone="r">Flagged</Chip>}
          <button className="btn g" onClick={() => toast(l.flag ? 'Flag cleared' : 'Flagged for follow-up')}>
            {l.flag ? 'Clear flag' : 'Flag'}
          </button>
          <button className="btn" onClick={() => toast('Converting needs the client terms — not built yet')}>Convert to client</button>
        </>}
      />

      {isStale(l) && (
        <Banner tone="r" icon="◷" title={`No contact for ${leadAge(l)} days`}>
          They have gone quiet. Worth one more attempt before writing it off.
        </Banner>
      )}

      <div className="two">
        <div>
          <div className="card">
            <div className="ch"><h2>Notes — newest first</h2></div>
            <div className="cb">
              <div className="fld" style={{ marginBottom: 14 }}>
                <label htmlFor="lead-note">Add a note</label>
                <textarea className="inp" id="lead-note" placeholder="What was said, and what happens next" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                <button className="btn sm" onClick={() => toast('Note added')}>Add note</button>
              </div>
              <div className="rows">
                {[...l.notes].reverse().map((n, i) => (
                  <div className="rw" key={i}>
                    <span className="gr">·</span>
                    <span>
                      <div style={{ fontSize: '13.5px' }}>{n.t}</div>
                      <div className="sd">{who(n.w)} · {fmtDate(n.at)}</div>
                    </span>
                    <span />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="ch"><h2>Contacts</h2></div>
          <div className="cb">
            <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
              {l.contacts.map((c) => (
                <div className="rw" key={c.n}>
                  <span className={c.main ? 'br' : 'gr'}>{c.main ? '★' : '·'}</span>
                  <span>
                    <b>{c.n}</b>
                    <div className="sd">{c.role}</div>
                    <div className="sd">{c.e}{c.p ? ` · ${c.p}` : ''}</div>
                  </span>
                  <span />
                </div>
              ))}
            </div>
            <Sec>Owner</Sec>
            <p style={{ fontSize: '13.5px' }}>{who(l.own)}</p>
          </div>
        </div>
      </div>
    </>
  )
}

/* ══════════ ADD LEAD ══════════ */
export function NewLead() {
  const navigate = useNavigate()
  const { toast } = useSession()
  return (
    <>
      <button className="btn g sm" style={{ marginBottom: 14 }} onClick={() => navigate({ to: '/leads' })}>
        ← Back to leads
      </button>
      <PageHead title="Add a lead" sub="Only the company name is required." />
      <div className="card"><div className="cb">
        <div className="frm">
          <div className="fld"><label htmlFor="nl-co">Company</label>
            <input className="inp" id="nl-co" placeholder="Vanderbilt American Title" /></div>
          <div className="fld"><label htmlFor="nl-loc">Location</label>
            <input className="inp" id="nl-loc" placeholder="Houston, TX" /></div>
          <div className="fld"><label htmlFor="nl-contact">Contact</label>
            <input className="inp" id="nl-contact" placeholder="Dana Sterling" /></div>
          <div className="fld"><label htmlFor="nl-role">Their role</label>
            <input className="inp" id="nl-role" placeholder="Orders desk" /></div>
          <div className="fld"><label htmlFor="nl-email">Email</label>
            <input className="inp" id="nl-email" type="email" placeholder="orders@example.com" /></div>
          <div className="fld"><label htmlFor="nl-phone">Phone</label>
            <input className="inp mono" id="nl-phone" placeholder="(281) 555-0100" /></div>
        </div>
        <div className="fld" style={{ marginTop: 15 }}>
          <label htmlFor="nl-note">First note</label>
          <textarea className="inp" id="nl-note" placeholder="How they found us, what they need, what was agreed." />
        </div>
        <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
          <button className="btn g" onClick={() => navigate({ to: '/leads' })}>Cancel</button>
          <button className="btn" onClick={() => { toast('Lead added'); navigate({ to: '/leads' }) }}>Add the lead</button>
        </div>
      </div></div>
    </>
  )
}
