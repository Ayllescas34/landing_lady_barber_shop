'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { saveService } from '@/app/(panel)/panel/actions'

type Svc = { id: number; name: string; price: number | null; priceFrom: boolean; duration: number; active: boolean }

export default function PreciosTab({ services }: { services: Svc[] }) {
  return (
    <div className="space-y-3">
      <p className="text-[16px] text-gray-600">Cambia el precio y toca <b>Guardar</b>. Se actualiza en la página al momento.</p>
      {services.map((s) => (
        <Row key={s.id} svc={s} />
      ))}
    </div>
  )
}

function Row({ svc }: { svc: Svc }) {
  const router = useRouter()
  const [price, setPrice] = useState(svc.price == null ? '' : String(svc.price))
  const [active, setActive] = useState(svc.active)
  const [busy, start] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dirty = price !== (svc.price == null ? '' : String(svc.price)) || active !== svc.active

  const save = () =>
    start(async () => {
      setError(null)
      const r = await saveService(svc.id, price === '' ? null : Number(price), active)
      if (!r.ok) return setError(r.error)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    })

  return (
    <div className={`rounded-2xl bg-white p-4 shadow-sm ${active ? '' : 'opacity-70'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[18px] font-semibold">{svc.name}</p>
          <p className="text-[14px] text-gray-500">{svc.duration} min{svc.priceFrom ? ' · precio "desde"' : ''}</p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-[14px] text-gray-600">
          Visible
          <input type="checkbox" className="h-6 w-6" checked={active} onChange={(e) => setActive(e.target.checked)} />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="flex flex-1 items-center rounded-xl border border-gray-300 bg-white px-4">
          <span className="text-[18px] font-semibold text-gray-500">Q</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Consultar"
            className="w-full border-0 bg-transparent px-2 py-3 text-[20px] font-bold outline-none"
            aria-label={`Precio de ${svc.name}`}
          />
        </div>
        <button
          type="button"
          disabled={!dirty || busy}
          onClick={save}
          className={`rounded-xl px-5 py-3.5 text-[16px] font-bold ${
            saved ? 'bg-green-600 text-white' : dirty ? 'bg-navy text-white' : 'bg-gray-100 text-gray-400'
          }`}
        >
          {saved ? '✓ Listo' : busy ? '…' : 'Guardar'}
        </button>
      </div>
      {error && <p className="mt-2 font-semibold text-barber">{error}</p>}
    </div>
  )
}
