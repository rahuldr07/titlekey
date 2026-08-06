import type { ReactNode } from 'react'
import { dueInfo, fmtDate, fmtTime, initials } from '@/lib/format'

/* ─── page header ─── */
export function PageHead({ title, sub, actions }: {
  title: string; sub?: ReactNode; actions?: ReactNode
}) {
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

export const SectionHead = ({ children }: { children: ReactNode }) =>
  <h2 className="sec">{children}</h2>

/* ─── chips ─── */
export type ChipTone = 'n' | 'b' | 'v' | 'r' | 'd'
export const Chip = ({ children, tone = 'n' }: { children: ReactNode; tone?: ChipTone }) =>
  <span className={`chip ${tone}`}>{children}</span>

/* ─── KPI tile ───
   The prototype flattens any KPI that isn't clickable, so "looks clickable" and
   "is clickable" stay the same set. `onClick` is what decides. */
export function Kpi({ title, icon, value, detail, tone, detailTone, onClick }: {
  title: string
  icon?: string
  value: ReactNode
  detail?: ReactNode
  /** 'alert' = red surface, 'warnk' = amber surface. */
  tone?: 'alert' | 'warnk'
  detailTone?: 'ok' | 'warn' | 'bad' | 'gr'
  onClick?: () => void
}) {
  const body = (
    <>
      <div className="t">{title}{icon && <span className="i">{icon}</span>}</div>
      <div className="v">{value}</div>
      {detail && <div className={`d ${detailTone ?? 'gr'}`}>{detail}</div>}
    </>
  )
  if (!onClick) return <div className={`kpi stat ${tone ?? ''}`}>{body}</div>
  return (
    <button type="button" className={`kpi ${tone ?? ''}`} onClick={onClick}>
      {body}
    </button>
  )
}

/* ─── due pill ─── */
export function Due({ at }: { at: Date }) {
  const { tone, relative } = dueInfo(at)
  return (
    <span className={`due ${tone}`}>
      {fmtDate(at)} {fmtTime(at)}
      <span className="sub">{relative}</span>
    </span>
  )
}

/* ─── assignee avatar stack ─── */
export function AvatarStack({ stages, assignments, names, onOpen }: {
  stages: string[]
  assignments: Record<string, string | null>
  names: (id: string) => string
  onOpen?: (staffId: string) => void
}) {
  return (
    <div className="asg">
      {stages.map((stage) => {
        const who = assignments[stage]
        if (!who) {
          return <span key={stage} className="ava none" title={`${stage}: unassigned`}>·</span>
        }
        // A red ring means the same person is set to both do and QC — self-review.
        const selfReview = isSelfReview(stage, who, assignments)
        return (
          <button
            key={stage}
            type="button"
            className={`ava ${selfReview ? 'self' : ''}`}
            title={`${stage}: ${names(who)}${selfReview ? ' — self-review' : ''}`}
            onClick={(e) => { e.stopPropagation(); onOpen?.(who) }}
          >
            {initials(names(who))}
          </button>
        )
      })}
    </div>
  )
}

const QC_PAIRS: Record<string, string> = { 'Search QC': 'Search', 'Typing QC': 'Typing' }
function isSelfReview(stage: string, who: string, a: Record<string, string | null>): boolean {
  const paired = QC_PAIRS[stage]
  return !!paired && a[paired] === who
}

/* ─── banner ─── */
export const Banner = ({ tone, icon, title, children, actions }: {
  tone: 'd' | 'r' | 'v' | 'b'
  icon: string
  title?: ReactNode
  children?: ReactNode
  actions?: ReactNode
}) => (
  <div className={`bnr ${tone}`}>
    <span className="bi">{icon}</span>
    <div>
      {title && <div className="bt">{title}</div>}
      {children}
    </div>
    {actions && <div className="ba">{actions}</div>}
  </div>
)

/* ─── empty state ─── */
export const Empty = ({ icon = '☰', children }: { icon?: string; children: ReactNode }) => (
  <div className="empty"><span className="ei">{icon}</span><p>{children}</p></div>
)

/* ─── loading ─── */
export const Loading = ({ what = 'this' }: { what?: string }) => (
  <div className="card"><div className="empty"><span className="ei">◷</span>
    <p>Loading {what}…</p></div></div>
)
