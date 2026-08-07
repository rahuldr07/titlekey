/**
 * Data ported VERBATIM from title-crm-897/project/Title CRM (original).html.
 * Names, numbers, copy and structure match the original. Identity-document
 * fields carry the same redacted placeholders as the committed reference copy.
 */

/* ══════════ clock ══════════ */
export const TZ = 'ET'
export const TZ2 = 'IST'
/** Mon Aug 3 2026, 5:30 PM ET — fixed clock, end of the working day. */
export const NOW = new Date(2026, 7, 3, 17, 30)
export const hrs = (h: number) => new Date(NOW.getTime() + h * 3_600_000)
export const days = (d: Date) => Math.floor((NOW.getTime() - d.getTime()) / 86_400_000)

/* ══════════ tenant ══════════ */
export interface Tenant { id: string; name: string; plan: string; state: string }
export const TENANTS: Tenant[] = [
  { id: 'ka', name: 'Keystone Abstract', plan: 'Professional · 12 seats', state: 'PA' },
  { id: 'ps', name: 'Peach State Abstract', plan: 'Professional · 8 seats', state: 'GA' },
  { id: 'bg', name: 'Bluegrass Title Svc', plan: 'Starter · 4 seats', state: 'KY' },
]

/* ══════════ departments ══════════ */
export interface Department {
  id: string; n: string; desc: string; auto: boolean; pair: string | null; qc: boolean
}
export const DEPTLIST: Department[] = [
  { id: 'search', n: 'Search',    desc: 'Title search',                 auto: true,  pair: null,     qc: false },
  { id: 'sqc',    n: 'Search QC', desc: 'Check the search',             auto: true,  pair: 'Search', qc: true },
  { id: 'typing', n: 'Typing',    desc: 'Data entry',                   auto: true,  pair: null,     qc: false },
  { id: 'tqc',    n: 'Typing QC', desc: 'Check the typing',             auto: true,  pair: 'Typing', qc: true },
  { id: 'rts',    n: 'RTS',       desc: 'Ready to send — final upload', auto: true,  pair: null,     qc: false },
  { id: 'docreq', n: 'Doc Req',   desc: 'Chasing a missing document',   auto: false, pair: null,     qc: false },
]
export const STAGES = DEPTLIST.map((d) => d.n)
export const ASSIGN_STAGES = DEPTLIST.filter((d) => d.auto).map((d) => d.n)
export const PAIRS: Record<string, string> = Object.fromEntries(
  DEPTLIST.filter((d) => d.pair).map((d) => [d.n, d.pair as string]),
)

/* ══════════ permissions & roles ══════════ */
export interface Perm { k: string; n: string; sys?: boolean; never?: boolean }
export const PERMS: Perm[] = [
  { k: 'own', n: 'See orders assigned to them', sys: true },
  { k: 'all', n: 'See every order', sys: true },
  { k: 'assign', n: 'Assign work', sys: true },
  { k: 'pricing', n: 'See pricing and invoices', sys: true },
  { k: 'qc', n: 'Enter QC ratings', sys: true },
  { k: 'config', n: 'Edit SLA, workflow, rules and link types', sys: true },
  { k: 'people', n: 'Manage staff, roles and departments', sys: true },
  { k: 'export', n: 'Export company data', sys: true },
  { k: 'override', n: 'Override a blocking rule', sys: true, never: true },
]
export const ADMIN_FLOOR = ['people', 'config']
export interface Role { id: string; n: string; desc: string; lock?: boolean; p: string[] }
export const ROLELIST: Role[] = [
  { id: 'staff', n: 'Staff', desc: 'Works the orders assigned to them', lock: true, p: ['own', 'qc'] },
  { id: 'lead', n: 'Lead', desc: 'Runs a department — sees everything, gives the work out',
    p: ['own', 'all', 'assign', 'qc'] },
  { id: 'admin', n: 'Company admin', desc: 'Everything except overriding a blocking rule', lock: true,
    p: ['own', 'all', 'assign', 'pricing', 'qc', 'config', 'people', 'export'] },
]
export const roleName = (id: string) => (ROLELIST.find((r) => r.id === id) || { n: 'Staff' }).n

/* ══════════ order statuses ══════════ */
export const STATUS: Record<string, readonly [string, string]> = {
  search: ['Search', '#3B82F6'], wip: ['WIP', '#6366F1'], sq: ['Search QC', '#8B5CF6'],
  typing: ['Typing', '#A855F7'], tqc: ['Typing QC', '#C026D3'], rts: ['RTS', '#06B6D4'],
  upload: ['Upload', '#10B981'], sent: ['Sent', '#0F7B4F'], hold: ['Hold', '#F97316'],
  docreq: ['Doc Req', '#EAB308'], fee: ['Fee Approval', '#F59E0B'], eff: ['Eff Date', '#EC4899'],
  clar: ['Clarification', '#14B8A6'], canc: ['Canceled', '#94A3B8'],
}
export const st = (k: string) => STATUS[k]?.[0] ?? k
export const stColor = (k: string) => STATUS[k]?.[1] ?? '#94A3B8'

