/**
 * CSV export — a verbatim port of the original's toCSV / downloadCSV / dstamp.
 *
 * The original builds real client-side files rather than describing them: a BOM
 * so Excel opens UTF-8 correctly, CRLF row endings, and RFC-4180 quoting. It
 * keeps the last export in LASTCSV "so it can be checked", and it swallows a
 * failed download because the data is still built — both preserved here.
 */
import { NOW } from '@/data/seed'

export type CsvRow = (string | number | null | undefined)[]

/** The original's LASTCSV — kept so a caller (or a test) can read the last export. */
export let LASTCSV: { name: string; rows: CsvRow[]; csv: string } | null = null

/** RFC-4180: quote only when the value contains a comma, quote or newline. */
export function toCSV(rows: CsvRow[]): string {
  const q = (v: string | number | null | undefined) => {
    const t = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
  }
  return rows.map((r) => r.map(q).join(',')).join('\r\n')
}

/** `YYYY-MM-DD` from the app's frozen NOW — the original's dstamp(). */
const pad = (n: number) => String(n).padStart(2, '0')
export const dstamp = () =>
  `${NOW.getFullYear()}-${pad(NOW.getMonth() + 1)}-${pad(NOW.getDate())}`

/**
 * Builds the file and triggers the download, then toasts the row count.
 * Row count excludes the header, exactly as the original reports it.
 */
export function downloadCSV(
  name: string,
  rows: CsvRow[],
  toast?: (msg: string) => void,
): string {
  const csv = toCSV(rows)
  LASTCSV = { name, rows, csv }
  try {
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    document.body.appendChild(a)
    a.click()
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 0)
  } catch { /* no download in this environment — the data is still built */ }
  toast?.(`${name} — ${rows.length - 1} row${rows.length === 2 ? '' : 's'}`)
  return csv
}

/** The JSON sibling of downloadCSV — same download mechanics, no BOM. */
export function downloadJSON(name: string, text: string): void {
  LASTCSV = { name, rows: [], csv: text }
  try {
    const b = new Blob([text], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(b)
    a.download = name
    document.body.appendChild(a)
    a.click()
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 0)
  } catch { /* as above */ }
}
