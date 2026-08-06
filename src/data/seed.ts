/**
 * Demo data, ported from the prototype (title-crm-897/project/Title CRM (original).html).
 *
 * The prototype pins a fixed clock at Mon 3 Aug 2026 17:30 ET and derives every
 * due date from it, so "6h overdue" always reads the same. That is preserved —
 * see NOW below.
 */
import type { Client, Department, Order, Product, Role, Staff, Tenant } from './types'

/** Fixed clock — Mon 3 Aug 2026, 5:30 PM ET, end of the working day. */
export const NOW = new Date(2026, 7, 3, 17, 30)
export const hrs = (h: number) => new Date(NOW.getTime() + h * 3_600_000)

export const TZ = 'ET'
export const TZ2 = 'IST'
/** Offset applied to the primary clock for the secondary readout. */
export const TZ2_OFFSET_HOURS = 9.5

export const TENANTS: Tenant[] = [
  { id: 'ka', name: 'Keystone Abstract', plan: 'Professional · 12 seats', state: 'PA' },
  { id: 'ps', name: 'Peach State Abstract', plan: 'Professional · 8 seats', state: 'GA' },
  { id: 'bg', name: 'Bluegrass Title Svc', plan: 'Starter · 4 seats', state: 'KY' },
]

export const DEPARTMENTS: Department[] = [
  { id: 'search', name: 'Search',    desc: 'Title search',                 auto: true,  pair: null,     qc: false },
  { id: 'sqc',    name: 'Search QC', desc: 'Check the search',             auto: true,  pair: 'Search', qc: true  },
  { id: 'typing', name: 'Typing',    desc: 'Data entry',                   auto: true,  pair: null,     qc: false },
  { id: 'tqc',    name: 'Typing QC', desc: 'Check the typing',             auto: true,  pair: 'Typing', qc: true  },
  { id: 'rts',    name: 'RTS',       desc: 'Ready to send — final upload', auto: true,  pair: null,     qc: false },
  { id: 'docreq', name: 'Doc Req',   desc: 'Chasing a missing document',   auto: false, pair: null,     qc: false },
]

export const STAGES = DEPARTMENTS.map((d) => d.name)
export const ASSIGN_STAGES = DEPARTMENTS.filter((d) => d.auto).map((d) => d.name)
export const PAIRS: Record<string, string> = Object.fromEntries(
  DEPARTMENTS.filter((d) => d.pair).map((d) => [d.name, d.pair as string]),
)

/** Order status → [label, pipeline colour]. */
export const STATUS: Record<string, readonly [string, string]> = {
  search: ['Search', '#3B82F6'],   wip:    ['WIP', '#6366F1'],
  sq:     ['Search QC', '#8B5CF6'], typing: ['Typing', '#A855F7'],
  tqc:    ['Typing QC', '#C026D3'], rts:    ['RTS', '#06B6D4'],
  upload: ['Upload', '#10B981'],    sent:   ['Sent', '#0F7B4F'],
  hold:   ['Hold', '#F97316'],      docreq: ['Doc Req', '#EAB308'],
  fee:    ['Fee Approval', '#F59E0B'], eff: ['Eff Date', '#EC4899'],
  clar:   ['Clarification', '#14B8A6'], canc: ['Canceled', '#94A3B8'],
}

export const statusLabel = (k: string) => STATUS[k]?.[0] ?? k
export const statusColor = (k: string) => STATUS[k]?.[1] ?? '#94A3B8'

export const ROLES: Role[] = [
  { id: 'staff', name: 'Staff', desc: 'Works the orders assigned to them', locked: true,
    permissions: ['own', 'qc'] },
  { id: 'lead', name: 'Lead', desc: 'Runs a department — sees everything, gives the work out',
    permissions: ['own', 'all', 'assign', 'qc'] },
  { id: 'admin', name: 'Company admin', desc: 'Everything except overriding a blocking rule', locked: true,
    permissions: ['own', 'all', 'assign', 'pricing', 'qc', 'config', 'people', 'export'] },
]

export const roleName = (id: string) => ROLES.find((r) => r.id === id)?.name ?? 'Staff'

