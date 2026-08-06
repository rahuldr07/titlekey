import { PageHead } from '@/components/ui'

/**
 * Screens not yet ported from the prototype.
 *
 * Deliberately explicit about what is missing and where the specification lives,
 * rather than showing an empty page that reads as a bug.
 */
export function Placeholder({ title, sub, source }: {
  title: string
  sub: string
  /** Where in the prototype this screen is defined, e.g. "S.payroll". */
  source: string
}) {
  return (
    <>
      <PageHead title={title} sub={sub} />
      <div className="card">
        <div className="cb">
          <div className="bnr b" style={{ marginBottom: 0 }}>
            <span className="bi">◔</span>
            <div>
              <div className="bt">Not ported yet</div>
              <p style={{ marginTop: 4 }}>
                This screen exists in full in the design prototype and has not been
                converted to React yet.
              </p>
              <p className="gr" style={{ fontSize: '12.5px', marginTop: 8 }}>
                Specification: <code>{source}</code> in{' '}
                <code>title-crm-897/project/Title CRM (original).html</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
