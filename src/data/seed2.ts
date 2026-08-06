/**
 * Data for the Business, Reference and Insight screens.
 * Ported from the prototype's LEADS / INVOICES / COUNTIES / LINKTYPES blocks.
 */
import { NOW, hrs } from './seed'

/* ══════════ LEADS ══════════ */
export const LEAD_STATUS: Record<string, readonly [string, string]> = {
  new: ['New', 'b'], contacted: ['Contacted', 'r'], quoted: ['Quoted', 'r'],
  won: ['Won', 'v'], lost: ['Lost', 'd'],
}

/** Days without contact before a lead is flagged. */
export const STALE_WARN = 14
export const STALE_BAD = 30

export interface Lead {
  id: string
  company: string
  contact: string
  email: string
  phone: string
  state: string
  status: keyof typeof LEAD_STATUS
  volume: string
  lastContact: Date
  owner: string
  flagged: boolean
  note: string
}

const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000)

export const LEADS: Lead[] = [
  { id: 'l1', company: 'Cardinal Title Group', contact: 'Dana Whitmore', email: 'dana@example.com',
    phone: '(614) 555-0143', state: 'OH', status: 'quoted', volume: '~120/mo',
    lastContact: days(3), owner: 'hw', flagged: false,
    note: 'Wants 30-year searches in Franklin and Delaware counties. Sent pricing.' },
  { id: 'l2', company: 'Beacon Settlement Services', contact: 'Marcus Reilly', email: 'marcus@example.com',
    phone: '(215) 555-0188', state: 'PA', status: 'contacted', volume: '~40/mo',
    lastContact: days(18), owner: 'hw', flagged: true,
    note: 'Interested but slow to respond. Chase before month end.' },
  { id: 'l3', company: 'Harbor Point Abstract', contact: 'Erin Vasquez', email: 'erin@example.com',
    phone: '(410) 555-0166', state: 'MD', status: 'new', volume: 'unknown',
    lastContact: days(1), owner: 'hw', flagged: false,
    note: 'Inbound from the website. Not yet qualified.' },
  { id: 'l4', company: 'Summit Land Records', contact: 'Paul Okonkwo', email: 'paul@example.com',
    phone: '(303) 555-0121', state: 'CO', status: 'contacted', volume: '~75/mo',
    lastContact: days(34), owner: 'hw', flagged: false,
    note: 'Went quiet after the first call. Worth one more attempt.' },
  { id: 'l5', company: 'Trident National Title', contact: 'Simone Barrett', email: 'simone@example.com',
    phone: '(813) 555-0199', state: 'FL', status: 'won', volume: '~200/mo',
    lastContact: days(6), owner: 'hw', flagged: false,
    note: 'Signed. Onboarding starts next week — needs county coverage for Hillsborough.' },
  { id: 'l6', company: 'Ridgeline Closing Co', contact: 'Tom Hargrave', email: 'tom@example.com',
    phone: '(208) 555-0177', state: 'ID', status: 'lost', volume: '~30/mo',
    lastContact: days(22), owner: 'hw', flagged: false,
    note: 'Went with an in-house team. Revisit in six months.' },
]

export const daysSince = (d: Date) => Math.floor((NOW.getTime() - d.getTime()) / 86_400_000)

export const needsFollowUp = (l: Lead) =>
  l.status !== 'won' && l.status !== 'lost' && (l.flagged || daysSince(l.lastContact) >= STALE_WARN)

/* ══════════ INVOICES ══════════ */
export const INVOICE_STATUS: Record<string, readonly [string, string]> = {
  open: ['Open', 'b'], part: ['Part paid', 'r'], overdue: ['Overdue', 'd'], paid: ['Paid', 'v'],
}

export interface Invoice {
  id: string
  client: string
  code: string
  month: string
  issued: Date
  orders: number
  amount: number
  paid: number
  status: keyof typeof INVOICE_STATUS
}

