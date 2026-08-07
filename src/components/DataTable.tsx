/**
 * The original table(c) shared component: filter pills (a row can belong to more
 * than one bucket), select filters, live search over row text, "Showing X of Y",
 * grid-template columns, clickable rows, empty state.
 */
import { useMemo, useState, type ReactNode } from 'react'

export interface Col { l: string; w?: number; f?: number }
export interface Row {
  key: string
  /** A row can belong to more than one filter — an invoice is both owing and overdue. */
  k: string[]
  /** Text blob the search box matches against, like the original's textContent search. */
  text: string
  cells: ReactNode[]
  onClick?: () => void
}
export interface Pill { key: string; label: string; count?: number; urgent?: boolean }
export interface Filter {
  label: string; value: string
  options: [string, string][]
  onChange: (v: string) => void
}

export function DataTable({ cols, rows, pills, active = 'all', onPill, filters, search, noun = 'orders', total, min = 860, emptyText = 'No rows match this filter.' }: {
  cols: Col[]
  rows: Row[]
  pills?: Pill[]
  active?: string
  onPill?: (k: string) => void
  filters?: Filter[]
  search?: string
  noun?: string
  total?: number
  min?: number
  emptyText?: string
}) {
  const [q, setQ] = useState('')
  const tm = cols.map((c) => `minmax(${c.w ?? 100}px,${c.f ?? 1}fr)`).join(' ')

  const shown = useMemo(() => {
    const byPill = active === 'all' ? rows : rows.filter((r) => r.k.includes(active))
    const needle = q.trim().toLowerCase()
    return needle ? byPill.filter((r) => r.text.toLowerCase().includes(needle)) : byPill
  }, [rows, active, q])

  const den = active === 'all'
    ? (total ?? rows.length)
    : (pills?.find((p) => p.key === active)?.count ?? shown.length)

  const hasBar = !!(pills?.length || filters?.length || search)

  return (
    <>
      {hasBar && (
        <>
          <div className="fbar">
            {pills?.map((p) => (
              <button
                key={p.key}
                className={`pill ${p.urgent ? 'urg' : ''} ${p.key === active ? 'on' : ''}`}
                aria-pressed={p.key === active}
                onClick={() => onPill?.(p.key)}
              >
                {p.label}{p.count != null && <span className="n">{p.count}</span>}
              </button>
            ))}
            <div className="sp">
              {filters?.map((f) => (
                <select
                  key={f.label}
                  className="inp"
                  aria-label={f.label}
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                >
                  {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}
              {search && (
                <input
                  className="inp"
                  placeholder={search}
                  aria-label={search}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              )}
            </div>
          </div>
          <p className="cnt"><span>ⓘ</span> Showing <b>{shown.length}</b> of <b>{den}</b> {noun}</p>
        </>
      )}

      <div className="tbl">
        <div className="tsc">
          <div style={{ minWidth: min }}>
            <div className="trow h" style={{ gridTemplateColumns: tm }}>
              {cols.map((c) => <span key={c.l}>{c.l}</span>)}
            </div>
            <div className="tb">
              {shown.length === 0 ? (
                <div className="empty"><span className="ei">☰</span><p>{emptyText}</p></div>
              ) : shown.map((r) => (
                <div
                  key={r.key}
                  className="trow"
                  style={{ gridTemplateColumns: tm }}
                  {...(r.onClick && {
                    role: 'button', tabIndex: 0, onClick: r.onClick,
                    onKeyDown: (e: React.KeyboardEvent) => {
                      if (e.key === 'Enter') { e.preventDefault(); r.onClick?.() }
                    },
                  })}
                >
                  {r.cells.map((cell, i) => <div className="cell" key={i}>{cell}</div>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
