/**
 * Session — who is signed in (the original's ME), which tenant, theme, drawer,
 * and the toast. signInAs reproduces the original's behaviour: reset selection
 * state, land on dash or mywork by permission, toast the switch.
 */
import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ROLELIST, STAFF, TENANTS, who, type Staff, type Tenant } from '@/data/seed'

interface SessionValue {
  me: Staff
  myRole: () => (typeof ROLELIST)[number]
  can: (k: string) => boolean
  isAdmin: () => boolean
  signInAs: (id: string, navigate: (to: string) => void) => void
  tenant: Tenant
  switchTenant: (id: string) => void
  dark: boolean
  toggleTheme: () => void
  navOpen: boolean
  toggleNav: () => void
  closeNav: () => void
  toast: (msg: string) => void
  toastMsg: string
  toastOn: boolean
}

const Ctx = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [meId, setMeId] = useState('hw')
  const [tenantId, setTenantId] = useState('ka')
  const [dark, setDark] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastOn, setToastOn] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const me = STAFF.find((s) => s.id === meId) ?? STAFF[0]!
  const tenant = TENANTS.find((t) => t.id === tenantId) ?? TENANTS[0]!
  const myRole = useCallback(
    () => ROLELIST.find((r) => r.id === me.r) ?? ROLELIST[0]!,
    [me.r],
  )
  const can = useCallback((k: string) => myRole().p.includes(k), [myRole])

  useEffect(() => { document.body.classList.toggle('dark', dark) }, [dark])
  useEffect(() => { document.body.classList.toggle('navopen', navOpen) }, [navOpen])

  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    setToastOn(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToastOn(false), 2400)
  }, [])

  const signInAs = useCallback((id: string, navigate: (to: string) => void) => {
    setMeId(id)
    const role = ROLELIST.find((r) => r.id === (STAFF.find((s) => s.id === id)?.r ?? 'staff'))!
    navigate(role.p.includes('all') ? '/' : '/my-work')
    toast(`Signed in as ${who(id)} — ${role.n}`)
  }, [toast])

  const value: SessionValue = {
    me, myRole, can,
    isAdmin: () => me.r === 'admin',
    signInAs,
    tenant,
    switchTenant: setTenantId,
    dark,
    toggleTheme: () => setDark((d) => !d),
    navOpen,
    toggleNav: () => setNavOpen((o) => !o),
    closeNav: () => setNavOpen(false),
    toast, toastMsg, toastOn,
  }

  return <Ctx value={value}>{children}</Ctx>
}

export function useSession(): SessionValue {
  const v = use(Ctx)
  if (!v) throw new Error('useSession outside provider')
  return v
}
