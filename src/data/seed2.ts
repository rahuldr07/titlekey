/**
 * Leads, counties/links, SLA, budget, invoices, QC, rules, integrations —
 * all ported VERBATIM from the original file.
 */
import { CLIENTS, NOW, hrs } from './seed'

/* ══════════ LEADS — the original six ══════════ */
export const LSTATUS: Record<string, readonly [string, string]> = {
  new: ['New', 'n'], contacted: ['Contacted', 'b'], interested: ['Interested', 'r'],
  notnow: ['Not now', 'n'], won: ['Won', 'v'], lost: ['Lost', 'd'],
}
export const STALE_WARN = 14
export const STALE_BAD = 30
const daysAgo = (d: Date) => Math.floor((NOW.getTime() - d.getTime()) / 86_400_000)

export interface LeadContact { n: string; role: string; e: string; p: string; main?: boolean }
export interface LeadNote { w: string; at: Date; t: string }
export interface Lead {
  id: string; co: string; loc: string; st: string; own: string; flag: boolean
  contacts: LeadContact[]; notes: LeadNote[]
}
export const LEADS: Lead[] = [
  { id: 'l1', co: 'Vanderbilt American Title', loc: 'Houston, TX', st: 'contacted', own: 'hw', flag: true,
    contacts: [
      { n: 'Dana Sterling', role: 'Orders desk', e: 'orders@vandytitle.com', p: '281.895.1100', main: true },
      { n: 'Marcus Vane', role: 'Operations manager', e: 'mvane@vandytitle.com', p: '281.895.1104' }],
    notes: [
      { w: 'hw', at: hrs(-24 * 97), t: 'Sent intro email with our TX county list and a sample two-owner report.' },
      { w: 'hw', at: hrs(-24 * 90), t: 'Dana replied — they use two vendors in TX and are unhappy with turnaround on the Gulf counties. Asked what we quote for Harris and Galveston.' },
      { w: 'hw', at: hrs(-24 * 88), t: 'Quoted COS $21 / TOS $29, 24h including weekends. Said she would take it to Marcus.' }] },
  { id: 'l2', co: 'Maverick Title of Texas', loc: 'Dallas, TX', st: 'interested', own: 'hw', flag: true,
    contacts: [{ n: 'Sandra Voss', role: 'Owner', e: 'DST@mavsign.com', p: '(877) 708-4383', main: true }],
    notes: [
      { w: 'hw', at: hrs(-24 * 97), t: 'Cold email — no reply.' },
      { w: 'hw', at: hrs(-24 * 41), t: 'Called. Sandra runs it herself, about 40 searches a month, all DFW. Currently in-house but losing a searcher next month.' },
      { w: 'hw', at: hrs(-24 * 36), t: 'Sent a sample report and the DFW coverage sheet. She said to check back once her searcher leaves.' }] },
  { id: 'l3', co: 'Barrett Chase LLP', loc: 'Philadelphia, PA', st: 'contacted', own: 'hw', flag: false,
    contacts: [
      { n: 'Heather Spitz', role: 'Client relations', e: 'hspitz@bc-lawfirm.com', p: '855-204-0203', main: true },
      { n: 'Alan Chase', role: 'Partner', e: 'achase@bc-lawfirm.com', p: '855-204-0207' },
      { n: 'Ruth Ibarra', role: 'Paralegal — places the orders', e: 'ribarra@bc-lawfirm.com', p: '855-204-0219' }],
    notes: [
      { w: 'hw', at: hrs(-24 * 18), t: 'Heather made contact through the website. Firm does residential closings across south-east PA.' },
      { w: 'hw', at: hrs(-24 * 16), t: 'Call with Heather and Ruth. Ruth places the orders, Alan signs. Around 25 a month, mostly current-owner.' },
      { w: 'hw', at: hrs(-24 * 11), t: 'Sent sample plus Allegheny and Montgomery coverage. Ruth asked whether we can match their existing format — said yes, we learn it from three samples.' }] },
  { id: 'l4', co: 'FNTI', loc: '—', st: 'new', own: 'hw', flag: false,
    contacts: [{ n: '—', role: 'Vendor team inbox', e: 'vendorteam@fnti.com', p: '', main: true }],
    notes: [{ w: 'hw', at: hrs(-24 * 18), t: 'Cold email sent to the vendor team address. Nothing back yet.' }] },
  { id: 'l5', co: 'Ridgeline Title Services', loc: 'Boise, ID', st: 'notnow', own: 'hw', flag: false,
    contacts: [{ n: 'Owen Pratt', role: 'Managing partner', e: 'opratt@ridgelinetitle.com', p: '(208) 555-0142', main: true }],
    notes: [
      { w: 'hw', at: hrs(-24 * 63), t: 'Referred by a Keystone contact.' },
      { w: 'hw', at: hrs(-24 * 58), t: 'Owen is locked into a contract until March. Asked to be picked up again in Q1.' }] },
  { id: 'l6', co: 'Cascade Abstract Co', loc: 'Portland, OR', st: 'lost', own: 'hw', flag: false,
    contacts: [{ n: 'Priya Raman', role: 'Operations', e: 'praman@cascadeabstract.com', p: '(503) 555-0188', main: true }],
    notes: [
      { w: 'hw', at: hrs(-24 * 74), t: 'Good first call — 60 a month across OR and WA.' },
      { w: 'hw', at: hrs(-24 * 52), t: 'Lost. Went with an incumbent who dropped their price. Priya said to try again at renewal in about a year.' }] },
]
export const lastTouch = (l: Lead) => l.notes.reduce((a, n) => (n.at > a ? n.at : a), l.notes[0]!.at)
export const leadAge = (l: Lead) => daysAgo(lastTouch(l))
export const isStale = (l: Lead) => !['won', 'lost', 'notnow'].includes(l.st) && leadAge(l) >= STALE_WARN
export const needsFollowUp = (l: Lead) => !['won', 'lost'].includes(l.st) && (l.flag || isStale(l))
export const FOLLOWUP = () => LEADS.filter(needsFollowUp).length

