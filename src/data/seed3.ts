/**
 * HRMS data — attendance, leave, payroll, petty cash, recruitment.
 * Ported from the prototype's HRMS blocks.
 *
 * ⚠ Payroll figures are the prototype's own. The prototype flags them itself:
 * "The arithmetic is right and the rates are current, but real TDS depends on
 * declarations, other income and prior employment. Have your provider confirm
 * before anyone is paid on these figures." That warning is carried through to
 * the UI rather than dropped.
 */
import { NOW, STAFF } from './seed'

/* ══════════ ATTENDANCE ══════════ */
export const ATT_MARK: Record<string, readonly [string, string]> = {
  p: ['Present', 'v'], wfh: ['Work from home', 'b'], leave: ['On leave', 'r'],
  lop: ['Unpaid', 'd'], off: ['Rest day', 'n'], hol: ['Holiday', 'n'],
}

export interface AttendanceRow {
  staffId: string
  present: number
  wfh: number
  leave: number
  unpaid: number
  lateMarks: number
  otHours: number
}

export const ATTENDANCE: AttendanceRow[] = STAFF.filter((s) => s.departments.length).map((s, i) => ({
  staffId: s.id,
  present: 20 - (i % 3),
  wfh: i % 4,
  leave: i % 3,
  unpaid: i === 7 ? 2 : 0,
  lateMarks: i % 5,
  otHours: (i % 4) * 2.5,
}))

export const WORKING_DAYS = 22

export const SITES = [
  { id: 'blr', name: 'Bengaluru — Koramangala', radiusM: 150 },
  { id: 'wfh', name: 'Work from home', radiusM: 0 },
]

export const TIME_CFG = {
  lateGraceMins: 10,
  restAfterMins: 300,
  restMins: 30,
  otAfterMins: 540,
  permissionsPerMonth: 2,
}

/* ══════════ LEAVE ══════════ */
export const LEAVE_STATUS: Record<string, readonly [string, string]> = {
  pending: ['Awaiting approval', 'r'], approved: ['Approved', 'v'],
  rejected: ['Declined', 'd'], cancelled: ['Cancelled', 'n'],
}

export const LEAVE_TYPES = [
  { key: 'cl', name: 'Casual leave', annual: 12, paid: true },
  { key: 'sl', name: 'Sick leave', annual: 12, paid: true },
  { key: 'el', name: 'Earned leave', annual: 15, paid: true },
  { key: 'lop', name: 'Loss of pay', annual: 0, paid: false },
]

export interface LeaveRequest {
  id: string
  staffId: string
  type: string
  from: Date
  to: Date
  days: number
  status: keyof typeof LEAVE_STATUS
  reason: string
}

const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000)

export const LEAVE: LeaveRequest[] = [
  { id: 'lv1', staffId: 'pd', type: 'sl', from: day(-2), to: day(2), days: 5, status: 'approved', reason: 'Fever, doctor advised rest' },
  { id: 'lv2', staffId: 'kv', type: 'cl', from: day(6), to: day(7), days: 2, status: 'pending', reason: 'Family function' },
  { id: 'lv3', staffId: 'sk', type: 'el', from: day(14), to: day(20), days: 7, status: 'pending', reason: 'Annual holiday' },
  { id: 'rj1', staffId: 'nr', type: 'cl', from: day(-9), to: day(-9), days: 1, status: 'rejected', reason: 'Short notice during month-end' },
  { id: 'lv4', staffId: 'ma', type: 'cl', from: day(-20), to: day(-19), days: 2, status: 'approved', reason: 'Personal' },
]

export const LEAVE_POLICY = {
  carryForwardMax: 10,
  noticeDays: 3,
  maxConsecutive: 15,
  deptCoverMin: 1,
}

/* ══════════ PAYROLL ══════════ */
export const RUN_STATE: Record<string, readonly [string, string, string]> = {
  draft: ['Draft', 'n', 'Nothing is committed. Figures move as attendance changes.'],
  locked: ['Locked', 'b', 'Attendance is frozen. Figures will not move.'],
  approved: ['Approved', 'r', 'Signed off, ready to pay.'],
  paid: ['Paid', 'v', 'Published. Payslips are visible to staff.'],
}

export const PAY_MONTHS = ['Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026']

export const RUN_STEPS: [string, string][] = [
  ['Attendance', 'Days present, paid leave and unpaid days for the month'],
  ['Earnings', 'Basic, HRA, allowances and overtime'],
  ['Deductions', 'Provident fund, ESI, professional tax and TDS'],
  ['Review', 'Check the register before locking'],
  ['Approve', 'Sign off — figures stop moving'],
  ['Publish', 'Payslips become visible to staff'],
]

