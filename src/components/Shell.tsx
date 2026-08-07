/**
 * The application shell — sidebar, header, toast, alerts and tenant modals.
 * Markup mirrors the original: nav items are <button class>, the account button
 * (.who) opens the Sign in screen, the bell opens the notifications modal, the
 * tenant block cycles workspaces, ◐ toggles the theme, ☰ opens the drawer.
 */
import { useMemo, useState } from 'react'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  NOW, PASTDUE, ORDERS, TENANTS, TZ, TZ2, roleName, who,
} from '@/data/seed'
import { FOLLOWUP, LINKCHECK, brokenLinks, nextCheck } from '@/data/seed2'
import { runEngine, thinDepartments } from '@/lib/engine'
import { fmtDate, fmtTime, initials } from '@/lib/format'
import { orderPlan } from '@/lib/sla'
import { visibleNav } from '@/lib/nav'
import { useSession } from '@/lib/session'
import { Modal } from '@/components/Modal'
import { Empty } from '@/components/ui'

interface Alert { sev: 'bad' | 'warn'; t: string; d: string; go: string }

/** Ported from the original alerts() — what the admin is told about. */
function alerts(): Alert[] {
  const out: Alert[] = []
  const bl = brokenLinks()
  if (bl.length) out.push({
    sev: 'bad',
    t: `${bl.length} county link${bl.length === 1 ? '' : 's'} not working`,
    d: `${[...new Set(bl.map((x) => x.c.n))].slice(0, 3).join(', ')}${new Set(bl.map((x) => x.c.n)).size > 3 ? ' and others' : ''} — found by the check`,
    go: '/linkcheck',
  })
  if (NOW >= nextCheck()) out.push({
    sev: 'warn', t: 'Link check is due',
    d: `Every ${LINKCHECK.every} days · last ran ${fmtDate(LINKCHECK.last)}`, go: '/linkcheck',
  })
  if (PASTDUE) out.push({
    sev: 'bad', t: `${PASTDUE} order${PASTDUE === 1 ? '' : 's'} past due`,
    d: 'The client is already owed an explanation', go: '/orders',
  })
  const doomed = ORDERS.filter((o) => !o.done && o.due >= NOW && orderPlan(o).doomed)
  if (doomed.length) out.push({
    sev: 'bad', t: `${doomed.length} order${doomed.length === 1 ? '' : 's'} cannot finish in time`,
    d: 'Not late yet — but the stages still to run need more time than the promise has left', go: '/orders',
  })
  const slipping = ORDERS.filter((o) => !o.done && !orderPlan(o).doomed && orderPlan(o).behind)
  if (slipping.length) out.push({
    sev: 'warn', t: `${slipping.length} order${slipping.length === 1 ? '' : 's'} behind an internal checkpoint`,
    d: 'Still recoverable, but the slack is going', go: '/orders',
  })
  const { exc } = runEngine()
  if (exc.length) out.push({
    sev: 'warn', t: `${exc.length} stages could not be assigned`,
    d: 'Waiting on a person to place them', go: '/assign',
  })
  const fu = FOLLOWUP()
  if (fu) out.push({
    sev: 'warn', t: `${fu} lead${fu === 1 ? '' : 's'} need following up`,
    d: 'Flagged, or gone quiet on their own', go: '/leads',
  })
  const thin = thinDepartments()
  if (thin.length) out.push({
    sev: 'bad', t: `${thin.join(', ')} has nobody available`,
    d: 'Any order needing that stage has nowhere to go', go: '/depts',
  })
  return out
}