/* ══════════ staff — the original 28, HR fields as redacted in the reference ══════════ */
const RMOB = '+91 00000 00000', RADDR = 'Address redacted, Bengaluru'
const RAAD = '0000 0000 0000', RDOB = '01/01/1990', RPAN = 'AAAPA0000A'
const RUAN = '000000000000', RESI = '0000000000'
const RBANK = (name: string) => ({ acct: '00000000000', ifsc: 'XXXX0000000', name })

export interface Staff {
  id: string; n: string; dep: string[]; r: string; cap: number; open: number
  avail: 'ok' | 'leave' | 'shift'; active: boolean; conflict?: boolean
  leaving?: Date; ctc: number; shift: string; mob: string; addr: string
  emg: { n: string; rel: string; mob: string }
  aadhaar: string; doj: string; dob: string; pan: string; uan: string; esicNo: string
  bank: { acct: string; ifsc: string; name: string }; e: string
}
const P = (
  id: string, n: string, dep: string[], r: string, cap: number, open: number,
  avail: Staff['avail'], ctc: number, shift: string, doj: string,
  emgN: string, emgRel: string, extra?: Partial<Staff>,
): Staff => ({
  id, n, dep, r, cap, open, avail, active: true, ctc, shift,
  mob: RMOB, addr: RADDR, emg: { n: emgN, rel: emgRel, mob: RMOB },
  aadhaar: RAAD, doj, dob: RDOB, pan: RPAN, uan: RUAN, esicNo: RESI,
  bank: RBANK(n), e: `${n.toLowerCase().replace(/[^a-z]+/g, '.')}@keystoneabstract.com`,
  ...extra,
})