export interface PayRun {
  month: string
  state: keyof typeof RUN_STATE
  headcount: number
  gross: number
  deductions: number
  net: number
}

/** Structure of pay, derived from CTC. Ratios are the prototype's. */
export function payslipFor(staffId: string) {
  const s = STAFF.find((x) => x.id === staffId)
  if (!s) return null
  // The prototype derives monthly pay from an annual CTC; capacity stands in here.
  const annual = 300_000 + s.capacity * 9_000
  const monthly = annual / 12
  const basic = Math.round(monthly * 0.5)
  const hra = Math.round(basic * 0.4)
  const special = Math.round(monthly - basic - hra)
  const gross = basic + hra + special
  // Statutory rates as the prototype states them — see the warning at the top.
  const pf = Math.round(Math.min(basic, 15_000) * 0.12)
  const esi = gross <= 21_000 ? Math.round(gross * 0.0075) : 0
  const pt = gross > 25_000 ? 200 : gross > 15_000 ? 150 : 0
  const tds = Math.round(Math.max(0, (annual - 75_000 - 400_000)) * 0.05 / 12)
  const deductions = pf + esi + pt + tds
  return { staff: s, annual, gross, basic, hra, special, pf, esi, pt, tds, deductions, net: gross - deductions }
}

export const PAY_RUNS: PayRun[] = PAY_MONTHS.map((month, i) => {
  const slips = STAFF.filter((s) => s.departments.length).map((s) => payslipFor(s.id)!)
  const gross = slips.reduce((a, p) => a + p.gross, 0)
  const deductions = slips.reduce((a, p) => a + p.deductions, 0)
  const states: (keyof typeof RUN_STATE)[] = ['paid', 'paid', 'paid', 'draft']
  return {
    month,
    state: states[i] ?? 'draft',
    headcount: slips.length,
    gross,
    deductions,
    net: gross - deductions,
  }
})

/* ══════════ PETTY CASH ══════════ */
export const PETTY_CFG = { float: 25_000, limit: 5_000, custodian: 'Harry Whitfield', countEvery: 'week' }

export interface PettyEntry {
  id: string
  date: Date
  description: string
  category: string
  amount: number
  kind: 'in' | 'out'
  by: string
}

export const PETTY: PettyEntry[] = [
  { id: 'p1', date: day(-1), description: 'Courier — deeds to Cambria County', category: 'Postage', amount: 420, kind: 'out', by: 'hw' },
  { id: 'p2', date: day(-3), description: 'Printer toner', category: 'Office', amount: 2_150, kind: 'out', by: 'hw' },
  { id: 'p3', date: day(-5), description: 'Float top-up', category: 'Top-up', amount: 10_000, kind: 'in', by: 'hw' },
  { id: 'p4', date: day(-6), description: 'Team refreshments', category: 'Welfare', amount: 1_680, kind: 'out', by: 'hw' },
  { id: 'p5', date: day(-9), description: 'County record copy fees', category: 'Search costs', amount: 3_400, kind: 'out', by: 'hw' },
  { id: 'p6', date: day(-12), description: 'Cab — client visit', category: 'Travel', amount: 890, kind: 'out', by: 'hw' },
]

export const pettyBalance = () =>
  PETTY_CFG.float + PETTY.reduce((a, e) => a + (e.kind === 'in' ? e.amount : -e.amount), 0)

/* ══════════ RECRUITMENT ══════════ */
export const HIRE_STAGES = ['Applied', 'Screened', 'Interview', 'Offer', 'Verification', 'Joined'] as const
export type HireStage = (typeof HIRE_STAGES)[number]

export interface Opening {
  id: string
  title: string
  department: string
  positions: number
  openedOn: Date
}

export const OPENINGS: Opening[] = [
  { id: 'o1', title: 'Title Searcher', department: 'Search', positions: 3, openedOn: day(-24) },
  { id: 'o2', title: 'Typist', department: 'Typing', positions: 2, openedOn: day(-16) },
  { id: 'o3', title: 'QC Reviewer', department: 'Search QC', positions: 1, openedOn: day(-8) },
]

export interface Candidate {
  id: string
  name: string
  openingId: string
  stage: HireStage
  appliedOn: Date
  note: string
}

