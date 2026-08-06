import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { NOW, TZ, TZ2, TZ2_OFFSET_HOURS, roleName } from '@/data/seed'
import { api, queryKeys } from '@/lib/api'
import { fmtTime, initials } from '@/lib/format'
import { visibleNav } from '@/lib/nav'
import { useSession } from '@/lib/session'
import { atRisk } from '@/lib/sla'

export function Shell() {
  const { me, tenant, can, dark, toggleTheme, toggleNav, closeNav, signInAs, switchTenant } = useSession()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { data: orders = [] } = useQuery({ queryKey: queryKeys.orders, queryFn: api.orders })

  const groups = visibleNav({ can, worksInDepartment: me.departments.length > 0 })
  const pastDue = orders.filter((o) => !o.done && o.dueAt < NOW).length
  const alertCount = pastDue + orders.filter((o) => !o.done && atRisk(o)).length

  const current = groups.flatMap((g) => g.items).find((i) => i.path === pathname)

  return (
    <div className="app">
      <aside className="side">
        <div className="logo"><i>◧</i> Title CRM</div>

        <button
          className="tenant"
          onClick={() => {
            const ids = ['ka', 'ps', 'bg']
            const next = ids[(ids.indexOf(tenant.id) + 1) % ids.length]!
            switchTenant(next)
          }}
        >
          <span className="av">{initials(tenant.name)}</span>
          <span className="nm"><b>{tenant.name}</b><span>{tenant.plan}</span></span>
          <span className="cx">⇅</span>
        </button>

        <nav>
          {groups.map((g) => (
            <div key={g.label}>
              <div className="navlbl">{g.label}</div>
              {g.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={item.path === pathname ? 'on' : ''}
                  onClick={closeNav}
                >
                  <i>{item.icon}</i>
                  {item.label}
                  {item.path === '/' && pastDue > 0 && <span className="bdg">{pastDue}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="me">
          <span className="av">{initials(me.name)}</span>
          <span><b>{me.name}</b><span>{roleName(me.role)}</span></span>
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
            <span>· {fmtTime(new Date(NOW.getTime() + TZ2_OFFSET_HOURS * 3_600_000))} {TZ2}</span>
          </div>

          <button
            className="ic"
            aria-label={alertCount ? `Notifications — ${alertCount} need attention` : 'Notifications — nothing outstanding'}
          >
            🔔{alertCount > 0 && <span className="dot" />}
          </button>

          <button
            className="ic"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={dark}
            onClick={toggleTheme}
          >
            ◐
          </button>

          <SignedInAs onChange={signInAs} />
        </header>

        <main className="wrap anim" id="main" key={pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/** Sign in as any staff member and watch the navigation change — as the prototype does. */
function SignedInAs({ onChange }: { onChange: (id: string) => void }) {
  const { me } = useSession()
  const { data: staff = [] } = useQuery({ queryKey: queryKeys.staff, queryFn: api.staff })

  return (
    <div className="who" title="Switch who you are signed in as">
      <span className="ava" style={{ width: 26, height: 26, fontSize: '9.5px' }}>
        {initials(me.name)}
      </span>
      <select
        className="inp"
        value={me.id}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Account — switch who you are signed in as"
        style={{
          border: 'none', background: 'transparent', padding: '0 4px',
          fontSize: '12.5px', fontWeight: 600, boxShadow: 'none', width: 'auto', cursor: 'pointer',
        }}
      >
        {staff.map((s) => (
          <option key={s.id} value={s.id}>{s.name} — {roleName(s.role)}</option>
        ))}
      </select>
    </div>
  )
}