export const STAFF: Staff[] = [
  // Search — 8 people, one on leave. Room 95 against 90 needed.
  P('us', 'Uma Sankar', ['Search'], 'staff', 19, 5, 'ok', 340000, 'us', '11/12/2024', 'Prakash Sankar', 'Sister'),
  P('sm', 'Sathya Moorthy', ['Search'], 'staff', 20, 6, 'ok', 314000, 'us', '08/20/2020', 'Ravi Moorthy', 'Father'),
  P('dn', 'Devendra N', ['Search'], 'staff', 18, 4, 'ok', 323000, 'us', '04/09/2024', 'Prakash N', 'Mother'),
  P('ap', 'Asha P', ['Search'], 'staff', 17, 3, 'ok', 320000, 'us', '08/07/2023', 'Meera P', 'Father'),
  P('rm', 'Rajesh M', ['Search'], 'staff', 15, 2, 'ok', 310000, 'us', '02/10/2021', 'Sunitha M', 'Spouse'),
  P('kv', 'Kavitha V', ['Search'], 'staff', 18, 4, 'ok', 317000, 'us', '04/24/2025', 'Anitha V', 'Mother'),
  P('sr', 'Suresh R', ['Search'], 'staff', 15, 3, 'ok', 330000, 'us', '09/20/2025', 'Anitha R', 'Father'),
  P('pd', 'Prasad M D', ['Search'], 'staff', 14, 9, 'leave', 330000, 'us', '11/17/2020', 'Ravi D', 'Sister'),
  // Search QC — 5. Room 94.
  P('jr', 'JP Ramesh', ['Search QC'], 'staff', 25, 6, 'ok', 518000, 'day', '09/13/2022', 'Girish Ramesh', 'Mother'),
  P('sn', 'Satheesh N', ['Search QC'], 'staff', 24, 5, 'ok', 461000, 'day', '08/20/2021', 'Sunitha N', 'Mother'),
  P('ma', 'Mamatha A', ['Search QC'], 'staff', 23, 4, 'ok', 451000, 'day', '02/14/2020', 'Ravi A', 'Brother'),
  P('kb', 'Keerthi B', ['Search QC'], 'staff', 22, 3, 'ok', 446000, 'day', '01/22/2023', 'Meera B', 'Mother'),
  P('ln', 'Lalitha N', ['Search QC'], 'staff', 20, 2, 'ok', 509000, 'day', '09/05/2022', 'Girish N', 'Spouse'),
  // Typing — the bottleneck. Room 78 against 90 needed, and one person off shift.
  P('sk', 'Ashok S', ['Typing', 'Typing QC'], 'lead', 18, 4, 'ok', 725000, 'day', '08/20/2020', 'Prakash S', 'Sister', { conflict: true }),
  P('pn', 'Pavan Kumar', ['Typing'], 'staff', 16, 3, 'ok', 279000, 'day', '12/18/2024', 'Prakash Kumar', 'Sister'),
  P('dk', 'Dilli Kumari', ['Typing'], 'staff', 22, 9, 'ok', 285000, 'day', '03/08/2021', 'Sunitha Kumari', 'Sister'),
  P('dp', 'Dilli Prasad', ['Typing'], 'staff', 15, 2, 'ok', 300000, 'day', '04/09/2020', 'Ravi Prasad', 'Sister'),
  P('hs', 'Harika S', ['Typing'], 'staff', 16, 3, 'ok', 321000, 'day', '07/21/2025', 'Anitha S', 'Father'),
  P('bn', 'Bhavani N', ['Typing'], 'staff', 15, 3, 'ok', 288000, 'day', '02/17/2020', 'Ravi N', 'Spouse'),
  P('jb', 'Jyotheesh B', ['Typing'], 'staff', 14, 4, 'shift', 276000, 'day', '06/12/2024', 'Prakash B', 'Father'),
  // Typing QC — 3 plus Ashok, whose capacity is shared with Typing.
  P('md', 'Damodaran M', ['Typing QC'], 'staff', 34, 5, 'ok', 441000, 'day', '03/15/2023', 'Meera M', 'Father'),
  P('ur', 'Uma Reddy', ['Typing QC'], 'staff', 35, 6, 'ok', 464000, 'day', '10/12/2023', 'Meera Reddy', 'Brother'),
  P('sv', 'Sirisha V', ['Typing QC'], 'staff', 32, 4, 'ok', 473000, 'day', '10/20/2023', 'Meera V', 'Spouse'),
  // RTS — 3. Room 92.
  P('gk', 'Gowthami K', ['RTS'], 'staff', 37, 6, 'ok', 279000, 'early', '11/11/2024', 'Prakash K', 'Mother'),
  P('nb', 'Neil Barrow', ['RTS'], 'staff', 39, 8, 'ok', 274000, 'early', '09/25/2020', 'Ravi Barrow', 'Spouse', { leaving: new Date(2026, 7, 12) }),
  P('tr', 'Tara R', ['RTS'], 'staff', 35, 5, 'ok', 288000, 'early', '04/02/2024', 'Prakash R', 'Mother'),
  // Doc Req — one person, and on leave today.
  P('vs', 'Vikki Sankar', ['Doc Req'], 'staff', 18, 11, 'leave', 354000, 'day', '05/22/2023', 'Meera Sankar', 'Spouse'),
  P('hw', 'Harry Whitfield', [], 'admin', 0, 0, 'ok', 1363000, 'day', '08/22/2021', 'Meera Whitfield', 'Spouse'),
]
export const who = (id: string | null | undefined) => (STAFF.find((s) => s.id === id) || { n: '—' }).n
export const AVAIL: Record<string, readonly [string, string]> = {
  ok: ['Available', 'v'], leave: ['On leave', 'd'], shift: ['Off shift', 'r'],
}
/** "An Aadhaar number shown in full to anyone with the page open is a liability." */
export const maskAadhaar = (a: string) =>
  a ? 'XXXX XXXX ' + String(a).replace(/\s/g, '').slice(-4) : ''

/* ══════════ products ══════════ */
export interface Product { id: string; n: string; fee: number; h: number }
export const PRODUCTS: Product[] = [
  { id: 'COS', n: 'Current Owner Search', fee: 21, h: 24 },
  { id: 'TOS', n: 'Two Owner Search', fee: 29, h: 24 },
  { id: 'Update', n: 'Update / bring-down', fee: 18, h: 24 },
  { id: 'PRLP', n: 'Legal & Vesting', fee: 29, h: 24 },
  { id: 'LIEN', n: 'Lien Search', fee: 23, h: 24 },
  { id: '10Y', n: '10 year search', fee: 24, h: 24 },
  { id: '20Y', n: '20 year search', fee: 30, h: 24 },
  { id: '30Y', n: '30 year search', fee: 34, h: 48 },
  { id: '40Y', n: '40 year search', fee: 40, h: 48 },
  { id: 'FS+', n: 'Full search plus', fee: 48, h: 48 },
]
export const prod = (id: string) => PRODUCTS.find((p) => p.id === id) || PRODUCTS[0]!