export const CANDIDATES: Candidate[] = [
  { id: 'c1', name: 'Anitha Rao', openingId: 'o1', stage: 'Interview', appliedOn: day(-18), note: 'Three years at a competitor. Strong on PA counties.' },
  { id: 'c2', name: 'Vikram Shetty', openingId: 'o1', stage: 'Screened', appliedOn: day(-14), note: 'No title experience, good attention to detail.' },
  { id: 'c3', name: 'Deepa Menon', openingId: 'o1', stage: 'Offer', appliedOn: day(-21), note: 'Offer sent, awaiting response.' },
  { id: 'c4', name: 'Rahul Nair', openingId: 'o2', stage: 'Applied', appliedOn: day(-4), note: 'Typing speed test pending.' },
  { id: 'c5', name: 'Sneha Iyer', openingId: 'o2', stage: 'Verification', appliedOn: day(-30), note: 'Background check in progress.' },
  { id: 'c6', name: 'Manoj Pillai', openingId: 'o3', stage: 'Screened', appliedOn: day(-6), note: 'Five years QC. Wants a lead track.' },
]

/* ══════════ INTEGRATIONS ══════════ */
export const INTEGRATIONS = [
  { id: 'qualia', name: 'Qualia', category: 'Title production', status: 'Connected', desc: 'Order intake and delivery' },
  { id: 'resware', name: 'ResWare', category: 'Title production', status: 'Connect', desc: 'Order intake and delivery' },
  { id: 'softpro', name: 'SoftPro', category: 'Title production', status: 'Connect', desc: 'Closing and settlement' },
  { id: 'quickbooks', name: 'QuickBooks', category: 'Accounting', status: 'Connect', desc: 'Invoices and payments' },
  { id: 'stripe', name: 'Stripe', category: 'Payments', status: 'Connect', desc: 'Client card payments' },
  { id: 'gmail', name: 'Google Workspace', category: 'Email', status: 'Connected', desc: 'Order intake by email' },
  { id: 'slack', name: 'Slack', category: 'Notifications', status: 'Connect', desc: 'Alerts to a channel' },
  { id: 'dropbox', name: 'Dropbox', category: 'Documents', status: 'Connect', desc: 'Scanned search packages' },
]

/* ══════════ REPORT GENERATOR ══════════ */
export const REPORT_SECTIONS: [string, [string, string, string][]][] = [
  ['Property', [
    ['Address', '118 Sara Ln, Johnstown, PA 15905', ''],
    ['Parcel ID', '004-06-012.-000', ''],
    ['County', 'Cambria', ''],
    ['Legal description', 'Lot 14, Block 3, Hillcrest Addition', 'check'],
  ]],
  ['Vesting', [
    ['Current owner', 'Marcus T. Bell and Dana R. Bell', ''],
    ['Deed type', 'Warranty Deed', ''],
    ['Book/Page', '2214 / 0331', ''],
    ['Recorded', '06/14/2019', ''],
  ]],
  ['Encumbrances', [
    ['Mortgage', 'First National — $184,000', ''],
    ['Recorded', '06/14/2019', ''],
    ['Judgments', 'None found', ''],
    ['Tax status', 'Paid through 2025', 'check'],
  ]],
  ['Chain of title', [
    ['Prior deed', 'Book 1988 / Page 0114', ''],
    ['Prior owner', 'Hillcrest Development LLC', ''],
    ['Conveyed', '03/02/2011', ''],
  ]],
]

/* ══════════ ORDER INTAKE ══════════ */
export interface IntakeItem {
  id: string
  from: string
  subject: string
  received: Date
  client: string | null
  product: string | null
  property: string | null
  issue: string | null
}

export const INTAKE: IntakeItem[] = [
  { id: 'i1', from: 'orders@example.com', subject: 'New order — 118 Sara Ln', received: new Date(NOW.getTime() - 1_800_000),
    client: 'MGR', product: 'LIEN', property: '118 Sara Ln, Johnstown', issue: null },
  { id: 'i2', from: 'orders@example.com', subject: 'Rush: 42 Ridge Rd', received: new Date(NOW.getTime() - 5_400_000),
    client: 'MGR', product: 'COS', property: '42 Ridge Rd, Wilkes-Barre', issue: 'Possible duplicate of 4192033-2' },
  { id: 'i3', from: 'helpdesk@example.com', subject: 'Order request', received: new Date(NOW.getTime() - 9_000_000),
    client: 'CSS', product: null, property: '88 Elm St, West Haven', issue: 'No product named — needs a human' },
  { id: 'i4', from: 'unknown@example.com', subject: 'Fwd: title search', received: new Date(NOW.getTime() - 14_400_000),
    client: null, product: null, property: null, issue: 'Sender does not match any client' },
]
