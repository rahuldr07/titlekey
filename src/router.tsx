import {
  createRootRoute, createRoute, createRouter, Outlet,
} from '@tanstack/react-router'
import { Shell } from '@/components/Shell'
import { Dashboard } from '@/routes/Dashboard'
import { Orders } from '@/routes/Orders'
import { OrderDetail } from '@/routes/OrderDetail'
import { Placeholder } from '@/routes/Placeholder'

const rootRoute = createRootRoute({
  component: () => <Shell />,
  notFoundComponent: () => (
    <Placeholder title="That page is not here" sub="The link may be out of date." source="—" />
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute, path: '/', component: Dashboard,
})

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute, path: '/orders', component: () => <Outlet />,
})

const ordersIndexRoute = createRoute({
  getParentRoute: () => ordersRoute,
  path: '/',
  component: Orders,
  validateSearch: (s: Record<string, unknown>): { filter?: string } => ({
    filter: typeof s.filter === 'string' ? s.filter : undefined,
  }),
})

const orderDetailRoute = createRoute({
  getParentRoute: () => ordersRoute, path: '$orderId', component: OrderDetail,
})

/**
 * Screens still to be ported from the prototype. Declared individually rather
 * than mapped, so each path stays a literal in the route tree — that is what
 * gives `<Link to>` and `navigate()` full type-checking across the whole app.
 *
 * `source` names the render function in the original HTML.
 */
const stub = <P extends string>(path: P, title: string, sub: string, source: string) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path,
    component: () => <Placeholder title={title} sub={sub} source={source} />,
  })

const myWorkRoute   = stub('/my-work', 'My work', 'The orders on your desk right now.', 'S.mywork')
const myPayRoute    = stub('/my-pay', 'My payslips', 'Your payslips, month by month.', 'S.mypay')
const myPerfRoute   = stub('/my-perf', "How I'm doing", 'Your throughput and quality against the team.', 'S.myperf')
const assignRoute   = stub('/assign', 'Assignment', 'Auto-assign, then review the exceptions.', 'S.assign')
const intakeRoute   = stub('/intake', 'Order intake', 'What arrived, and what to do with it.', 'S.intake')
const repgenRoute   = stub('/repgen', 'Report generator', 'Capture the abstract, section by section.', 'S.repgen')
const leadsRoute    = stub('/leads', 'Leads', 'Prospects and who needs following up.', 'S.leads')
const billingRoute  = stub('/billing', 'Invoicing', 'What has been invoiced and what is outstanding.', 'S.billing')
const attendRoute   = stub('/attendance', 'Attendance', 'Punches, breaks, overtime and regularisations.', 'S.attend')
const leaveRoute    = stub('/leave', 'Leave', 'Requests, balances and cover.', 'S.leave')
const payrollRoute  = stub('/payroll', 'Payroll', 'The monthly run, step by step.', 'S.payroll')
const payslipsRoute = stub('/payslips', 'Payslips', 'Published payslips for the company.', 'S.payslips')
const hiringRoute   = stub('/hiring', 'Recruitment', 'Openings and candidates.', 'S.hiring')
const pettyRoute    = stub('/petty', 'Petty cash', 'The float, the ledger and the count.', 'S.petty')
const countiesRoute = stub('/counties', 'County coverage', 'Where records come from, county by county.', 'S.counties')
const linkRoute     = stub('/linkcheck', 'Link monitor', 'County sources, and which ones stopped working.', 'S.linkcheck')
const reportsRoute  = stub('/reports', 'Reports', 'Received, assigned, turnaround, workload, quality.', 'S.reports')
const integRoute    = stub('/integrations', 'Integrations', 'What this connects to.', 'S.integ')
const companyRoute  = stub('/company', 'Company', 'Staff, clients, departments, roles, workflow, SLA.', 'S.company')

const routeTree = rootRoute.addChildren([
  indexRoute,
  ordersRoute.addChildren([ordersIndexRoute, orderDetailRoute]),
  myWorkRoute, myPayRoute, myPerfRoute, assignRoute, intakeRoute, repgenRoute,
  leadsRoute, billingRoute, attendRoute, leaveRoute, payrollRoute, payslipsRoute,
  hiringRoute, pettyRoute, countiesRoute, linkRoute, reportsRoute, integRoute,
  companyRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
