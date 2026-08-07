/** Ported from the original NAV + NAVPERM + visibleNav(). Same groups, same items, same icons. */
export interface NavItem { label: string; path: string; icon: string }
export interface NavGroup { l: string; t: NavItem[] }
const I = (label: string, path: string, icon: string): NavItem => ({ label, path, icon })

export const NAV: NavGroup[] = [
  { l: 'Production', t: [
    I('My work', '/my-work', '◱'),
    I('My payslips', '/my-pay', '₹'),
    I('How I’m doing', '/my-perf', '★'),
    I('Dashboard', '/', '◱'),
    I('Orders', '/orders', '☰'),
    I('Assignment', '/assign', '⇄'),
    I('Order intake', '/intake', '✉'),
    I('Report generator', '/repgen', '✎'),
  ] },
  { l: 'Business', t: [I('Leads', '/leads', '◎'), I('Invoicing', '/billing', '$')] },
  { l: 'HRMS', t: [
    I('Attendance', '/attendance', '◷'),
    I('Leave', '/leave', '◎'),
    I('Payroll', '/payroll', '₹'),
    I('Payslips', '/payslips', '▤'),
    I('Recruitment', '/hiring', '⊕'),
    I('Petty cash', '/petty', '◫'),
  ] },
  { l: 'Reference', t: [I('County coverage', '/counties', '◈'), I('Link monitor', '/linkcheck', '◉')] },
  { l: 'Insight', t: [I('Reports', '/reports', '▤')] },
  { l: 'Configure', t: [I('Integrations', '/integrations', '⚯'), I('Company', '/company', '⚙')] },
]

const NAVPERM: Record<string, string | null> = {
  '/assign': 'assign', '/intake': 'all', '/billing': 'pricing', '/leads': 'pricing',
  '/reports': 'all', '/integrations': 'config', '/company': 'people', '/': 'all',
  '/my-work': null, '/repgen': null, '/orders': null, '/counties': null, '/linkcheck': null,
  '/my-perf': null, '/my-pay': null, '/payroll': 'pricing', '/payslips': 'pricing',
  '/attendance': 'all', '/leave': null, '/hiring': 'people', '/petty': 'pricing',
}
export const routeNeeds = (path: string) => NAVPERM[path] ?? null

interface Vis { can: (p: string) => boolean; worksInDepartment: boolean }

/** Mirrors the original visibleNav() special cases exactly. */
export function visibleNav({ can, worksInDepartment }: Vis): NavGroup[] {
  return NAV.map((g) => ({
    ...g,
    t: g.t.filter((t) => {
      if (t.path === '/my-work') return !can('all')       // leads and admins use the dashboard
      if (t.path === '/my-perf') return worksInDepartment // only people who do the work
      if (t.path === '/my-pay') return !can('pricing')    // payroll people use the run itself
      if (t.path === '/') return can('all')
      const need = NAVPERM[t.path]
      return !need || can(need)
    }),
  })).filter((g) => g.t.length > 0)
}
