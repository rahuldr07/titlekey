/**
 * Who is signed in, which tenant, theme. The prototype lets you sign in as any
 * staff member and watch the navigation change — that behaviour is preserved.
 */
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ROLES, STAFF, TENANTS } from '@/data/seed'
import type { Permission, Staff, Tenant } from '@/data/types'

interface SessionValue {
  me: Staff
  tenant: Tenant
  permissions: Permission[]
  can: (need: Permission | null | undefined) => boolean
  signInAs: (id: string) => void
  switchTenant: (id: string) => void
  dark: boolean
  toggleTheme: () => void
  navOpen: boolean
  toggleNav: () => void
  closeNav: () => void
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [meId, setMeId] = useState('hw')
  const [tenantId, setTenantId] = useState('ka')
  const [dark, setDark] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  const me = STAFF.find((s) => s.id === meId) ?? STAFF[0]!
  const tenant = TENANTS.find((t) => t.id === tenantId) ?? TENANTS[0]!
  const permissions = useMemo(
    () => ROLES.find((r) => r.id === me.role)?.permissions ?? [],
    [me.role],
  )

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    document.body.classList.toggle('navopen', navOpen)
  }, [navOpen])

  const can = useCallback(
    (need: Permission | null | undefined) => (need ? permissions.includes(need) : true),
    [permissions],
  )

  const value: SessionValue = {
    me, tenant, permissions, can,
    signInAs: setMeId,
    switchTenant: setTenantId,
    dark,
    toggleTheme: () => setDark((d) => !d),
    navOpen,
    toggleNav: () => setNavOpen((o) => !o),
    closeNav: () => setNavOpen(false),
  }

  return <SessionContext value={value}>{children}</SessionContext>
}

export function useSession(): SessionValue {
  const ctx = use(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}
