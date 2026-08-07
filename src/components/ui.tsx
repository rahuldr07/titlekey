import type { ReactNode } from 'react'
import { dueInfo, fmtDate, fmtTime, initials } from '@/lib/format'
import { selfReview } from '@/lib/sla'
import { who } from '@/data/seed'

/* ─── page header — the original pageHead() ─── */
export function PageHead({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="hd">
      <div>
        <h1 className="pg">{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {actions && <div className="r">{actions}</div>}
    </div>
  )
}

export const Sec = ({ children }: { children: ReactNode }) => <h2 className="sec">{children}</h2>

/* ─── chip — the original chip(t,k) ─── */
export type Tone = 'n' | 'b' | 'v' | 'r' | 'd'
export const Chip = ({ children, tone = 'n' }: { children: ReactNode; tone?: Tone | string }) => (
  <span className={`chip ${tone || 'n'}`}>{children}</span>
)

/* ─── KPI tile. Original markStatic(): anything that opens keeps the raised card
   treatment; anything that is just a figure is flattened, so "looks clickable"
   and "is clickable" stay the same set. ─── */
export function Kpi({ t, icon, v, d, cls, dTone, onClick, sel }: {
  t: string; icon?: string; v: ReactNode; d?: ReactNode
  cls?: 'alert' | 'warnk'; dTone?: 'ok' | 'warn' | 'bad' | 'gr'
  onClick?: () => void; sel?: boolean
}) {
  const body = (
    <>
      <div className="t">{t}{icon && <span className="i">{icon}</span>}</div>
      <div className="v">{v}</div>
      {d && <div className={`d ${dTone ?? 'gr'}`}>{d}</div>}
    </>
  )
  if (!onClick) return <div className={`kpi stat ${cls ?? ''}`}>{body}</div>
  return (
    <div
      className={`kpi ${cls ?? ''} ${sel ? 'sel' : ''}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
    >
      {body}
    </div>
  )
}

/* ─── due pill — the original dueCell() ─── */
export function Due({ at }: { at: Date }) {
  const { k, rel } = dueInfo(at)
  return (
    <span className={`due ${k}`}>
      {fmtDate(at)} {fmtTime(at)}<span className="sub">{rel}</span>
    </span>
  )
}

/* ─── assignee avatar stack. Red ring = self-review. ─── */
export function AvatarStack({ stages, a, onOpen }: {
  stages: string[]
  a: Record<string, string | null>
  onOpen?: (staffId: string) => void
}) {
  return (
    <div className="asg">
      {stages.map((stage) => {
        const w = a[stage]
        if (!w) return <span key={stage} className="ava none" title={`${stage}: unassigned`}>·</span>
        const self = selfReview(stage, w, a)
        return (
          <button
            key={stage}
            type="button"
            className={`ava ${self ? 'self' : ''}`}
            title={`${stage}: ${who(w)} — open their profile`}
            onClick={(e) => { e.stopPropagation(); onOpen?.(w) }}
          >
            {initials(who(w))}
          </button>
        )
      })}
    </div>
  )
}

/* ─── banner ─── */
export const Banner = ({ tone, icon, title, children, actions }: {
  tone: 'd' | 'r' | 'v' | 'b'; icon: string; title?: ReactNode; children?: ReactNode; actions?: ReactNode
}) => (
  <div className={`bnr ${tone}`}>
    <span className="bi">{icon}</span>
    <div>{title && <div className="bt">{title}</div>}{children}</div>
    {actions && <div className="ba">{actions}</div>}
  </div>
)

/* ─── assumption flag — the original assume(t, b), hatched amber ─── */
export const Assume = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="asm"><span className="ai">✎</span><div><b>{title}</b>{children}</div></div>
)

/* ─── empty state ─── */
export const Empty = ({ icon = '☰', children, action }: {
  icon?: string; children: ReactNode; action?: ReactNode
}) => (
  <div className="empty"><span className="ei">{icon}</span><p>{children}</p>{action}</div>
)

/* ─── QC stars, 1–5 on the original scale ─── */
export function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <span style={{ display: 'inline-flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} of 5`}
          onClick={() => onChange?.(n)}
          style={{ fontSize: '15px', color: n <= value ? 'var(--warn)' : 'var(--rail)', padding: 0 }}
        >
          ★
        </button>
      ))}
    </span>
  )
}
