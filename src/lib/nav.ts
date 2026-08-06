import type { Permission } from '@/data/types'

export interface NavItem {
  label: string
  path: string
  icon: string
  /** Permission required to see it. `null` = anyone signed in. */
  needs: Permission | null
  /** Extra rule beyond the permission, matching the prototype's visibleNav(). */
  rule?: 'not-admin' | 'does-work' | 'not-pricing'
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

/** Ported from the prototype's NAV + NAVPERM. */
export const NAV: NavGroup[] = [
  {
    label: 'Production',
    items: [
      { label: 'My work',          path: '/my-work',   icon: '◱', needs: null, rule: 'not-admin' },
      { label: 'My payslips',      path: '/my-pay',    icon: '₹', needs: null, rule: 'not-pricing' },
      { label: "How I'm doing",    path: '/my-perf',   icon: '★', needs: null, rule: 'does-work' },
      { label: 'Dashboard',        path: '/',          icon: '◱', needs: 'all' },
      { label: 'Orders',           path: '/orders',    icon: '☰', needs: null },
      { label: 'Assignment',       path: '/assign',    icon: '⇄', needs: 'assign' },
      { label: 'Order intake',     path: '/intake',    icon: '✉', needs: 'all' },
      { label: 'Report generator', path: '/repgen',    icon: '✎', needs: null },
    ],
  },
  {
    label: 'Business',
    items: [
      { label: 'Leads',     path: '/leads',   icon: '◎', needs: 'pricing' },
      { label: 'Invoicing', path: '/billing', icon: '$', needs: 'pricing' },
    ],
  },
  {
    label: 'HRMS',
    items: [
      { label: 'Attendance',  path: '/attendance', icon: '◷', needs: 'all' },
      { label: 'Leave',       path: '/leave',      icon: '◎', needs: null },
      { label: 'Payroll',     path: '/payroll',    icon: '₹', needs: 'pricing' },
      { label: 'Payslips',    path: '/payslips',   icon: '▤', needs: 'pricing' },
      { label: 'Recruitment', path: '/hiring',     icon: '⊕', needs: 'people' },
      { label: 'Petty cash',  path: '/petty',      icon: '◫', needs: 'pricing' },
    ],
  },
  {
    label: 'Reference',
    items: [
      { label: 'County coverage', path: '/counties',  icon: '◈', needs: null },
      { label: 'Link monitor',    path: '/linkcheck', icon: '◉', needs: null },
    ],
  },
  { label: 'Insight', items: [{ label: 'Reports', path: '/reports', icon: '▤', needs: 'all' }] },
  {
    label: 'Configure',
    items: [
      { label: 'Integrations', path: '/integrations', icon: '⚯', needs: 'config' },
      { label: 'Company',      path: '/company',      icon: '⚙', needs: 'people' },
    ],
  },
]

interface VisibilityInput {
  can: (p: Permission | null) => boolean
  worksInDepartment: boolean
}

/** Mirrors the prototype's visibleNav() special cases exactly. */
export function visibleNav({ can, worksInDepartment }: VisibilityInput): NavGroup[] {
  return NAV.map((g) => ({
    ...g,
    items: g.items.filter((item) => {
      // Leads and admins use the dashboard, not the personal queue.
      if (item.rule === 'not-admin') return !can('all')
      // Only people who actually do the work have a performance page.
      if (item.rule === 'does-work') return worksInDepartment
      // Payroll people use the run itself, not their own payslip list.
      if (item.rule === 'not-pricing') return !can('pricing')
      return can(item.needs)
    }),
  })).filter((g) => g.items.length > 0)
}
