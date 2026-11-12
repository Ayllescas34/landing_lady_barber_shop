'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { Check, ChevronRight, MessageCircle, MoreHorizontal, Plus } from 'lucide-react'
import { addAppointment, setAppointmentStatus } from '@/app/(panel)/panel/actions'
import { TIME_OPTIONS, addDays, formatDateLong, formatTime12 } from '@/lib/time'
import Sheet from './Sheet'
import { STATUS, type PanelAppt, waTo } from './types'

type Svc = { id: number; name: string; duration: number }

const dayTitle = (key: string, today: string) =>
  key === today ? 'Hoy' : key === addDays(today, 1) ? 'Mañana' : formatDateLong(key)

export default function CitasTab({
  today,
  appts,
  services,
  businessName,
  newMessages,
}: {
  today: string
  appts: PanelAppt[]
  services: Svc[]
  businessName: string
  newMessages: number
}) {
  const [showDone, setShowDone] = useState(false)
  const [adding, setAdding] = useState(false)

  const pending = appts.filter((a) => a.status === 'pending')
  const visible = appts.filter((a) => a.status !== 'pending' && (showDone || ['confirmed'].includes(a.status)))
  const hidden = appts.filter((a) => a.status !== 'pending' && a.status !== 'confirmed').length

  const byDay = useMemo(() => {
    const map = new Map<string, PanelAppt[]>()
    for (const a of [...visible].sort((x, y) => x.dateKey.localeCompare(y.dateKey) || x.time.localeCompare(y.time))) {
      if (!map.has(a.dateKey)) map.set(a.dateKey, [])
      map.get(a.dateKey)!.push(a)
    }
    return [...map.entries()]
  }, [visible])

  const todayCount = appts.filter((a) => a.dateKey === today && ['pending', 'confirmed'].includes(a.status)).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-3xl font-extrabold text-navy">{todayCount}</p>
          <p className="text-[15px] text-gray-600">Citas hoy</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className={`text-3xl font-extrabold ${pending.length ? 'text-amber-600' : 'text-navy'}`}>{pending.length}</p>
          <p className="text-[15px] text-gray-600">Por confirmar</p>
        </div>
      </div>

      {newMessages > 0 && (
        <Link href="/panel?tab=mensajes" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <MessageCircle className="text-barber" />
          <span className="flex-1 text-[16px] font-semibold">
            Tienes {newMessages} mensaje{newMessages > 1 ? 's' : ''} nuevo{newMessages > 1 ? 's' : ''}
          </span>
          <ChevronRight className="text-gray-400" />
        </Link>
      )}

      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-amber-700">🔔 Nuevas, por confirmar</h2>
          <div className="space-y-3">
            {pending.map((a) => (
              <ApptCard key={a.id} appt={a} today={today} businessName={businessName} showDay />
            ))}
          </div>
        </section>
      )}

      {byDay.length === 0 && pending.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
          <p className="text-4xl">📭</p>
          <p className="mt-2 text-[16px]">No hay citas próximas.</p>
        </div>
      )}

      {byDay.map(([key, list]) => (
        <section key={key}>
          <h2 className="mb-3 text-lg font-bold text-navy first-letter:uppercase">
            {dayTitle(key, today)} <span className="font-normal text-gray-500">· {list.length}</span>
          </h2>
          <div className="space-y-3">
            {list.map((a) => (
              <ApptCard key={a.id} appt={a} today={today} businessName={businessName} />
            ))}
          </div>
        </section>
      ))}

      {hidden > 0 && (
        <button type="button" onClick={() => setShowDone((v) => !v)} className="w-full py-2 text-center text-[15px] font-semibold text-gray-500 underline">
          {showDone ? 'Ocultar atendidas y canceladas' : `Ver atendidas y canceladas (${hidden})`}
        </button>
      )}

      <button
        type="button"
        onClick={() => setAdding(true)}
        className="fixed right-5 z-30 flex items-center gap-2 rounded-full bg-barber px-5 py-4 text-[16px] font-bold text-white shadow-xl"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}
      >
        <Plus size={22} /> Agregar cita
      </button>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Nueva cita">
        <AddForm today={today} services={services} onDone={() => setAdding(false)} />
      </Sheet>
    </div>
  )
}

