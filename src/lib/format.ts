import { NOW } from '@/data/seed'

/**
 * Date policy — ONE format everywhere. MM/DD/YYYY, US legal convention.
 * Effective dates are legally material, so this is a single company-wide
 * setting rather than a per-screen choice.
 */
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY'

const pad = (n: number) => String(n).padStart(2, '0')

export const fmtDate = (d: Date, f: DateFormat = 'MM/DD/YYYY') =>
  f === 'DD/MM/YYYY'
    ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
    : `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`

export const fmtTime = (d: Date) => {
  let h = d.getHours()
  const m = pad(d.getMinutes())
  const ap = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${m} ${ap}`
}

export const fmtDateTime = (d: Date, f?: DateFormat) => `${fmtDate(d, f)} ${fmtTime(d)}`

export const money = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const initials = (n: string) =>
  n.split(/[\s.]+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase()

export type DueTone = 'late' | 'soon' | 'okd'

/** Matches the prototype's dueCell(): late if past, soon if under 4h. */
export function dueInfo(d: Date, now: Date = NOW): { tone: DueTone; relative: string } {
  const diff = (d.getTime() - now.getTime()) / 3_600_000
  const tone: DueTone = diff < 0 ? 'late' : diff < 4 ? 'soon' : 'okd'
  const relative =
    diff < 0 ? `${Math.abs(Math.round(diff))}h overdue`
    : diff < 24 ? `in ${Math.round(diff)}h`
    : `in ${Math.round(diff / 24)}d`
  return { tone, relative }
}

export const hoursShort = (h: number) => {
  const whole = Math.floor(h)
  const mins = Math.round((h - whole) * 60)
  return mins ? `${whole}h ${mins}m` : `${whole}h`
}