/* ══════════ COUNTIES — the original eleven ══════════ */
export interface CountyLink { u: string; s: string; err?: string; since?: Date }
export interface County { n: string; st: string; idx: number | null; links: Record<string, CountyLink> }
const L = (u: string, s: string, extra?: Partial<CountyLink>): CountyLink => ({ u, s, ...extra })

export const COUNTIES: County[] = [
  { n: 'Cambria', st: 'PA', idx: 1994, links: {
    recorder: L('cambriacountypa-web.tylerhost.net/web/search', 'ok'),
    assessor: L('cambriapa.maps.arcgis.com/apps/webappviewer', 'ok'),
    judgment: L('ujsportal.pacourts.us/CaseSearch', 'ok'),
    tax: L('', 'none') } },
  { n: 'Luzerne', st: 'PA', idx: 1990, links: {
    recorder: L('luzernecounty.landrecords.net/search', 'ok'),
    assessor: L('luzernecounty.org/assessment', 'ok'),
    judgment: L('ujsportal.pacourts.us/CaseSearch', 'ok'),
    tax: L('luzernecounty.org/taxclaim', 'ok') } },
  { n: 'Allegheny', st: 'PA', idx: 1994, links: {
    recorder: L('alleghenycounty.us/RealEstate/Search', 'broken', { err: '404 — page no longer exists', since: hrs(-24 * 5) }),
    assessor: L('alleghenycounty.us/assessment', 'ok'),
    judgment: L('ujsportal.pacourts.us/CaseSearch', 'ok'),
    tax: L('alleghenycounty.us/taxes', 'slow', { err: 'Took 14s to respond', since: hrs(-24 * 2) }) } },
  { n: 'McIntosh', st: 'GA', idx: null, links: {
    recorder: L('', 'none'),
    assessor: L('qpublic.net/ga/mcintosh', 'ok'),
    judgment: L('gasuperiorcourt.us/search', 'ok'),
    tax: L('mcintoshcountytax.com', 'ok') } },
  { n: 'Fulton', st: 'GA', idx: 1999, links: {
    recorder: L('search.gsccca.org/RealEstate', 'ok'),
    assessor: L('fultonassessor.org', 'moved', { err: 'Redirects to fultoncountyga.gov/assessor', since: hrs(-24 * 2) }),
    judgment: L('search.gsccca.org/Lien', 'ok'),
    tax: L('fultoncountytaxes.org', 'ok') } },
  { n: 'Boyd', st: 'KY', idx: 1994, links: {
    recorder: L('boydcountyclerk.com/records', 'ok'),
    assessor: L('qpublic.net/ky/boyd', 'ok'),
    judgment: L('kcoj.kycourts.net/CourtRecords', 'ok'),
    tax: L('boydcountysheriff.com/taxes', 'ok') } },
  { n: 'Shelby', st: 'TN', idx: 1988, links: {
    recorder: L('register.shelby.tn.us/search', 'ok'),
    assessor: L('assessormelvinburgess.com', 'ok'),
    judgment: L('gs.shelbycountytn.gov/caseSearch', 'auth', { err: 'Now asks for a login', since: hrs(-24 * 8) }),
    tax: L('shelbycountytrustee.com', 'ok') } },
  { n: 'Williamson', st: 'TN', idx: 1996, links: {
    recorder: L('williamsoncounty-tn.gov/register', 'ok'),
    assessor: L('williamsonpropertyassessor.com', 'ok'),
    judgment: L('tncourts.gov/search', 'ok'),
    tax: L('williamsonpropertytax.com', 'ok') } },
  { n: 'West Haven', st: 'CT', idx: 1997, links: {
    recorder: L('westhaven-ct.gov/townclerk', 'ok'),
    assessor: L('westhaven-ct.gov/assessor', 'ok'),
    judgment: L('civilinquiry.jud.ct.gov', 'ok'),
    tax: L('westhaven-ct.gov/taxcollector', 'unchecked') } },
  { n: 'Killingworth', st: 'CT', idx: 2001, links: {
    recorder: L('killingworthct.com/townclerk', 'ok'),
    assessor: L('killingworthct.com/assessor', 'broken', { err: 'Connection timed out', since: hrs(-24 * 11) }),
    judgment: L('civilinquiry.jud.ct.gov', 'ok'),
    tax: L('killingworthct.com/taxcollector', 'ok') } },
  { n: 'Palmer', st: 'AK', idx: null, links: {
    recorder: L('', 'none'),
    assessor: L('matsugov.us/assessments', 'ok'),
    judgment: L('courtrecords.alaska.gov', 'ok'),
    tax: L('', 'none') } },
]

