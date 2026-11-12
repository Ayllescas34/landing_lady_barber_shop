'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

/** Panel que sube desde abajo (como en las apps del iPhone). */
export default function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white px-5 pt-3 shadow-2xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-navy first-letter:uppercase">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full bg-gray-100 p-2 text-gray-600" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
