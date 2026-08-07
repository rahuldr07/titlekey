import { useState } from 'react'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import {
  CLIENTS, NOW, ORDERS, PAIRS, PRODUCTS, STAFF, STAGES, TZ, prod, st, who,
} from '@/data/seed'
import { QCSCALE, QCCRIT } from '@/data/seed2'
import { fmtDT, hh, initials, money } from '@/lib/format'
import { checkpoints, orderPlan, slaFor } from '@/lib/sla'
import { useSession } from '@/lib/session'
import { DataTable, type Row } from '@/components/DataTable'
import { AvatarStack, Banner, Chip, Due, Empty, PageHead, Sec, Stars } from '@/components/ui'

/* ══════════ ORDERS LIST ══════════ */
export function Orders() {
  const { tenant, me, can } = useSession()
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { filter?: string }
  const [pill, setPill] = useState(search.filter ?? 'all')
  const [pf, setPf] = useState('all')
  const [cf, setCf] = useState('all')
  const [df, setDf] = useState('all')
  const [sf, setSf] = useState('all')

  const scope = can('all') ? ORDERS : ORDERS.filter((o) => Object.values(o.a).includes(me.id))
  const base = scope.filter((o) =>
    (sf === 'all' || Object.values(o.a).includes(sf)) &&
    (df === 'all' || !!o.a[df]) &&
    (pf === 'all' || o.pr === pf) &&
    (cf === 'all' || o.cl === cf))

  const rows: Row[] = base.map((o) => {
    const plan = orderPlan(o)
    const h = (o.due.getTime() - NOW.getTime()) / 3_600_000
    return {
      key: o.id,
      k: [o.done ? 'done' : h < 0 ? 'late' : h < 4 ? 'soon' : 'open'],
      text: `${o.id} ${o.cl} ${o.pr} ${o.prop} ${o.co} ${o.st}`,
      onClick: () => navigate({ to: '/orders/$orderId', params: { orderId: o.id } }),
      cells: [
        <><div className="v mono">{o.id}</div><div className="s">{o.cl}</div></>,
        <div className="v">{o.pr}</div>,
        <><div className="v">{o.prop}</div><div className="s">{o.co}, {o.st}</div></>,
        <Chip tone={o.done ? 'v' : o.due < NOW ? 'd' : 'b'}>{st(o.stt)}</Chip>,
        <>
          <Due at={o.due} />
          {plan.doomed && <div className="s bad">short {hh(plan.short)} for the stages left</div>}
          {!plan.doomed && plan.behind && (
            <div className="s" style={{ color: 'var(--warn)', fontWeight: 500 }}>
              behind its {plan.behindAt} checkpoint
            </div>
          )}
        </>,
        <AvatarStack stages={STAGES} a={o.a}
          onOpen={(id) => navigate({ to: '/company/staff/$staffId', params: { staffId: id } })} />,
      ],
    }
  })
  const countIn = (k: string) => rows.filter((r) => r.k.includes(k)).length

  return (
    <>
      <PageHead
        title="Orders"
        sub={can('all')
          ? `Every order in ${tenant.name}. One owner per stage — the dashed circles are nobody.`
          : `The ${scope.length} order${scope.length === 1 ? '' : 's'} you are on. Your account cannot see the rest, which is the point of the permission — not a limitation of the screen.`}
        actions={<>
          <button className="btn g">Export</button>
          <button className="btn" onClick={() => navigate({ to: '/orders/new' })}>＋ New order</button>
        </>}
      />
      <DataTable
        cols={[
          { l: 'Order', w: 120 }, { l: 'Product', w: 95 }, { l: 'Property', w: 190, f: 1.4 },
          { l: 'Stage', w: 120 }, { l: `Due (${TZ})`, w: 180 },
          { l: 'Search · SQ · Typ · TQC · Doc · RTS', w: 190 },
        ]}
        rows={rows}
        min={1080}
        total={base.length}
        noun="orders"
        search="Search order #, property or client"
        active={pill}
        onPill={setPill}
        pills={[
          { key: 'all', label: 'All', count: base.length },
          { key: 'late', label: 'Past due', count: countIn('late'), urgent: true },
          { key: 'soon', label: 'Due < 4h', count: countIn('soon'), urgent: true },
          { key: 'open', label: 'On track', count: countIn('open') },
          { key: 'done', label: 'Delivered', count: countIn('done') },
        ]}
        filters={[
          { label: 'Product', value: pf, onChange: setPf,
            options: [['all', 'All products'], ...[...new Set(ORDERS.map((o) => o.pr))].sort().map((x): [string, string] => [x, x])] },
          { label: 'Client', value: cf, onChange: setCf,
            options: [['all', 'All clients'], ...[...new Set(ORDERS.map((o) => o.cl))].sort().map((x): [string, string] => [x, x])] },
          { label: 'Department', value: df, onChange: setDf,
            options: [['all', 'All departments'], ...STAGES.map((d): [string, string] => [d, d])] },
          { label: 'Staff', value: sf, onChange: setSf,
            options: [['all', 'All staff'],
              ...STAFF.filter((s) => s.dep.length && (df === 'all' || s.dep.includes(df))).map((s): [string, string] => [s.id, s.n])] },
        ]}
      />
      <p className="gr" style={{ fontSize: '12.5px', marginTop: 12 }}>
        A red ring on an avatar means the same person is set to both type and QC that
        order — <b>self-review</b>. Assignment blocks it; see Quality.
      </p>
    </>
  )
}