export interface LinkType { k: string; n: string; req: boolean; note: string }
export const LINKTYPES: LinkType[] = [
  { k: 'recorder', n: 'Recorder', req: true, note: 'Deeds and mortgages as recorded' },
  { k: 'assessor', n: 'Assessor', req: true, note: 'Parcel, owner of record, assessed value' },
  { k: 'judgment', n: 'Judgment', req: true, note: 'Court and lien search' },
  { k: 'tax', n: 'Tax', req: true, note: 'Collector — amounts, status, payment history' },
]
export const LSTATE: Record<string, readonly [string, string]> = {
  ok: ['Working', 'v'], slow: ['Slow', 'r'], moved: ['Moved', 'r'],
  auth: ['Login required', 'r'], broken: ['Not working', 'd'],
  none: ['No link on file', 'n'], unchecked: ['Never checked', 'n'],
}
export const LINKCHECK = { every: 3, last: hrs(-24 * 2), running: false, notify: 'admins' }
export const nextCheck = () => new Date(LINKCHECK.last.getTime() + LINKCHECK.every * 86_400_000)
export const BADSTATES = ['broken', 'moved', 'auth', 'slow']
export const allLinks = () =>
  COUNTIES.flatMap((c) => LINKTYPES.map((t) => ({ c, k: t.k, lbl: t.n, l: c.links[t.k]! })))
export const brokenLinks = () => allLinks().filter((x) => BADSTATES.includes(x.l.s))

