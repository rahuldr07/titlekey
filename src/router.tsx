/**
 * All 39 routable screens from the original, including its 8 ALIAS routes,
 * which resolve to a tab of another screen exactly as the original's ALIAS map
 * does. Routes are declared individually so every path stays a literal and
 * navigate()/<Link to> are type-checked.
 */
import { lazy } from 'react'
import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router'
import { Shell } from '@/components/Shell'
import { Dashboard } from '@/routes/Dashboard'
import { Denied } from '@/routes/Denied'

/* Route-level code splitting. The shell, Dashboard and the not-found screen
   stay in the entry chunk because they are on the critical path; everything
   else is fetched on demand. defaultPreload: 'intent' warms a route's chunk on
   hover, so navigation still feels instant while the first load ships less. */
const Orders       = lazy(() => import('@/routes/Orders').then(m => ({ default: m.Orders })))
const OrderDetail  = lazy(() => import('@/routes/Orders').then(m => ({ default: m.OrderDetail })))
const NewOrder     = lazy(() => import('@/routes/Orders').then(m => ({ default: m.NewOrder })))
const Assignment   = lazy(() => import('@/routes/Assignment').then(m => ({ default: m.Assignment })))
const Leads        = lazy(() => import('@/routes/Leads').then(m => ({ default: m.Leads })))
const LeadDetail   = lazy(() => import('@/routes/Leads').then(m => ({ default: m.LeadDetail })))
const NewLead      = lazy(() => import('@/routes/Leads').then(m => ({ default: m.NewLead })))
const Billing      = lazy(() => import('@/routes/Billing').then(m => ({ default: m.Billing })))
const Reports      = lazy(() => import('@/routes/Reports').then(m => ({ default: m.Reports })))
const Company      = lazy(() => import('@/routes/Company').then(m => ({ default: m.Company })))
const Person       = lazy(() => import('@/routes/Company').then(m => ({ default: m.Person })))
const ClientDetail = lazy(() => import('@/routes/Company').then(m => ({ default: m.ClientDetail })))
const Counties     = lazy(() => import('@/routes/Counties').then(m => ({ default: m.Counties })))
const LinkMonitor  = lazy(() => import('@/routes/Counties').then(m => ({ default: m.LinkMonitor })))
const Attendance   = lazy(() => import('@/routes/hrms').then(m => ({ default: m.Attendance })))
const Leave        = lazy(() => import('@/routes/hrms').then(m => ({ default: m.Leave })))
const Payroll      = lazy(() => import('@/routes/hrms').then(m => ({ default: m.Payroll })))
const Payslips     = lazy(() => import('@/routes/hrms').then(m => ({ default: m.Payslips })))
const PayslipDetail= lazy(() => import('@/routes/hrms').then(m => ({ default: m.PayslipDetail })))
const MyPay        = lazy(() => import('@/routes/hrms').then(m => ({ default: m.MyPay })))
const Hiring       = lazy(() => import('@/routes/hrms').then(m => ({ default: m.Hiring })))
const Petty        = lazy(() => import('@/routes/hrms').then(m => ({ default: m.Petty })))
const MyWork       = lazy(() => import('@/routes/misc').then(m => ({ default: m.MyWork })))
const MyPerf       = lazy(() => import('@/routes/misc').then(m => ({ default: m.MyPerf })))
const Intake       = lazy(() => import('@/routes/misc').then(m => ({ default: m.Intake })))
const RepGen       = lazy(() => import('@/routes/misc').then(m => ({ default: m.RepGen })))
const Integrations = lazy(() => import('@/routes/misc').then(m => ({ default: m.Integrations })))
const SignIn       = lazy(() => import('@/routes/misc').then(m => ({ default: m.SignIn })))
const Onboard      = lazy(() => import('@/routes/misc').then(m => ({ default: m.Onboard })))

const rootRoute = createRootRoute({
  component: () => <Shell />,
  notFoundComponent: () => <Denied />,
})

const tabSearch = (s: Record<string, unknown>): { tab?: string } => ({
  tab: typeof s.tab === 'string' ? s.tab : undefined,
})
const filterSearch = (s: Record<string, unknown>): { filter?: string } => ({
  filter: typeof s.filter === 'string' ? s.filter : undefined,
})

/* ── Production ── */
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Dashboard })
const ordersRoute = createRoute({ getParentRoute: () => rootRoute, path: '/orders', component: () => <Outlet /> })
const ordersIndexRoute = createRoute({
  getParentRoute: () => ordersRoute, path: '/', component: Orders, validateSearch: filterSearch,
})
const newOrderRoute = createRoute({ getParentRoute: () => ordersRoute, path: 'new', component: NewOrder })
const orderDetailRoute = createRoute({ getParentRoute: () => ordersRoute, path: '$orderId', component: OrderDetail })
const myWorkRoute = createRoute({ getParentRoute: () => rootRoute, path: '/my-work', component: MyWork })
const myPerfRoute = createRoute({ getParentRoute: () => rootRoute, path: '/my-perf', component: MyPerf })
const myPayRoute = createRoute({ getParentRoute: () => rootRoute, path: '/my-pay', component: MyPay })
const assignRoute = createRoute({ getParentRoute: () => rootRoute, path: '/assign', component: Assignment })
const intakeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/intake', component: Intake })
const repgenRoute = createRoute({ getParentRoute: () => rootRoute, path: '/repgen', component: RepGen })

