'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { cancelByCustomer } from '@/app/(frontend)/actions'

/** Botón con confirmación en dos pasos (sin ventanas emergentes del navegador). */
export default function CancelAppointment({ id, token }: { id: string; token: string }) {
  const router = useRouter()
  const [asking, setAsking] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const cancel = () =>
    start(async () => {
      const r = await cancelByCustomer(id, token)
      if (!r.ok) return setError(r.error)
      router.refresh()
    })

  return (
    <div className="mt-6">
      {!asking ? (
        <button type="button" onClick={() => setAsking(true)} className="btn w-full border-2 border-barber/40 text-barber hover:bg-barber/5">
          No puedo asistir · Cancelar mi cita
        </button>
      ) : (
        <div className="rounded-2xl bg-barber/5 p-4">
          <p className="font-semibold text-navy">¿Seguro que quieres cancelar?</p>
          <p className="mt-1 text-sm text-ink/70">El horario quedará libre para otra persona.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={pending} onClick={cancel} className="btn-primary">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Sí, cancelar
            </button>
            <button type="button" disabled={pending} onClick={() => setAsking(false)} className="btn border-2 border-navy/20 text-navy">
              No, mantener mi cita
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-3 text-sm font-semibold text-barber">{error}</p>}
    </div>
  )
}
