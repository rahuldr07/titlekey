/**
 * Permission denied — also the not-found screen.
 * Kept in its own module so `misc.tsx` can be code-split: the router needs
 * Denied eagerly for notFoundComponent, and a static import of misc.tsx would
 * pin all seven of its screens into the entry chunk.
 */
import { useNavigate } from '@tanstack/react-router'
import { roleName } from '@/data/seed'
import { useSession } from '@/lib/session'
import { Empty, PageHead } from '@/components/ui'

export function Denied() {
  const navigate = useNavigate()
  const { me, can } = useSession()
  return (
    <>
      <PageHead
        title="You do not have access to that"
        sub={`${roleName(me.r)} does not include the permission that screen needs.`}
      />
      <div className="card">
        <Empty
          icon="⚿"
          action={
            <div style={{ display: 'flex', gap: 9, justifyContent: 'center' }}>
              <button className="btn g sm" onClick={() => navigate({ to: '/signin' })}>Switch account</button>
              <button className="btn sm" onClick={() => navigate({ to: can('all') ? '/' : '/my-work' })}>
                {can('all') ? 'Go to the dashboard' : 'Go to my work'}
              </button>
            </div>
          }
        >
          Ask a company admin to change your role, or sign in as someone who has it.
        </Empty>
      </div>
    </>
  )
}
