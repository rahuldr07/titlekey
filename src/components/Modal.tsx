/**
 * Modal — the original .mask/.modal markup and behaviour: click the backdrop to
 * close, × in the header, footer for the actions, focus returned on close.
 */
import { useEffect, useRef, type ReactNode } from 'react'

export function Modal({ open, title, onClose, children, footer }: {
  open: boolean
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const lastFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement | null
    } else {
      lastFocus.current?.focus?.()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div
      className={`mask ${open ? 'on' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="mdt">
        <div className="mh">
          <h3 id="mdt">{title}</h3>
          <button className="x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="mb">{children}</div>
        {footer && <div className="mf">{footer}</div>}
      </div>
    </div>
  )
}