/* ══════════ clients ══════════ */
export interface Client {
  n: string; dn: string; orders: number; inv: number; total: number; paid: number
  e: string; p: string; terms: string; active: boolean
}
export const CLIENTS: Client[] = [
  { n: 'MGR', dn: 'MGR', orders: 1436, inv: 1113, total: 99613.58, paid: 73382.59,
    e: 'orders@example.com', p: '(412) 555-0110', terms: 'Net 30', active: true },
  { n: 'CSS', dn: 'CSS', orders: 812, inv: 790, total: 21852.0, paid: 10046.0,
    e: 'helpdesk@example.com', p: '(614) 555-0182', terms: 'Net 30', active: true },
  { n: 'NJ', dn: 'NJ', orders: 214, inv: 214, total: 3540.02, paid: 1905.02,
    e: '', p: '', terms: 'Net 30', active: true },
  { n: 'Morris James', dn: 'MJ', orders: 18, inv: 16, total: 1066.0, paid: 495.0,
    e: 'contact@example.com', p: '(302) 555-0100', terms: 'Net 15', active: true },
  { n: 'NTC', dn: 'NTC', orders: 9, inv: 9, total: 123.0, paid: 53.0,
    e: '', p: '', terms: 'Per order', active: true },
]

/* ══════════ orders ══════════ */
export interface Order {
  id: string; cl: string; pr: string; stt: string; st: string; co: string; prop: string
  a: Record<string, string | null>; due: Date; recv: Date; fee: number; age: string
  done?: boolean; flag?: string
}
const A = (a: Partial<Record<string, string | null>>): Record<string, string | null> => ({
  Search: null, 'Search QC': null, Typing: null, 'Typing QC': null, 'Doc Req': null, RTS: null, ...a,
})
export const ORDERS: Order[] = [
  { id: '4192254-2', cl: 'MGR', pr: 'LIEN', stt: 'search', st: 'PA', co: 'Cambria',
    prop: '118 Sara Ln, Johnstown', a: A({}), due: hrs(-6), recv: hrs(-30), fee: 23, age: '6h in Search' },
  { id: '4192033-2', cl: 'MGR', pr: 'LIEN', stt: 'sq', st: 'PA', co: 'Luzerne',
    prop: '42 Ridge Rd, Wilkes-Barre', a: A({ Search: 'us', 'Search QC': 'jr', Typing: 'sk' }),
    due: hrs(-2), recv: hrs(-26), fee: 23, age: '3h in Search QC' },
  { id: '4192337-1', cl: 'MGR', pr: 'PRLP', stt: 'search', st: 'CT', co: 'West Haven',
    prop: '88 Elm St, West Haven', a: A({ Search: 'vs', 'Search QC': 'sn', Typing: 'pn' }),
    due: hrs(2), recv: hrs(-22), fee: 29, age: '2h in Search' },
  { id: '4192345-1', cl: 'MGR', pr: 'PRLP', stt: 'typing', st: 'CT', co: 'Killingworth',
    prop: '12 Roast Meat Hill Rd', a: A({ Search: 'vs', 'Search QC': 'sn', Typing: 'sk' }),
    due: hrs(5), recv: hrs(-19), fee: 29, age: '1h in Typing' },
  { id: '4192361-1', cl: 'CSS', pr: 'PRLP', stt: 'docreq', st: 'AK', co: 'Palmer',
    prop: '2201 Bogard Rd, Wasilla',
    a: A({ Search: 'sm', 'Search QC': 'jr', Typing: 'pn', 'Doc Req': 'vs' }),
    due: hrs(9), recv: hrs(-15), fee: 29, age: '11h in Doc Req', flag: 'Waiting on client — clock paused' },
  { id: '4192321-1', cl: 'CSS', pr: 'TOS', stt: 'tqc', st: 'TN', co: 'Williamson',
    prop: '1194 Faxon Ave, Franklin',
    a: A({ Search: 'us', 'Search QC': 'jr', Typing: 'dk', 'Typing QC': 'md' }),
    due: hrs(14), recv: hrs(-10), fee: 34, age: '2h in Typing QC' },
  { id: '4192401-1', cl: 'NJ', pr: 'COS', stt: 'wip', st: 'GA', co: 'McIntosh',
    prop: '2099 Susie Baker Rd NE', a: A({ Search: 'dn' }),
    due: hrs(21), recv: hrs(-3), fee: 21, age: '3h in WIP' },
  { id: '4192410-1', cl: 'MGR', pr: 'Update', stt: 'sent', st: 'KY', co: 'Boyd',
    prop: '307 Honchell Hill Rd',
    a: A({ Search: 'us', 'Search QC': 'sn', Typing: 'dk', 'Typing QC': 'md', RTS: 'gk' }),
    due: hrs(-40), recv: hrs(-64), fee: 18, age: 'Delivered', done: true },
]
export const PASTDUE = ORDERS.filter((o) => !o.done && o.due < NOW).length
export const ATRISK_COUNT = ORDERS.filter(
  (o) => !o.done && o.due >= NOW && (o.due.getTime() - NOW.getTime()) / 3_600_000 < 4,
).length
export const OPEN = ORDERS.filter((o) => !o.done).length
