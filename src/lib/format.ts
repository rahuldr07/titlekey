import { NOW } from '@/data/seed'

/* Date policy — ONE format everywhere. MM/DD/YYYY, US legal convention. */
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY'
const pad = (n: number) => String(n).padStart(2, '0')

export const fmtDate = (d: Date, f: DateFormat = 'MM/DD/YYYY') =>
  f === 'DD/MM/YYYY'
    ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
    : `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`

export const fmtTime = (d: Date) => {
  let h = d.getHours()
  const m = pad(d.getMinutes()), ap = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${m} ${ap}`
}
export const fmtDT = (d: Date) => `${fmtDate(d)} ${fmtTime(d)}`

export const money = (n: number) =>
  '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const inr = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })

export const initials = (n: string) =>
  n.split(/[\s.]+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase()

/** Matches the original dueCell(): late if past, soon if under 4h. */
export function dueInfo(d: Date, now: Date = NOW): { k: 'late' | 'soon' | 'ok'; rel: string } {
  const diff = (d.getTime() - now.getTime()) / 3_600_000
  const k = diff < 0 ? 'late' : diff < 4 ? 'soon' : 'ok'
  const rel = diff < 0 ? `${Math.abs(Math.round(diff))}h overdue`
    : diff < 24 ? `in ${Math.round(diff)}h` : `in ${Math.round(diff / 24)}d`
  return { k, rel }
}

export const hh = (h: number) => {
  const w = Math.floor(h), m = Math.round((h - w) * 60)
  return m ? `${w}h ${m}m` : `${w}h`
}
