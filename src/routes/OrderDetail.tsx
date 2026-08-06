import { useNavigate, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { NOW, PAIRS, STAGES, statusLabel, staffName } from '@/data/seed'
import { api, queryKeys } from '@/lib/api'
import { fmtDateTime, hoursShort, initials, money } from '@/lib/format'
import { orderPlan } from '@/lib/sla'
import { Banner, Chip, Due, Loading, PageHead, SectionHead } from '@/components/ui'

export function OrderDetail() {
  const { orderId } = useParams({ from: '/orders/$orderId' })
  const navigate = useNavigate()
  const { data: order, isLoading } = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => api.order(orderId),
  })

  if (isLoading) return <Loading what="the order" />

  // A record that is not there should say so and offer the way back, not throw.
  if (!order) {
    return (
      <>
        <PageHead
          title="That order is not here"
          sub="It may have been removed, or the link may be out of date."
        />
        <div className="card">
          <div className="empty">
            <span className="ei">·</span>
            <p>Nothing to show. If you reached this from a link, the order it pointed at no longer exists.</p>
            <button className="btn sm" onClick={() => navigate({ to: '/orders' })}>Back to orders</button>
          </div>
        </div>
      </>
    )
  }

  const plan = orderPlan(order)
  const elapsedH = (NOW.getTime() - order.receivedAt.getTime()) / 3_600_000

  return (
    <>
      <button
        className="btn g sm"
        style={{ marginBottom: 14 }}
        onClick={() => navigate({ to: '/orders' })}
      >
        ← Back to orders
      </button>

      <PageHead
        title={order.id}
        sub={<>{order.property} · {order.county}, {order.state}</>}
        actions={
          <>
            <Chip tone={order.done ? 'v' : order.dueAt < NOW ? 'd' : 'b'}>
              {statusLabel(order.status)}
            </Chip>
            <button className="btn g">Add note</button>
            <button className="btn">Assign remaining</button>
          </>
        }
      />

      {order.flag && (
        <Banner tone="r" icon="◷" title="Held">{order.flag}</Banner>
      )}

      {plan.doomed && (
        <Banner tone="d" icon="⚑" title="This order cannot finish in time">
          The stages still to run need {hoursShort(plan.shortHours)} more than the
          promise has left. Not late yet — but it will be unless something changes.
        </Banner>
      )}

      {!plan.doomed && plan.behind && (
        <Banner tone="r" icon="◷" title={`Behind the ${plan.behindAt} checkpoint`}>
          Still recoverable, but the slack is going.
        </Banner>
      )}

      <div className="two">
        <div>
          <div className="card">
            <div className="ch"><h2>Stages</h2>
              <div className="r gr" style={{ fontSize: '12.5px' }}>one owner per stage</div>
            </div>
            <div className="cb">
              <div className="rows">
                {STAGES.map((stage) => {
                  const who = order.assignments[stage]
                  const paired = PAIRS[stage]
                  const selfReview = !!paired && !!who && order.assignments[paired] === who
                  const cp = plan.rows.find((r) => r.department === stage)
                  return (
                    <div className="rw" key={stage}>
                      <span className={cp?.done ? 'ok' : cp?.behind ? 'bad' : 'gr'}>
                        {cp?.done ? '✓' : cp?.behind ? '⚑' : '·'}
                      </span>
                      <span>
                        <b>{stage}</b>
                        <div className="sd">
                          {who ? staffName(who) : <span className="gr">unassigned</span>}
                          {selfReview && (
                            <span className="bad" style={{ fontWeight: 500 }}>
                              {' '}— self-review, blocked
                            </span>
                          )}
                        </div>
                      </span>
                      <span className="mono gr" style={{ fontSize: '11.5px' }}>
                        {cp ? `${hoursShort(cp.budgetHours)} budget` : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <SectionHead>Checkpoints</SectionHead>
          <div className="card">
            <div className="cb">
              <p className="gr" style={{ fontSize: '12.5px', marginBottom: 14 }}>
                The {order.promiseHours}h promise, split across the stages with a 10% buffer
                held back. <b>These shares are the prototype's guess, not measured</b> —
                see <code>src/lib/sla.ts</code>.
              </p>
              {plan.rows.map((r) => {
                const pct = Math.min(100, (elapsedH / r.dueAtHours) * 100)
                return (
                  <div key={r.department} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', fontSize: '12.5px', marginBottom: 5 }}>
                      <span>{r.department}</span>
                      <span className="mono gr" style={{ marginLeft: 'auto' }}>
                        by {hoursShort(r.dueAtHours)}
                      </span>
                    </div>
                    <div className="bar">
                      <i style={{
                        width: `${r.done ? 100 : pct}%`,
                        background: r.done ? 'var(--ok)' : r.behind ? 'var(--bad)' : 'var(--brand2)',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="ch"><h2>Details</h2></div>
          <div className="cb">
            <dl className="kv">
              <dt>Client</dt><dd>{order.client}</dd>
              <dt>Product</dt><dd>{order.product}</dd>
              <dt>Fee</dt><dd className="mono">{money(order.fee)}</dd>
              <dt>Promise</dt><dd className="mono">{order.promiseHours}h</dd>
              <dt>Received</dt><dd className="mono">{fmtDateTime(order.receivedAt)}</dd>
              <dt>Due</dt><dd><Due at={order.dueAt} /></dd>
              <dt>Age</dt><dd>{order.age}</dd>
              <dt>County</dt><dd>{order.county}, {order.state}</dd>
            </dl>

            <SectionHead>Who is on it</SectionHead>
            <div className="asg">
              {STAGES.filter((s) => order.assignments[s]).map((s) => (
                <span className="ava" key={s} title={`${s}: ${staffName(order.assignments[s])}`}>
                  {initials(staffName(order.assignments[s]))}
                </span>
              ))}
              {STAGES.every((s) => !order.assignments[s]) && (
                <span className="gr" style={{ fontSize: '12.5px' }}>Nobody yet.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