/* ══════════ TIERS / SLA / CLOCK / BUDGET ══════════ */
export const TIERS = [
  { id: 'standard', n: 'Standard', mult: 1, up: 0 },
  { id: 'priority', n: 'Priority', mult: 0.5, up: 4 },
  { id: 'rush', n: 'Rush', mult: 0.25, up: 9 },
]
/** SLA table — client × product → turnaround hours. THE numbers are placeholders. */
export const SLA = [
  { cl: 'MGR', pr: 'LIEN', h: 24 }, { cl: 'MGR', pr: 'PRLP', h: 24 }, { cl: 'MGR', pr: 'Update', h: 24 },
  { cl: 'CSS', pr: 'PRLP', h: 24 }, { cl: 'CSS', pr: 'TOS', h: 24 }, { cl: 'CSS', pr: 'COS', h: 48 },
  { cl: 'NJ', pr: 'COS', h: 24 }, { cl: '—  (default)', pr: 'Any', h: 24 },
]
export const isDefaultRule = (r: { cl: string }) => r.cl.startsWith('—')
export const CLOCK = {
  start: 'email', run: '247', tz: 'ET',
  pause: { 'Doc Req': true, 'Fee Approval': true, Clarification: true, 'Eff Date': true,
    Hold: true, Search: false, Typing: false } as Record<string, boolean>,
}
/** Shares are a PERCENTAGE of the clock. A buffer is held back at the end. */
export const BUDGET = {
  buffer: 10,
  base: { Search: 50, 'Search QC': 11, Typing: 25, 'Typing QC': 10, RTS: 4 } as Record<string, number>,
  over: [
    { pr: '40Y', shares: { Search: 62, 'Search QC': 10, Typing: 18, 'Typing QC': 7, RTS: 3 } as Record<string, number> },
    { pr: 'FS+', shares: { Search: 60, 'Search QC': 10, Typing: 20, 'Typing QC': 7, RTS: 3 } as Record<string, number> },
  ],
}
export const sharesFor = (pr: string) => BUDGET.over.find((x) => x.pr === pr)?.shares ?? BUDGET.base

/* ══════════ INVOICES — generated exactly as the original does ══════════ */
export const MONTHS = ['Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026']
const MWEIGHT = [0.14, 0.16, 0.15, 0.19, 0.22, 0.14]
export const r2 = (n: number) => Math.round(n * 100) / 100

export interface Invoice {
  id: string; cl: string; code: string; m: string; mi: number; amt: number; paid: number
  orders: number; issued: Date; st: string
}
function makeInvoices(): Invoice[] {
  const out: Invoice[] = []
  let n = 401
  CLIENTS.filter((c) => c.total > 0).forEach((c) => {
    let alloc = 0, paidLeft = c.paid
    MONTHS.forEach((m, i) => {
      const amt = i === MONTHS.length - 1 ? r2(c.total - alloc) : r2(c.total * MWEIGHT[i]!)
      alloc = r2(alloc + amt)
      const paid = r2(Math.min(amt, paidLeft))
      paidLeft = r2(paidLeft - paid)
      out.push({
        id: `INV-2026-0${n++}`, cl: c.n, code: c.dn, m, mi: i, amt, paid,
        orders: Math.max(1, Math.round(c.orders * MWEIGHT[i]!)),
        issued: new Date(2026, 2 + i, 1),
        st: amt === 0 ? 'paid' : paid >= amt ? 'paid' : paid > 0 ? 'part' : i <= 3 ? 'overdue' : 'open',
      })
    })
  })
  return out
}
export const INVOICES = makeInvoices()
export const ISTATUS: Record<string, readonly [string, string]> = {
  open: ['Open', 'b'], part: ['Part paid', 'r'], overdue: ['Overdue', 'd'], paid: ['Paid', 'v'],
}

/* ══════════ QC — the original scale and rules ══════════ */
export const QCSCALE: [number, string, string][] = [
  [1, 'Critical', 'd'], [2, 'Non critical', 'r'], [3, 'MIS', 'r'], [4, 'Average', 'b'], [5, 'Good', 'v'],
]
export interface QcRule { k: string; n: string; on: boolean; d: string; cost: string }
export const QCRULES: QcRule[] = [
  { k: 'mand', n: 'A rating is required before an order can be marked Sent', on: true,
    d: 'Closes the gap where a third of delivered work was never rated.',
    cost: 'Without it, a third of deliveries go out unchecked and every average on the Quality report is drawn from the rest.' },
  { k: 'self', n: 'A person cannot QC a stage they performed', on: true,
    d: 'Ashok S is in both Typing and Typing QC, so he is filtered out of QC on orders he typed.',
    cost: 'Without it, people can sign off their own work and the QC score stops meaning anything.' },
  { k: 'note', n: 'A score of 1 or 2 requires a comment', on: true,
    d: 'A defect with no explanation teaches nobody anything.',
    cost: 'Without it, defects become numbers with no reason attached — the thing the Quality report leads with disappears.' },
  { k: 'see', n: 'Scores are visible to the person rated', on: true,
    d: 'On. Each person sees their own ratings and the practice that prevents each defect. Turn off only if ratings are kept for filing rather than coaching.',
    cost: 'With it off, people are measured against something they cannot see, which is the fastest way to make a quality score resented rather than useful.' },
  { k: 'field', n: 'Defects also attach to the field and page', on: true,
    d: 'This is what makes the data useful for fixing the process rather than ranking people.',
    cost: 'Without it, you can see who made a mistake but not where it keeps happening.' },
]
export const QCCRIT: [string, string][] = [
  ['Accuracy', 'Do the typed values match the instrument?'],
  ['Completeness', 'Is everything the search found present?'],
  ['Formatting', 'Does the report follow the template?'],
]