export const PRODUCTS: Product[] = [
  { id: 'COS',    name: 'Current Owner Search', fee: 21, slaHours: 24 },
  { id: 'TOS',    name: 'Two Owner Search',     fee: 29, slaHours: 24 },
  { id: 'Update', name: 'Update / bring-down',  fee: 18, slaHours: 24 },
  { id: 'PRLP',   name: 'Legal & Vesting',      fee: 29, slaHours: 24 },
  { id: 'LIEN',   name: 'Lien Search',          fee: 23, slaHours: 24 },
  { id: '10Y',    name: '10 year search',       fee: 24, slaHours: 24 },
  { id: '20Y',    name: '20 year search',       fee: 30, slaHours: 24 },
  { id: '30Y',    name: '30 year search',       fee: 34, slaHours: 48 },
  { id: '40Y',    name: '40 year search',       fee: 40, slaHours: 48 },
  { id: 'FS+',    name: 'Full search plus',     fee: 48, slaHours: 48 },
]

const mk = (
  id: string, name: string, departments: string[], capacity: number,
  open: number, availability: StaffAvail = 'ok', role: Staff['role'] = 'staff',
): Staff => ({
  id, name, departments, capacity, open, availability, role, active: true,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@keystoneabstract.com`,
})
type StaffAvail = Staff['availability']

export const STAFF: Staff[] = [
  mk('hw', 'Harry Whitfield', [], 0, 0, 'ok', 'admin'),
  // Search — 8 people, one on leave.
  mk('us', 'Uma Sankar', ['Search'], 19, 5),
  mk('sm', 'Sathya Moorthy', ['Search'], 20, 6),
  mk('dn', 'Devendra N', ['Search'], 18, 4),
  mk('ap', 'Asha P', ['Search'], 17, 3),
  mk('rm', 'Rajesh M', ['Search'], 15, 2),
  mk('kv', 'Kavitha V', ['Search'], 18, 4),
  mk('sr', 'Suresh R', ['Search'], 15, 3),
  mk('pd', 'Prasad M D', ['Search'], 14, 9, 'leave'),
  // Search QC — 5.
  mk('jr', 'JP Ramesh', ['Search QC'], 25, 6, 'ok', 'lead'),
  mk('sn', 'Satheesh N', ['Search QC'], 24, 5),
  mk('ma', 'Mamatha A', ['Search QC'], 23, 4),
  mk('kb', 'Keerthi B', ['Search QC'], 22, 3),
  mk('ln', 'Lalitha N', ['Search QC'], 20, 2),
  // Typing — the bottleneck.
  mk('sk', 'Shilpa K', ['Typing'], 16, 7),
  mk('dk', 'Dilli Kumari', ['Typing'], 16, 6),
  mk('pn', 'Pavan Kumar', ['Typing'], 15, 8),
  mk('vs', 'Vinay S', ['Typing'], 14, 5, 'shift'),
  mk('nr', 'Nandini R', ['Typing'], 17, 4),
  // Typing QC.
  mk('md', 'Manjula D', ['Typing QC'], 18, 4),
  mk('rb', 'Ramya B', ['Typing QC'], 18, 3),
  mk('gp', 'Girish P', ['Typing QC'], 16, 5),
  // RTS.
  mk('gk', 'Gowthami K', ['RTS'], 30, 4),
  mk('hn', 'Harish N', ['RTS'], 28, 3),
  // Doc Req.
  mk('ps2', 'Priyanka S', ['Doc Req'], 12, 2),
]

export const staffName = (id: string | null | undefined) =>
  STAFF.find((s) => s.id === id)?.name ?? '—'

export const CLIENTS: Client[] = [
  { name: 'MGR', displayCode: 'MGR', orders: 1436, invoiced: 1113, total: 99613.58, paid: 73382.59,
    email: 'orders@example.com', phone: '(412) 555-0110', terms: 'Net 30', active: true },
  { name: 'CSS', displayCode: 'CSS', orders: 812, invoiced: 790, total: 21852.0, paid: 10046.0,
    email: 'helpdesk@example.com', phone: '(614) 555-0182', terms: 'Net 30', active: true },
  { name: 'NJ', displayCode: 'NJ', orders: 214, invoiced: 214, total: 3540.02, paid: 1905.02,
    email: '', phone: '', terms: 'Net 30', active: true },
  { name: 'Morris James', displayCode: 'MJ', orders: 18, invoiced: 16, total: 1066.0, paid: 495.0,
    email: 'contact@example.com', phone: '(302) 555-0100', terms: 'Net 15', active: true },
  { name: 'NTC', displayCode: 'NTC', orders: 9, invoiced: 9, total: 123.0, paid: 53.0,
    email: '', phone: '', terms: 'Per order', active: true },
]

const A = (a: Partial<Record<string, string | null>>): Record<string, string | null> => ({
  Search: null, 'Search QC': null, Typing: null, 'Typing QC': null, 'Doc Req': null, RTS: null, ...a,
})

export const ORDERS: Order[] = [
  { id: '4192254-2', client: 'MGR', product: 'LIEN', status: 'search', state: 'PA', county: 'Cambria',
    property: '118 Sara Ln, Johnstown', assignments: A({}),
    dueAt: hrs(-6), receivedAt: hrs(-30), fee: 23, age: '6h in Search', promiseHours: 24 },
  { id: '4192033-2', client: 'MGR', product: 'LIEN', status: 'sq', state: 'PA', county: 'Luzerne',
    property: '42 Ridge Rd, Wilkes-Barre', assignments: A({ Search: 'us', 'Search QC': 'jr', Typing: 'sk' }),
    dueAt: hrs(-2), receivedAt: hrs(-26), fee: 23, age: '3h in Search QC', promiseHours: 24 },
  { id: '4192337-1', client: 'MGR', product: 'PRLP', status: 'search', state: 'CT', county: 'West Haven',
    property: '88 Elm St, West Haven', assignments: A({ Search: 'vs', 'Search QC': 'sn', Typing: 'pn' }),
    dueAt: hrs(2), receivedAt: hrs(-22), fee: 29, age: '2h in Search', promiseHours: 24 },
  { id: '4192345-1', client: 'MGR', product: 'PRLP', status: 'typing', state: 'CT', county: 'Killingworth',
    property: '12 Roast Meat Hill Rd', assignments: A({ Search: 'vs', 'Search QC': 'sn', Typing: 'sk' }),
    dueAt: hrs(5), receivedAt: hrs(-19), fee: 29, age: '1h in Typing', promiseHours: 24 },
  { id: '4192361-1', client: 'CSS', product: 'PRLP', status: 'docreq', state: 'AK', county: 'Palmer',
    property: '2201 Bogard Rd, Wasilla',
    assignments: A({ Search: 'sm', 'Search QC': 'jr', Typing: 'pn', 'Doc Req': 'vs' }),
    dueAt: hrs(9), receivedAt: hrs(-15), fee: 29, age: '11h in Doc Req',
    flag: 'Waiting on client — clock paused', promiseHours: 24 },
  { id: '4192321-1', client: 'CSS', product: 'TOS', status: 'tqc', state: 'TN', county: 'Williamson',
    property: '1194 Faxon Ave, Franklin',
    assignments: A({ Search: 'us', 'Search QC': 'jr', Typing: 'dk', 'Typing QC': 'md' }),
    dueAt: hrs(14), receivedAt: hrs(-10), fee: 34, age: '2h in Typing QC', promiseHours: 24 },
  { id: '4192401-1', client: 'NJ', product: 'COS', status: 'wip', state: 'GA', county: 'McIntosh',
    property: '2099 Susie Baker Rd NE', assignments: A({ Search: 'dn' }),
    dueAt: hrs(21), receivedAt: hrs(-3), fee: 21, age: '3h in WIP', promiseHours: 24 },
  { id: '4192410-1', client: 'MGR', product: 'Update', status: 'sent', state: 'KY', county: 'Boyd',
    property: '307 Honchell Hill Rd',
    assignments: A({ Search: 'us', 'Search QC': 'sn', Typing: 'dk', 'Typing QC': 'md', RTS: 'gk' }),
    dueAt: hrs(-40), receivedAt: hrs(-64), fee: 18, age: 'Delivered', done: true, promiseHours: 24 },
]