/* ── Business ── */
const leadsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/leads', component: () => <Outlet /> })
const leadsIndexRoute = createRoute({ getParentRoute: () => leadsRoute, path: '/', component: Leads })
const newLeadRoute = createRoute({ getParentRoute: () => leadsRoute, path: 'new', component: NewLead })
const leadDetailRoute = createRoute({ getParentRoute: () => leadsRoute, path: '$leadId', component: LeadDetail })
const billingRoute = createRoute({ getParentRoute: () => rootRoute, path: '/billing', component: Billing })

/* ── HRMS ── */
const attendRoute = createRoute({ getParentRoute: () => rootRoute, path: '/attendance', component: Attendance })
const leaveRoute = createRoute({ getParentRoute: () => rootRoute, path: '/leave', component: Leave })
const payrollRoute = createRoute({ getParentRoute: () => rootRoute, path: '/payroll', component: Payroll })
const payslipsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/payslips', component: () => <Outlet /> })
const payslipsIndexRoute = createRoute({ getParentRoute: () => payslipsRoute, path: '/', component: Payslips })
const payslipDetailRoute = createRoute({ getParentRoute: () => payslipsRoute, path: '$staffId', component: PayslipDetail })
const hiringRoute = createRoute({ getParentRoute: () => rootRoute, path: '/hiring', component: Hiring })
const pettyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/petty', component: Petty })

/* ── Reference & Insight ── */
const countiesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/counties', component: Counties })
const linkRoute = createRoute({ getParentRoute: () => rootRoute, path: '/linkcheck', component: LinkMonitor })
const reportsRoute = createRoute({
  getParentRoute: () => rootRoute, path: '/reports', component: Reports, validateSearch: tabSearch,
})

/* ── Configure ── */
const companyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/company', component: () => <Outlet /> })
const companyIndexRoute = createRoute({
  getParentRoute: () => companyRoute, path: '/', component: Company, validateSearch: tabSearch,
})
const personRoute = createRoute({ getParentRoute: () => companyRoute, path: 'staff/$staffId', component: Person })
const clientDetailRoute = createRoute({ getParentRoute: () => companyRoute, path: 'clients/$clientName', component: ClientDetail })
const integRoute = createRoute({ getParentRoute: () => rootRoute, path: '/integrations', component: Integrations })

/* ── Auth & setup ── */
const signinRoute = createRoute({ getParentRoute: () => rootRoute, path: '/signin', component: SignIn })
const deniedRoute = createRoute({ getParentRoute: () => rootRoute, path: '/denied', component: Denied })
const onboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/onboard', component: Onboard })

/* ── ALIAS routes — "old routes resolve, then behave normally" ── */
const alias = <P extends string>(path: P, to: '/company' | '/reports', tab: string) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path,
    beforeLoad: () => { throw redirect({ to, search: { tab } }) },
  })
const staffAlias = alias('/staff', '/company', 'Staff')
const clientsAlias = alias('/clients', '/company', 'Clients')
const deptsAlias = alias('/depts', '/company', 'Departments')
const rolesAlias = alias('/roles', '/company', 'Roles')
const workflowAlias = alias('/workflow', '/company', 'Workflow')
const slaAlias = alias('/sla', '/company', 'Turnaround & SLA')
const qualityAlias = alias('/quality', '/reports', 'Quality')
const workloadAlias = alias('/workload', '/reports', 'By staff')

const routeTree = rootRoute.addChildren([
  indexRoute,
  ordersRoute.addChildren([ordersIndexRoute, newOrderRoute, orderDetailRoute]),
  myWorkRoute, myPerfRoute, myPayRoute, assignRoute, intakeRoute, repgenRoute,
  leadsRoute.addChildren([leadsIndexRoute, newLeadRoute, leadDetailRoute]),
  billingRoute,
  attendRoute, leaveRoute, payrollRoute,
  payslipsRoute.addChildren([payslipsIndexRoute, payslipDetailRoute]),
  hiringRoute, pettyRoute,
  countiesRoute, linkRoute, reportsRoute,
  companyRoute.addChildren([companyIndexRoute, personRoute, clientDetailRoute]),
  integRoute,
  signinRoute, deniedRoute, onboardRoute,
  staffAlias, clientsAlias, deptsAlias, rolesAlias, workflowAlias, slaAlias,
  qualityAlias, workloadAlias,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