/* ══════════ ASSIGNMENT RULES — the original eight ══════════ */
export interface Rule {
  id: string; n: string; k: string; on: boolean; lock?: boolean
  when: string; then: string; cond?: { product?: string; stage?: string; state?: string }; pool?: string[]
}
export const COVSTAGES = ['Search', 'Search QC']
export const RULES: Rule[] = [
  { id: 'r1', n: 'Department membership', k: 'block', lock: true, on: true,
    when: 'always', then: 'Only a member of that stage’s department may take it' },
  { id: 'r2', n: 'Availability', k: 'block', on: true,
    when: 'always', then: 'Skip anyone on leave or off shift' },
  { id: 'r3', n: 'Daily target', k: 'block', on: true,
    when: 'always', then: 'Never load anyone past their target' },
  { id: 'r4', n: 'Self-review', k: 'block', lock: true, on: true,
    when: 'stage is a QC stage', then: 'Never the person who did the paired stage' },
  { id: 'r5', n: 'LIEN typing group', k: 'route', on: true,
    when: 'product is LIEN and stage is Typing', then: 'Only Ashok S · Pavan Kumar · Bhavani N',
    cond: { product: 'LIEN', stage: 'Typing' }, pool: ['sk', 'pn', 'bn'] },
  { id: 'r6', n: 'State and county coverage', k: 'cover', on: true,
    when: `stage is ${COVSTAGES.join(' or ')}`, then: 'Only someone who covers that state, and that county if counties were named' },
  { id: 'r7', n: 'Product coverage', k: 'cover', on: true,
    when: `stage is ${COVSTAGES.join(' or ')}`, then: 'Only someone who works that product' },
  { id: 'r8', n: 'Fill the emptiest first', k: 'prefer', lock: true, on: true,
    when: 'always', then: 'Pick whoever is furthest below their target' },
]

/* ══════════ INTEGRATIONS — the original six ══════════ */
export const INTEGRATIONS: [string, string, string, string][] = [
  ['✉', 'Gmail / Outlook', 'Watch a mailbox and turn incoming orders into drafts.', 'Connected'],
  ['◧', 'Titleflow marketplace', 'Take orders from the Titleflow network straight into this workspace, and deliver back without re-keying.', 'Connect'],
  ['$', 'QuickBooks', 'Push invoices and payments into your ledger.', 'Connect'],
  ['⚡', 'Zapier', 'Triggers on order created, delivered and past due.', 'Connect'],
  ['💬', 'Slack', 'Past-due and delivery notices into a channel.', 'Connect'],
  ['◈', 'County portal credentials', 'Store per-county logins so searchers do not keep their own list.', 'Set up'],
]

/* ══════════ WHO CAN WORK WHAT — coverage levels ══════════
   Nobody searches every state and nobody types every product. A level is a
   coverage envelope; somebody with no level is NOT restricted, because
   defaulting the other way would mean a new person can do nothing. */
export interface Level {
  id: string; n: string; note: string
  states: string[] | 'all'
  counties: Record<string, string[]>
  products: string[] | 'all'
}
export const LEVELS: Level[] = [
  { id: 'l1', n: 'Level 1',
    note: 'Learning. Current owner searches in the counties they have been shown.',
    states: ['PA', 'GA'], counties: { PA: ['Cambria', 'Luzerne'] }, products: ['COS'] },
  { id: 'l2', n: 'Level 2',
    note: 'Confident on the standard products across the states we work most.',
    states: ['PA', 'GA', 'CT', 'KY', 'TN'], counties: {},
    products: ['COS', 'TOS', 'Update', 'PRLP', 'LIEN', '10Y', '20Y'] },
  { id: 'l3', n: 'Level 3',
    note: 'Everything, including the long searches and the courthouse states.',
    states: 'all', counties: {}, products: 'all' },
]
export const NOLIMIT = { states: 'all' as const, counties: {}, products: 'all' as const }