export const INVOICES: Invoice[] = [
  { id: 'INV-2026-0431', client: 'MGR', code: 'MGR', month: 'Jul 2026', issued: days(12), orders: 318, amount: 21_904.50, paid: 21_904.50, status: 'paid' },
  { id: 'INV-2026-0432', client: 'CSS', code: 'CSS', month: 'Jul 2026', issued: days(12), orders: 141, amount: 4_089.00, paid: 2_000.00, status: 'part' },
  { id: 'INV-2026-0433', client: 'NJ', code: 'NJ', month: 'Jul 2026', issued: days(12), orders: 44, amount: 1_012.00, paid: 0, status: 'open' },
  { id: 'INV-2026-0418', client: 'MGR', code: 'MGR', month: 'Jun 2026', issued: days(43), orders: 292, amount: 19_318.00, paid: 19_318.00, status: 'paid' },
  { id: 'INV-2026-0419', client: 'CSS', code: 'CSS', month: 'Jun 2026', issued: days(43), orders: 128, amount: 3_712.00, paid: 0, status: 'overdue' },
  { id: 'INV-2026-0420', client: 'Morris James', code: 'MJ', month: 'Jun 2026', issued: days(43), orders: 6, amount: 348.00, paid: 348.00, status: 'paid' },
  { id: 'INV-2026-0405', client: 'MGR', code: 'MGR', month: 'May 2026', issued: days(74), orders: 274, amount: 18_002.00, paid: 18_002.00, status: 'paid' },
  { id: 'INV-2026-0406', client: 'NTC', code: 'NTC', month: 'May 2026', issued: days(74), orders: 4, amount: 92.00, paid: 0, status: 'overdue' },
]

/* ══════════ COUNTY COVERAGE ══════════ */
export const LINK_TYPES = [
  { key: 'deeds', name: 'Deeds' },
  { key: 'tax', name: 'Tax' },
  { key: 'court', name: 'Court' },
  { key: 'gis', name: 'GIS' },
]

export const LINK_STATE: Record<string, readonly [string, string]> = {
  ok: ['Working', 'v'], broken: ['Not responding', 'd'], moved: ['Moved', 'r'],
  auth: ['Needs a login', 'r'], slow: ['Very slow', 'r'], none: ['No link', 'n'],
}

export interface County {
  name: string
  state: string
  indexFrom: number | null
  links: Record<string, { url: string; status: keyof typeof LINK_STATE }>
}

const L = (url: string, status: keyof typeof LINK_STATE) => ({ url, status })

export const COUNTIES: County[] = [
  { name: 'Cambria', state: 'PA', indexFrom: 1960, links: {
    deeds: L('https://recorder.cambriacounty.example/search', 'ok'),
    tax: L('https://tax.cambriacounty.example', 'ok'),
    court: L('https://prothonotary.cambriacounty.example', 'slow'),
    gis: L('https://gis.cambriacounty.example', 'ok') } },
  { name: 'Luzerne', state: 'PA', indexFrom: 1955, links: {
    deeds: L('https://records.luzernecounty.example', 'ok'),
    tax: L('https://tax.luzernecounty.example', 'broken'),
    court: L('https://courts.luzernecounty.example', 'ok'),
    gis: L('', 'none') } },
  { name: 'West Haven', state: 'CT', indexFrom: 1972, links: {
    deeds: L('https://landrecords.westhaven.example', 'auth'),
    tax: L('https://tax.westhaven.example', 'ok'),
    court: L('', 'none'), gis: L('https://gis.westhaven.example', 'ok') } },
  { name: 'Killingworth', state: 'CT', indexFrom: 1968, links: {
    deeds: L('https://clerk.killingworth.example', 'ok'),
    tax: L('https://tax.killingworth.example', 'ok'),
    court: L('', 'none'), gis: L('', 'none') } },
  { name: 'Williamson', state: 'TN', indexFrom: 1968, links: {
    deeds: L('https://register.williamsontn.example', 'ok'),
    tax: L('https://trustee.williamsontn.example', 'ok'),
    court: L('https://circuitclerk.williamsontn.example', 'ok'),
    gis: L('https://gis.williamsontn.example', 'moved') } },
  { name: 'McIntosh', state: 'GA', indexFrom: 1980, links: {
    deeds: L('https://gsccca.example/mcintosh', 'ok'),
    tax: L('https://tax.mcintoshga.example', 'slow'),
    court: L('', 'none'), gis: L('', 'none') } },
  { name: 'Boyd', state: 'KY', indexFrom: 1965, links: {
    deeds: L('https://boydcountyclerk.example', 'ok'),
    tax: L('https://sheriff.boydky.example', 'ok'),
    court: L('https://courts.ky.example/boyd', 'broken'),
    gis: L('https://gis.boydky.example', 'ok') } },
  { name: 'Palmer', state: 'AK', indexFrom: null, links: {
    deeds: L('https://dnr.alaska.example/recorder/palmer', 'ok'),
    tax: L('', 'none'), court: L('', 'none'), gis: L('', 'none') } },
]

export const BAD_LINK_STATES = ['broken', 'moved', 'auth', 'slow']

export const brokenLinks = () =>
  COUNTIES.flatMap((c) =>
    LINK_TYPES
      .filter((t) => BAD_LINK_STATES.includes(c.links[t.key]?.status ?? 'none'))
      .map((t) => ({ county: c, type: t, link: c.links[t.key]! })),
  )

export const LINK_CHECK = {
  everyDays: 3,
  lastRun: hrs(-48),
  notify: 'admins' as const,
}