export function Shell() {
  const { me, tenant, can, dark, toggleTheme, toggleNav, closeNav, switchTenant, toastMsg, toastOn } = useSession()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [tenantOpen, setTenantOpen] = useState(false)

  const groups = visibleNav({ can, worksInDepartment: me.dep.length > 0 })
  const a = useMemo(alerts, [])
  const broken = brokenLinks().length
  const followUp = FOLLOWUP()

  const current = groups.flatMap((g) => g.t).find((t) =>
    t.path === '/' ? pathname === '/' : pathname === t.path || pathname.startsWith(t.path + '/'))

  const go = (to: string) => { navigate({ to }); closeNav() }

  return (
    <div className="app">
      <aside className="side">
        <div className="logo"><i>◧</i> Title CRM</div>

        <button className="tenant" onClick={() => setTenantOpen(true)}>
          <span className="av">{initials(tenant.name)}</span>
          <span className="nm"><b>{tenant.name}</b><span>{tenant.plan}</span></span>
          <span className="cx">⇅</span>
        </button>

        <nav>
          {groups.map((g) => (
            <div key={g.l}>
              <div className="navlbl">{g.l}</div>
              {g.t.map((t) => (
                <button
                  key={t.path}
                  className={current?.path === t.path ? 'on' : ''}
                  onClick={() => go(t.path)}
                >
                  <i>{t.icon}</i>{t.label}
                  {t.path === '/' && PASTDUE > 0 && <span className="bdg">{PASTDUE}</span>}
                  {t.path === '/leads' && followUp > 0 && (
                    <span className="bdg" style={{ background: 'var(--warn)' }}>{followUp}</span>
                  )}
                  {t.path === '/linkcheck' && broken > 0 && <span className="bdg">{broken}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="me">
          <span className="av">{initials(me.n)}</span>
          <span><b>{me.n}</b><span>{roleName(me.r)}</span></span>
          <span className="lo">⏻</span>
        </div>
      </aside>

      <div className="main">
        <a href="#main" className="skip">Skip to content</a>
        <header className="top">
          <button className="ic burger" aria-label="Open navigation" onClick={toggleNav}>☰</button>
          <span className="gr" style={{ fontSize: '12.5px' }}>
            {tenant.name}{current ? ` · ${current.label}` : ''}
          </span>
          <div className="clock">
            <b>{fmtTime(NOW)} {TZ}</b>
            <span>· {fmtTime(new Date(NOW.getTime() + 9.5 * 3_600_000))} {TZ2}</span>
          </div>
          <button
            className="ic"
            aria-label={a.length ? `Notifications — ${a.length} need attention` : 'Notifications — nothing outstanding'}
            onClick={() => setAlertsOpen(true)}
          >
            🔔{a.length > 0 && (
              <span className="dot" style={{ background: a.some((x) => x.sev === 'bad') ? 'var(--bad)' : 'var(--warn)' }} />
            )}
          </button>
          <button
            className="ic"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={dark}
            onClick={toggleTheme}
          >
            ◐
          </button>
          <button
            className="who"
            aria-label="Account — switch who you are signed in as"
            onClick={() => go('/signin')}
          >
            <span className="ava" style={{ width: 26, height: 26, fontSize: '9.5px' }}>{initials(me.n)}</span>
            <span style={{ textAlign: 'left', lineHeight: 1.3, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <b style={{ fontSize: '12.5px', whiteSpace: 'nowrap' }}>{me.n}</b>
              <span className="gr" style={{ fontSize: '10.5px', whiteSpace: 'nowrap' }}>{roleName(me.r)}</span>
            </span>
          </button>
        </header>

        <main className="wrap anim" id="main" key={pathname}>
          <Outlet />
        </main>
      </div>

      {/* notifications — the original openAlerts() modal */}
      <Modal open={alertsOpen} title="Notifications" onClose={() => setAlertsOpen(false)}>
        {a.length ? (
          <>
            <div className="rows">
              {a.map((x, i) => (
                <button
                  key={i}
                  className="rw"
                  style={{ width: '100%', textAlign: 'left' }}
                  onClick={() => { setAlertsOpen(false); go(x.go) }}
                >
                  <span className={x.sev === 'bad' ? 'bad' : 'warn'} style={{ fontSize: '14.5px' }}>
                    {x.sev === 'bad' ? '⚑' : '◷'}
                  </span>
                  <span><b>{x.t}</b><div className="sd">{x.d}</div></span>
                  <span className="gr">→</span>
                </button>
              ))}
            </div>
            <p className="gr" style={{ fontSize: '11.5px', marginTop: 12 }}>
              Going to company admins. Change who under Link monitor.
            </p>
          </>
        ) : (
          <Empty icon="✓">Nothing needs your attention.</Empty>
        )}
      </Modal>

      {/* tenant switcher — the original openTenant() modal, incl. "+ Add a company" */}
      <Modal open={tenantOpen} title="Switch company" onClose={() => setTenantOpen(false)}>
        <div className="rows">
          {TENANTS.map((t) => (
            <button
              key={t.id}
              className="rw"
              style={{ width: '100%', textAlign: 'left' }}
              onClick={() => { switchTenant(t.id); setTenantOpen(false) }}
            >
              <span className="av" style={{ width: 26, height: 26, borderRadius: 5, background: 'var(--brandsoft)', color: 'var(--brand)', display: 'grid', placeItems: 'center', fontSize: '10.5px', fontWeight: 700 }}>
                {initials(t.name)}
              </span>
              <span><b>{t.name}</b><div className="sd">{t.plan}</div></span>
              <span className="gr">{t.id === tenant.id ? 'current' : '→'}</span>
            </button>
          ))}
          <button
            className="rw"
            style={{ width: '100%', textAlign: 'left' }}
            onClick={() => { setTenantOpen(false); go('/onboard') }}
          >
            <span className="gr" style={{ fontSize: '14.5px' }}>＋</span>
            <span><b>+ Add a company</b><div className="sd">Set up a new workspace</div></span>
            <span className="gr">→</span>
          </button>
        </div>
      </Modal>

      <div id="toast" className={toastOn ? 'on' : ''}>{toastMsg}</div>
    </div>
  )
}

export const staffLink = (navigate: (o: { to: string; params?: Record<string, string> }) => void, id: string) =>
  navigate({ to: '/company/staff/$staffId', params: { staffId: id } })

export { who }