function ApptCard({
  appt: a,
  today,
  businessName,
  showDay,
}: {
  appt: PanelAppt
  today: string
  businessName: string
  showDay?: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [menu, setMenu] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const st = STATUS[a.status] || STATUS.pending
  const active = a.status === 'pending' || a.status === 'confirmed'

  const set = (status: string) =>
    start(async () => {
      const r = await setAppointmentStatus(a.id, status)
      if (!r.ok) setError(r.error)
      setMenu(false)
      router.refresh()
    })

  const confirmMsg = `Hola ${a.name} 👋, te confirmamos tu cita en ${businessName} el ${formatDateLong(a.dateKey)} a las ${formatTime12(a.time)}${a.service ? ` (${a.service})` : ''}. ¡Te esperamos!`

  return (
    <article className={`rounded-2xl bg-white p-4 shadow-sm ${pending ? 'opacity-60' : ''} ${!active ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xl font-extrabold text-navy">{formatTime12(a.time)}</p>
          {showDay && <p className="text-[15px] font-semibold text-gray-600 first-letter:uppercase">{dayTitle(a.dateKey, today)}</p>}
          <p className="mt-1 text-[18px] font-semibold">{a.name}</p>
          <p className="text-[15px] text-gray-600">
            {a.service || 'Sin servicio'} · {a.duration} min
          </p>
          {a.notes && <p className="mt-2 rounded-lg bg-paper p-2 text-[15px]">💬 {a.notes}</p>}
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-bold ${st.cls}`}>{st.label}</span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
        {a.status === 'pending' ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => set('confirmed')}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-green-600 py-3 text-[16px] font-bold text-white"
          >
            <Check size={20} /> Confirmar
          </button>
        ) : a.status === 'confirmed' ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => set('completed')}
            className="rounded-xl bg-gray-100 py-3 text-[16px] font-bold text-navy"
          >
            ✂️ Ya vino
          </button>
        ) : (
          <button type="button" disabled={pending} onClick={() => set('confirmed')} className="rounded-xl bg-gray-100 py-3 text-[16px] font-bold text-navy">
            ↺ Reactivar
          </button>
        )}
        <a
          href={waTo(a.phone, confirmMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center rounded-xl bg-[#25D366] py-3 text-[16px] font-bold text-white"
        >
          WhatsApp
        </a>
        <button type="button" onClick={() => setMenu(true)} className="rounded-xl bg-gray-100 px-4 text-gray-700" aria-label="Más opciones">
          <MoreHorizontal />
        </button>
      </div>
      {error && <p className="mt-2 text-[15px] font-semibold text-barber">{error}</p>}

      <Sheet open={menu} onClose={() => setMenu(false)} title={`${a.name} · ${formatTime12(a.time)}`}>
        <div className="space-y-3">
          <a href={`tel:${a.phone.replace(/[^\d+]/g, '')}`} className="block rounded-2xl bg-gray-100 p-4 text-center text-[17px] font-semibold">
            📞 Llamar ({a.phone})
          </a>
          {active && (
            <>
              {a.status === 'pending' && (
                <button type="button" onClick={() => set('completed')} className="w-full rounded-2xl bg-gray-100 p-4 text-[17px] font-semibold">
                  ✂️ Ya vino (atendida)
                </button>
              )}
              <button type="button" onClick={() => set('noshow')} className="w-full rounded-2xl bg-gray-100 p-4 text-[17px] font-semibold">
                🙅 No vino
              </button>
              <button
                type="button"
                onClick={() => window.confirm(`¿Cancelar la cita de ${a.name}? El horario quedará libre.`) && set('cancelled')}
                className="w-full rounded-2xl bg-red-50 p-4 text-[17px] font-semibold text-red-700"
              >
                ✕ Cancelar cita
              </button>
            </>
          )}
          {!active && (
            <button type="button" onClick={() => set('confirmed')} className="w-full rounded-2xl bg-gray-100 p-4 text-[17px] font-semibold">
              ↺ Volver a activar
            </button>
          )}
        </div>
      </Sheet>
    </article>
  )
}

function AddForm({ today, services, onDone }: { today: string; services: Svc[]; onDone: () => void }) {
  const router = useRouter()
  const [busy, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const r = await addAppointment({
        name: String(fd.get('name') || ''),
        phone: String(fd.get('phone') || ''),
        serviceId: Number(fd.get('service')) || null,
        date: String(fd.get('date') || ''),
        time: String(fd.get('time') || ''),
        source: String(fd.get('source') || 'whatsapp'),
      })
      if (!r.ok) return setError(r.error)
      router.refresh()
      onDone()
    })
  }

  const field = 'w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-[17px]'
  const label = 'mb-1 block text-[15px] font-semibold text-gray-700'

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className={label} htmlFor="n-name">Nombre del cliente</label>
        <input id="n-name" name="name" required className={field} autoComplete="off" />
      </div>
      <div>
        <label className={label} htmlFor="n-phone">Teléfono</label>
        <input id="n-phone" name="phone" type="tel" inputMode="tel" className={field} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="n-date">Día</label>
          <input id="n-date" name="date" type="date" required defaultValue={today} min={today} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="n-time">Hora</label>
          <select id="n-time" name="time" required defaultValue="10:00" className={field}>
            {TIME_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={label} htmlFor="n-service">Servicio</label>
        <select id="n-service" name="service" className={field}>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.duration} min)
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="n-source">¿Cómo reservó?</label>
        <select id="n-source" name="source" defaultValue="whatsapp" className={field}>
          <option value="whatsapp">Por WhatsApp</option>
          <option value="walkin">En persona</option>
          <option value="admin">Llamada / otro</option>
        </select>
      </div>
      {error && <p className="font-semibold text-barber">{error}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-2xl bg-barber py-4 text-[18px] font-bold text-white">
        {busy ? 'Guardando…' : 'Guardar cita'}
      </button>
      <p className="text-center text-[14px] text-gray-500">Esa hora quedará ocupada en la página web.</p>
    </form>
  )
}
