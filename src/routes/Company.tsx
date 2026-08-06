import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DEPARTMENTS, PRODUCTS, ROLES, STATUS, roleName, statusColor, statusLabel } from '@/data/seed'
import { api, queryKeys } from '@/lib/api'
import { money } from '@/lib/format'
import { STAGE_SHARES, BUFFER } from '@/lib/sla'
import { useSession } from '@/lib/session'
import { Banner, Chip, Loading, PageHead, SectionHead } from '@/components/ui'

const TABS = ['Staff', 'Clients', 'Departments', 'Roles', 'Products', 'Workflow', 'Turnaround & SLA'] as const
type Tab = (typeof TABS)[number]

export function Company() {
  const { tenant } = useSession()
  const [tab, setTab] = useState<Tab>('Staff')
  const { data: staff } = useQuery({ queryKey: queryKeys.staff, queryFn: api.staff })
  const { data: clients } = useQuery({ queryKey: queryKeys.clients, queryFn: api.clients })

  if (!staff || !clients) return <Loading what="company settings" />

  return (
    <>
      <PageHead title="Company" sub={`How ${tenant.name} is set up.`} />

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Staff' && (
        <>
          <SectionHead>{staff.length} people</SectionHead>
          <div className="tbl"><div className="tsc"><div style={{ minWidth: 800 }}>
            <div className="trow h" style={{ gridTemplateColumns: STAFF_GRID }}>
              <span>Name</span><span>Departments</span><span>Role</span>
              <span>Target</span><span>Availability</span>
            </div>
            <div className="tb">
              {staff.map((s) => (
                <div className="trow" key={s.id} style={{ gridTemplateColumns: STAFF_GRID }}>
                  <div className="cell"><div className="v">{s.name}</div>
                    <div className="s">{s.email}</div></div>
                  <div className="cell"><div className="v gr" style={{ fontSize: '12.5px' }}>
                    {s.departments.join(', ') || <span className="gr">none</span>}</div></div>
                  <div className="cell"><div className="v">{roleName(s.role)}</div></div>
                  <div className="cell"><div className="v mono">{s.capacity || '—'}</div></div>
                  <div className="cell">
                    <Chip tone={s.availability === 'ok' ? 'v' : s.availability === 'leave' ? 'd' : 'r'}>
                      {s.availability === 'ok' ? 'Available'
                        : s.availability === 'leave' ? 'On leave' : 'Off shift'}
                    </Chip>
                  </div>
                </div>
              ))}
            </div>
          </div></div></div>
          <p className="gr" style={{ fontSize: '12.5px', marginTop: 12 }}>
            HR and payroll fields (identity documents, bank details) are deliberately
            not modelled — see the note in the README.
          </p>
        </>
      )}

      {tab === 'Clients' && (
        <>
          <SectionHead>{clients.length} clients</SectionHead>
          <div className="tbl"><div className="tsc"><div style={{ minWidth: 820 }}>
            <div className="trow h" style={{ gridTemplateColumns: CLIENT_GRID }}>
              <span>Client</span><span>Code</span><span>Orders</span>
              <span>Invoiced</span><span>Outstanding</span><span>Terms</span>
            </div>
            <div className="tb">
              {clients.map((c) => (
                <div className="trow" key={c.name} style={{ gridTemplateColumns: CLIENT_GRID }}>
                  <div className="cell"><div className="v"><b>{c.name}</b></div>
                    <div className="s">{c.email || 'no email'}</div></div>
                  <div className="cell"><div className="v mono">{c.displayCode}</div></div>
                  <div className="cell"><div className="v mono">{c.orders}</div></div>
                  <div className="cell"><div className="v mono">{money(c.total)}</div></div>
                  <div className="cell">
                    <div className={`v mono ${c.total - c.paid > 0 ? 'warn' : 'ok'}`}>
                      {money(c.total - c.paid)}
                    </div>
                  </div>
                  <div className="cell"><div className="v">{c.terms}</div></div>
                </div>
              ))}
            </div>
          </div></div></div>
        </>
      )}

      {tab === 'Departments' && (
        <>
          <SectionHead>The production pipeline</SectionHead>
          <div className="card"><div className="cb">
            <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
              {DEPARTMENTS.map((d, i) => (
                <div className="rw" key={d.id}>
                  <span className="mono gr">{i + 1}</span>
                  <span>
                    <b>{d.name}</b>
                    <div className="sd">{d.desc}</div>
                  </span>
                  <span style={{ display: 'flex', gap: 6 }}>
                    {d.auto ? <Chip tone="b">Auto-assigned</Chip> : <Chip tone="n">On demand</Chip>}
                    {d.pair && <Chip tone="v">QCs {d.pair}</Chip>}
                  </span>
                </div>
              ))}
            </div>
          </div></div>
          <Banner tone="b" icon="◔" title="Departments are data, not code">
            A company defines its own pipeline. The <b>pair</b> field is what the
            self-review rule keys off — if a department QCs another, the same person
            cannot do both on one order.
          </Banner>
        </>
      )}

      {tab === 'Roles' && (
        <>
          <SectionHead>What each role can do</SectionHead>
          <div className="card"><div className="cb">
            <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
              {ROLES.map((r) => (
                <div className="rw" key={r.id}>
                  <span className={r.locked ? 'gr' : 'ok'}>{r.locked ? '⚿' : '·'}</span>
                  <span>
                    <b>{r.name}</b>
                    <div className="sd">{r.desc}</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 7 }}>
                      {r.permissions.map((p) => <Chip key={p} tone="n">{p}</Chip>)}
                    </div>
                  </span>
                  <span className="gr" style={{ fontSize: '11.5px' }}>
                    {r.locked ? 'cannot be deleted' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div></div>
          <Banner tone="r" icon="⊘" title="override is declared but granted to nobody">
            Not even Company admin holds it. A permission nobody has is a deliberate
            statement that blocking rules block.
          </Banner>
        </>
      )}

      {tab === 'Products' && (
        <>
          <SectionHead>{PRODUCTS.length} products</SectionHead>
          <div className="tbl"><div className="tsc"><div style={{ minWidth: 600 }}>
            <div className="trow h" style={{ gridTemplateColumns: PROD_GRID }}>
              <span>Code</span><span>Name</span><span>Fee</span><span>Promise</span>
            </div>
            <div className="tb">
              {PRODUCTS.map((p) => (
                <div className="trow" key={p.id} style={{ gridTemplateColumns: PROD_GRID }}>
                  <div className="cell"><div className="v mono"><b>{p.id}</b></div></div>
                  <div className="cell"><div className="v">{p.name}</div></div>
                  <div className="cell"><div className="v mono">{money(p.fee)}</div></div>
                  <div className="cell"><div className="v mono">{p.slaHours}h</div></div>
                </div>
              ))}
            </div>
          </div></div></div>
        </>
      )}

      {tab === 'Workflow' && (
        <>
          <SectionHead>Order statuses</SectionHead>
          <div className="card"><div className="cb">
            <div className="pipe">
              {Object.keys(STATUS).map((k) => (
                <span className="pchip" key={k}>
                  <span className="dt" style={{ background: statusColor(k) }} />
                  {statusLabel(k)}
                </span>
              ))}
            </div>
          </div></div>
        </>
      )}

      {tab === 'Turnaround & SLA' && (
        <>
          <Banner tone="r" icon="✎" title="These shares are a guess, not your data">
            The prototype's designer picked them "from how the work reads, not from
            timings". Research could not validate or disprove a fixed percentage split
            against measured cycle times. <b>Measure a month of finished orders and
            replace them.</b>
          </Banner>

          <SectionHead>Stage budgets</SectionHead>
          <div className="card"><div className="cb">
            <p className="gr" style={{ fontSize: '12.5px', marginBottom: 14 }}>
              A client promise is split across the stages, with {(BUFFER * 100).toFixed(0)}%
              held back as buffer. A 24h promise gives {(24 * (1 - BUFFER)).toFixed(1)}h of
              usable stage time.
            </p>
            <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
              {STAGE_SHARES.map((s) => (
                <div className="rw" key={s.department}>
                  <span className="gr">·</span>
                  <span>
                    <b>{s.department}</b>
                    <div className="bar" style={{ marginTop: 6, maxWidth: 320 }}>
                      <i style={{ width: `${s.share * 100}%` }} />
                    </div>
                  </span>
                  <span style={{ textAlign: 'right' }}>
                    <div className="mono">{(s.share * 100).toFixed(0)}%</div>
                    <div className="s gr">
                      {(24 * (1 - BUFFER) * s.share).toFixed(1)}h of 24
                    </div>
                  </span>
                </div>
              ))}
            </div>
          </div></div>
        </>
      )}
    </>
  )
}

const STAFF_GRID = '190px 190px 140px 80px 130px'
const CLIENT_GRID = '160px 80px 90px 120px 130px 100px'
const PROD_GRID = '90px 1fr 100px 100px'
