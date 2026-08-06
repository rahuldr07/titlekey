import { useMemo, useState, type ReactNode } from 'react'

export interface Column {
  label: string
  /** Minimum width in px, feeding the grid template. */
  width?: number
  /** Flex growth factor. */
  grow?: number
}

export interface Row<T> {
  key: string
  /** Filter buckets this row belongs to. A row can be in several — an invoice
   *  is both owing and overdue — so this is a list. */
  buckets: string[]
  data: T
  cells: ReactNode[]
  onClick?: () => void
}

export interface FilterPill {
  key: string
  label: string
  count: number
  urgent?: boolean
}

export interface SelectFilter {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}

interface Props<T> {
  columns: Column[]
  rows: Row<T>[]
  pills?: FilterPill[]
  activePill?: string
  onPillChange?: (key: string) => void
  filters?: SelectFilter[]
  searchPlaceholder?: string
  noun?: string
  /** Total before filtering, for the "showing X of Y" line. */
  total?: number
  minWidth?: number
  emptyText?: string
}

export function DataTable<T>({
  columns, rows, pills, activePill = 'all', onPillChange, filters,
  searchPlaceholder, noun = 'orders', total, minWidth = 860,
  emptyText = 'No rows match this filter.',
}: Props<T>) {
  const [search, setSearch] = useState('')

  const template = columns
    .map((c) => `minmax(${c.width ?? 100}px, ${c.grow ?? 1}fr)`)
    .join(' ')

  const filtered = useMemo(() => {
    const byPill = activePill === 'all' ? rows : rows.filter((r) => r.buckets.includes(activePill))
    const q = search.trim().toLowerCase()
    if (!q) return byPill
    // Search the rendered text, matching the prototype's behaviour.
    return byPill.filter((r) => JSON.stringify(r.data).toLowerCase().includes(q))
  }, [rows, activePill, search])

  const denominator = activePill === 'all'
    ? (total ?? rows.length)
    : (pills?.find((p) => p.key === activePill)?.count ?? filtered.length)

  const hasBar = !!(pills?.length || filters?.length || searchPlaceholder)

  return (
    <>
      {hasBar && (
        <>
          <div className="fbar">
            {pills?.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`pill ${p.urgent ? 'urg' : ''} ${p.key === activePill ? 'on' : ''}`}
                aria-pressed={p.key === activePill}
                onClick={() => onPillChange?.(p.key)}
              >
                {p.label}<span className="n">{p.count}</span>
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
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ))}
              {searchPlaceholder && (
                <input
                  className="inp"
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              )}
            </div>
          </div>
          <p className="cnt">
            <span>ⓘ</span> Showing <b>{filtered.length}</b> of <b>{denominator}</b> {noun}
          </p>
        </>
      )}

      <div className="tbl">
        <div className="tsc">
          <div style={{ minWidth }}>
            <div className="trow h" style={{ gridTemplateColumns: template }}>
              {columns.map((c) => <span key={c.label}>{c.label}</span>)}
            </div>
            <div className="tb">
              {filtered.length === 0 ? (
                <div className="empty"><span className="ei">☰</span><p>{emptyText}</p></div>
              ) : (
                filtered.map((r) => {
                  const interactive = !!r.onClick
                  return (
                    <div
                      key={r.key}
                      className={`trow ${interactive ? 'clickable' : ''}`}
                      style={{ gridTemplateColumns: template }}
                      {...(interactive && {
                        role: 'button',
                        tabIndex: 0,
                        onClick: r.onClick,
                        onKeyDown: (e: React.KeyboardEvent) => {
                          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); r.onClick?.() }
                        },
                      })}
                    >
                      {r.cells.map((cell, i) => <div className="cell" key={i}>{cell}</div>)}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