/* ══════════ ORDER DETAIL — Details · Quality · Documents · Notes ══════════ */
const OTABS = ['Details', 'Quality', 'Documents', 'Notes'] as const

export function OrderDetail() {
  const { orderId } = useParams({ from: '/orders/$orderId' })
  const navigate = useNavigate()
  const { toast } = useSession()
  const [tab, setTab] = useState<(typeof OTABS)[number]>('Details')
  const [stars, setStars] = useState<Record<string, number>>({})
  const [note, setNote] = useState('')
  const o = ORDERS.find((x) => x.id === orderId)

  /* A record that is not there should say so and offer the way back, not throw. */
  if (!o) {
    return (
      <>
        <PageHead title="That order is not here" sub="It may have been removed, or the link may be out of date." />
        <div className="card">
          <Empty icon="·" action={<button className="btn sm" onClick={() => navigate({ to: '/orders' })}>Back to orders</button>}>
            Nothing to show. If you reached this from a link, the order it pointed at no longer exists.
          </Empty>
        </div>
      </>
    )
  }

  const plan = orderPlan(o)
  const cps = checkpoints(slaFor(o.cl, o.pr), o.pr)
  const elapsed = (NOW.getTime() - o.recv.getTime()) / 3_600_000
  const rated = STAGES.filter((s) => o.a[s])

  return (
    <>
      <button className="btn g sm" style={{ marginBottom: 14 }} onClick={() => navigate({ to: '/orders' })}>
        ← Back to orders
      </button>
      <PageHead
        title={o.id}
        sub={<>{o.prop} · {o.co}, {o.st}</>}
        actions={<>
          <Chip tone={o.done ? 'v' : o.due < NOW ? 'd' : 'b'}>{st(o.stt)}</Chip>
          <button className="btn g" onClick={() => toast('Every stage already has an owner')}>Assign remaining</button>
        </>}
      />

      {o.flag && <Banner tone="r" icon="◷" title="Held">{o.flag}</Banner>}
      {plan.doomed && (
        <Banner tone="d" icon="⚑" title="This order cannot finish in time">
          The stages still to run need {hh(plan.short)} more than the promise has left.
          Not late yet — but it will be unless something changes.
        </Banner>
      )}
      {!plan.doomed && plan.behind && (
        <Banner tone="r" icon="◷" title={`Behind the ${plan.behindAt} checkpoint`}>
          Still recoverable, but the slack is going.
        </Banner>
      )}

      <div className="tabs">
        {OTABS.map((t) => (
          <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Details' && (
        <div className="two">
          <div>
            <div className="card">
              <div className="ch"><h2>Stages</h2><div className="r gr" style={{ fontSize: '12.5px' }}>one owner per stage</div></div>
              <div className="cb">
                <div className="rows">
                  {STAGES.map((stage) => {
                    const w = o.a[stage]
                    const paired = PAIRS[stage]
                    const self = !!paired && !!w && o.a[paired] === w
                    const cp = plan.rows.find((r) => r.stage === stage)
                    return (
                      <div className="rw" key={stage}>
                        <span className={cp?.done ? 'ok' : cp?.behind ? 'bad' : 'gr'}>
                          {cp?.done ? '✓' : cp?.behind ? '⚑' : '·'}
                        </span>
                        <span>
                          <b>{stage}</b>
                          <div className="sd">
                            {w ? who(w) : <span className="gr">unassigned</span>}
                            {self && <span className="bad" style={{ fontWeight: 500 }}> — self-review, blocked</span>}
                          </div>
                        </span>
                        <span className="mono gr" style={{ fontSize: '11.5px' }}>
                          {cp ? `${hh(cp.budgetH)} budget` : '—'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <Sec>Checkpoints</Sec>
            <div className="card"><div className="cb">
              <p className="gr" style={{ fontSize: '12.5px', marginBottom: 14 }}>
                The promise, split across the stages with the buffer held back.
              </p>
              {cps.map((r) => {
                const row = plan.rows.find((x) => x.stage === r.stage)
                const pct = Math.min(100, (elapsed / r.dueAtH) * 100)
                return (
                  <div key={r.stage} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', fontSize: '12.5px', marginBottom: 5 }}>
                      <span>{r.stage}</span>
                      <span className="mono gr" style={{ marginLeft: 'auto' }}>by {hh(r.dueAtH)}</span>
                    </div>
                    <div className="bar">
                      <i style={{
                        width: `${row?.done ? 100 : pct}%`,
                        background: row?.done ? 'var(--ok)' : row?.behind ? 'var(--bad)' : 'var(--brand2)',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div></div>
          </div>

          <div className="card">
            <div className="ch"><h2>Details</h2></div>
            <div className="cb">
              <dl className="kv">
                <dt>Client</dt><dd>{o.cl}</dd>
                <dt>Product</dt><dd>{prod(o.pr).n}</dd>
                <dt>Fee</dt><dd className="mono">{money(o.fee)}</dd>
                <dt>Promise</dt><dd className="mono">{slaFor(o.cl, o.pr)}h</dd>
                <dt>Received</dt><dd className="mono">{fmtDT(o.recv)}</dd>
                <dt>Due</dt><dd><Due at={o.due} /></dd>
                <dt>Age</dt><dd>{o.age}</dd>
                <dt>County</dt><dd>{o.co}, {o.st}</dd>
              </dl>
            </div>
          </div>
        </div>
      )}

      {tab === 'Quality' && (
        <div className="card">
          <div className="ch">
            <h2>Rate assigned staff</h2>
            <div className="r gr" style={{ fontSize: '12.5px' }}>
              {QCSCALE.map(([n, l]) => `${l} - ${n}`).join(', ')}
            </div>
          </div>
          <div className="cb">
            {rated.length === 0 ? (
              <Empty icon="·">Nobody is assigned yet — there is nothing to rate.</Empty>
            ) : (
              <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
                {rated.map((stage) => (
                  <div className="rw" key={stage}>
                    <span className="ava">{initials(who(o.a[stage]))}</span>
                    <span><b>{who(o.a[stage])}</b><div className="sd">{stage}</div></span>
                    <Stars value={stars[stage] ?? 0} onChange={(n) => setStars((s) => ({ ...s, [stage]: n }))} />
                  </div>
                ))}
              </div>
            )}
            <div className="fld" style={{ marginTop: 15 }}>
              <label htmlFor="qc-note">Notes</label>
              <textarea className="inp" id="qc-note" placeholder="Enter your notes here..."
                value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 9, marginTop: 14, justifyContent: 'flex-end' }}>
              <button className="btn g" onClick={() => toast('Defect logged against the order and the field')}>Log a defect</button>
              <button
                className="btn"
                onClick={() => {
                  const missing = rated.filter((s) => !stars[s])
                  toast(missing.length
                    ? `${missing.length} ${missing.length === 1 ? 'person is' : 'people are'} still unrated`
                    : 'Ratings saved — the order can now be marked Sent')
                }}
              >
                Save ratings
              </button>
            </div>
            <p className="gr" style={{ fontSize: '11.5px', marginTop: 10 }}>
              Criteria: {QCCRIT.map(([n]) => n).join(' · ')}. A rating is required before
              the order can be marked Sent, and a score of 1 or 2 requires a comment.
            </p>
          </div>
        </div>
      )}

      {tab === 'Documents' && (
        <div className="card">
          <div className="ch">
            <h2>Documents in the package</h2>
            <div className="r">
              <button className="btn g sm" onClick={() => toast('Upload needs somewhere to put the file — not built yet')}>Upload</button>
              <button className="btn sm" onClick={() => toast('Row added')}>＋ Add</button>
            </div>
          </div>
          <div className="cb">
            <div className="rows" style={{ border: 'none', borderRadius: 0 }}>
              {[['Deed of record', 'Recorded 06/14/2019 · Book 2214 / Page 0331', 'ok'],
                ['Open mortgage', 'First National — $184,000', 'ok'],
                ['Tax certificate', 'Paid through 2025', 'ok'],
                ['Prior deed', 'Book 1988 / Page 0114', 'no image']].map(([n, d, s]) => (
                <div className="rw" key={n}>
                  <span className={s === 'ok' ? 'ok' : 'gr'}>{s === 'ok' ? '✓' : '·'}</span>
                  <span><b>{n}</b><div className="sd">{d}</div></span>
                  <span>
                    {s === 'ok'
                      ? <button className="btn g sm" onClick={() => toast('Opening the scan needs the original document files')}>View</button>
                      : <span className="gr" style={{ fontSize: '12.5px' }}>no image</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Notes' && (
        <div className="card">
          <div className="ch"><h2>Notes</h2></div>
          <div className="cb">
            <div className="fld">
              <label htmlFor="ord-note">Add a note</label>
              <textarea className="inp" id="ord-note" placeholder="What happened, for the next person" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn sm" onClick={() => toast('Note added')}>Add note</button>
            </div>
            {o.flag && (
              <div className="rows" style={{ marginTop: 14 }}>
                <div className="rw">
                  <span className="warn">◷</span>
                  <span><b>{o.flag}</b><div className="sd">{who('vs')} · {fmtDT(o.recv)}</div></span>
                  <span />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/* ══════════ NEW ORDER ══════════ */
export function NewOrder() {
  const navigate = useNavigate()
  const { toast } = useSession()
  const [cl, setCl] = useState(CLIENTS[0]!.n)
  const [pr, setPr] = useState(PRODUCTS[0]!.id)
  const chosenH = slaFor(cl, pr)

  return (
    <>
      <button className="btn g sm" style={{ marginBottom: 14 }} onClick={() => navigate({ to: '/orders' })}>
        ← Back to orders
      </button>
      <PageHead title="New order" sub="The due date follows from the client promise on the product." />
      <div className="two">
        <div className="card"><div className="cb">
          <div className="frm">
            <div className="fld"><label htmlFor="no-client">Client</label>
              <select className="inp" id="no-client" value={cl} onChange={(e) => setCl(e.target.value)}>
                {CLIENTS.map((c) => <option key={c.n}>{c.n}</option>)}
              </select></div>
            <div className="fld"><label htmlFor="no-product">Product</label>
              <select className="inp" id="no-product" value={pr} onChange={(e) => setPr(e.target.value)}>
                {PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.n}</option>)}
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
            <button className="btn" onClick={() => toast('Nothing here writes to a database yet — the order lives only in this session')}>
              Create the order
            </button>
          </div>
        </div></div>

        <div className="card">
          <div className="ch"><h2>What this commits to</h2></div>
          <div className="cb">
            <dl className="kv">
              <dt>Fee</dt><dd className="mono">{money(prod(pr).fee)}</dd>
              <dt>Promise</dt><dd className="mono">{chosenH}h</dd>
              <dt>Due</dt><dd><Due at={new Date(NOW.getTime() + chosenH * 3_600_000)} /></dd>
            </dl>
            <Sec>Stages it will pass through</Sec>
            {STAGES.map((s, i) => (
              <div className="stepn" key={s}><span className="sn">{i + 1}</span><span>{s}</span></div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
