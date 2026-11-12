'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock, Loader2, Scissors, User } from 'lucide-react'
import { bookAppointment, fetchCalendar, fetchSlots } from '@/app/(frontend)/actions'
import { SERVICE_CATEGORIES } from '@/lib/categories'
import { formatPrice, waLink } from '@/lib/format'
import { MONTHS, WEEKDAYS, formatDateLong, formatTime12 } from '@/lib/time'
import { WhatsAppIcon } from './icons'

type ServiceOpt = {
  id: string
  name: string
  category: string
  price?: number | null
  priceFrom?: boolean | null
  duration: number
  description?: string | null
}
type Barber = { id: string; name: string; role?: string | null }

type Step = 'service' | 'barber' | 'date' | 'details' | 'done'

export default function BookingWizard({
  services,
  barbers,
  initialServiceId,
  notice,
  whatsapp,
  businessName,
}: {
  services: ServiceOpt[]
  barbers: Barber[]
  initialServiceId?: string
  notice: string
  whatsapp: string | null
  businessName: string
}) {
  const chooseBarber = barbers.length > 1
  const initial = services.find((s) => s.id === initialServiceId) || null

  const [step, setStep] = useState<Step>(initial ? (chooseBarber ? 'barber' : 'date') : 'service')
  const [service, setService] = useState<ServiceOpt | null>(initial)
  const [barber, setBarber] = useState<Barber | null>(null)
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)

  const [calendar, setCalendar] = useState<{ from: string; to: string; days: string[] } | null>(null)
  const [slots, setSlots] = useState<string[] | null>(null)
  const [loadingCal, startCal] = useTransition()
  const [loadingSlots, startSlots] = useTransition()
  const [submitting, startSubmit] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ code: string; message: string; name: string } | null>(null)

  // Cargar días disponibles al tener servicio (y barbero)
  useEffect(() => {
    if (!service || (step !== 'date' && step !== 'details')) return
    if (calendar) return
    startCal(async () => {
      const c = await fetchCalendar(service.id, barber?.id || null)
      setCalendar(c)
    })
  }, [service, barber, step, calendar])

  // Cargar horarios del día elegido
  useEffect(() => {
    if (!service || !date) return
    setSlots(null)
    startSlots(async () => {
      setSlots(await fetchSlots(service.id, date, barber?.id || null))
    })
  }, [service, barber, date])

  function pickService(s: ServiceOpt) {
    setService(s)
    setCalendar(null)
    setDate(null)
    setTime(null)
    setStep(chooseBarber ? 'barber' : 'date')
  }

  function pickBarber(b: Barber | null) {
    setBarber(b)
    setCalendar(null)
    setDate(null)
    setTime(null)
    setStep('date')
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!service || !date || !time) return
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '')
    setError(null)
    startSubmit(async () => {
      const res = await bookAppointment({
        serviceId: service.id,
        barberId: barber?.id || null,
        date,
        time,
        name,
        phone: String(fd.get('phone') || ''),
        email: String(fd.get('email') || ''),
        notes: String(fd.get('notes') || ''),
        website: String(fd.get('website') || ''),
      })
      if (res.ok) {
        setResult({ code: res.code, message: res.message, name })
        setStep('done')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setError(res.error)
        if (res.error.includes('horario')) {
          setTime(null)
          setCalendar(null)
          setStep('date')
          setSlots(null)
          startSlots(async () => setSlots(await fetchSlots(service.id, date, barber?.id || null)))
        }
      }
    })
  }

  if (!services.length) {
    return <p className="text-center text-ink/70">Aún no hay servicios disponibles para reservar.</p>
  }

  // ---------- Pantalla de éxito ----------
  if (step === 'done' && result && service && date && time) {
    const wa = waLink(
      whatsapp,
      `Hola, soy ${result.name}. Acabo de reservar en el sitio: ${service.name}, ${formatDateLong(date)} a las ${formatTime12(time)}. Código: ${result.code}`,
    )
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-navy/10 sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-hummingbird/15 text-hummingbird">
          <Check size={34} />
        </div>
        <h2 className="mt-5 font-display text-3xl text-navy">¡Cita solicitada!</h2>
        <p className="mx-auto mt-3 max-w-md text-ink/75">{result.message}</p>
        <dl className="mx-auto mt-8 grid max-w-md gap-3 rounded-2xl bg-paper p-5 text-left text-sm">
          <Row label="Servicio" value={service.name} />
          {barber && <Row label="Con" value={barber.name} />}
          <Row label="Día" value={formatDateLong(date)} capitalize />
          <Row label="Hora" value={formatTime12(time)} />
          <Row label="Código" value={result.code} strong />
        </dl>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white hover:brightness-95">
              <WhatsAppIcon className="h-5 w-5" /> Avisar por WhatsApp
            </a>
          )}
          <Link href="/" className="btn-navy">Volver al inicio</Link>
        </div>
      </div>
    )
  }

  const steps: { key: Step; label: string }[] = [
    { key: 'service', label: 'Servicio' },
    ...(chooseBarber ? [{ key: 'barber' as Step, label: 'Barbero(a)' }] : []),
    { key: 'date', label: 'Día y hora' },
    { key: 'details', label: 'Tus datos' },
  ]
  const currentIdx = steps.findIndex((s) => s.key === step)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-navy/10 sm:p-8">
        {/* Indicador de pasos */}
        <ol className="mb-8 flex items-center gap-2 overflow-x-auto pb-1">
          {steps.map((s, i) => (
            <li key={s.key} className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={i > currentIdx}
                onClick={() => setStep(s.key)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 font-heading text-xs uppercase tracking-widest ${
                  i === currentIdx
                    ? 'bg-navy text-paper'
                    : i < currentIdx
                      ? 'bg-hummingbird/15 text-navy'
                      : 'bg-navy/5 text-navy/40'
                }`}
              >
                <span>{i + 1}</span> {s.label}
              </button>
              {i < steps.length - 1 && <span className="h-px w-4 bg-navy/20" />}
            </li>
          ))}
        </ol>

        {step === 'service' && (
          <div>
            <h2 className="font-heading text-2xl uppercase tracking-wide text-navy">¿Qué servicio necesitas?</h2>
            {SERVICE_CATEGORIES.map((c) => {
              const list = services.filter((s) => s.category === c.value)
              if (!list.length) return null
              return (
                <div key={c.value} className="mt-6">
                  <p className="eyebrow !text-xs">{c.label}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {list.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => pickService(s)}
                        className={`rounded-2xl border-2 p-4 text-left transition hover:border-navy ${
                          service?.id === s.id ? 'border-barber bg-barber/5' : 'border-navy/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-heading text-lg uppercase tracking-wide text-navy">{s.name}</span>
                          <span className="shrink-0 font-semibold text-barber">{formatPrice(s.price, s.priceFrom)}</span>
                        </div>
                        <span className="mt-1 flex items-center gap-1 text-sm text-ink/55">
                          <Clock size={14} /> {s.duration} min
                        </span>
                        {s.description && <p className="mt-1 text-sm text-ink/65">{s.description}</p>}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {step === 'barber' && (
          <div>
            <h2 className="font-heading text-2xl uppercase tracking-wide text-navy">¿Con quién te atiendes?</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <BarberBtn active={!barber} onClick={() => pickBarber(null)} name="Cualquiera disponible" role="Más horarios" />
              {barbers.map((b) => (
                <BarberBtn key={b.id} active={barber?.id === b.id} onClick={() => pickBarber(b)} name={b.name} role={b.role} />
              ))}
            </div>
          </div>
        )}

        {step === 'date' && (
          <div>
            <h2 className="font-heading text-2xl uppercase tracking-wide text-navy">Elige el día y la hora</h2>
            {loadingCal || !calendar ? (
              <div className="flex items-center gap-2 py-16 text-ink/60">
                <Loader2 className="animate-spin" size={18} /> Buscando días disponibles…
              </div>
            ) : calendar.days.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-ink/75">Por ahora no hay horarios disponibles para este servicio.</p>
                {waLink(whatsapp, 'Hola, quisiera agendar una cita.') && (
                  <a
                    href={waLink(whatsapp, `Hola, quisiera agendar una cita para ${service?.name}.`)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn mt-5 bg-[#25D366] text-white"
                  >
                    <WhatsAppIcon className="h-5 w-5" /> Consultar por WhatsApp
                  </a>
                )}
              </div>
            ) : (
              <div className="mt-6 grid gap-8 md:grid-cols-2">
                <MonthCalendar
                  from={calendar.from}
                  to={calendar.to}
                  available={calendar.days}
                  selected={date}
                  onSelect={(d) => {
                    setDate(d)
                    setTime(null)
                  }}
                />
                <div>
                  {!date ? (
                    <p className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-navy/10 p-6 text-center text-ink/55">
                      Selecciona un día en el calendario
                    </p>
                  ) : (
                    <>
                      <p className="font-heading uppercase tracking-wide text-navy first-letter:uppercase">
                        {formatDateLong(date)}
                      </p>
                      {loadingSlots || !slots ? (
                        <div className="flex items-center gap-2 py-8 text-ink/60">
                          <Loader2 className="animate-spin" size={18} /> Cargando horarios…
                        </div>
                      ) : slots.length === 0 ? (
                        <p className="py-6 text-ink/65">Ya no quedan horarios este día. Prueba con otro.</p>
                      ) : (
                        <SlotGroups slots={slots} selected={time} onSelect={setTime} />
                      )}
                      {time && (
                        <button type="button" onClick={() => setStep('details')} className="btn-primary mt-6 w-full">
                          Continuar <ChevronRight size={16} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
            {error && <p className="mt-4 text-sm font-medium text-barber" role="alert">{error}</p>}
          </div>
        )}

        {step === 'details' && (
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <h2 className="font-heading text-2xl uppercase tracking-wide text-navy sm:col-span-2">Tus datos</h2>
            <div className="hp-field" aria-hidden>
              <label>
                No llenar <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="bk-name">Nombre completo *</label>
              <input id="bk-name" name="name" required minLength={2} className="input" autoComplete="name" />
            </div>
            <div>
              <label className="label" htmlFor="bk-phone">WhatsApp / Teléfono *</label>
              <input id="bk-phone" name="phone" type="tel" required className="input" autoComplete="tel" inputMode="tel" placeholder="5555 1234" />
            </div>
            <div>
              <label className="label" htmlFor="bk-email">Correo (opcional)</label>
              <input id="bk-email" name="email" type="email" className="input" autoComplete="email" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="bk-notes">Comentarios (opcional)</label>
              <textarea id="bk-notes" name="notes" rows={3} className="input resize-y" placeholder="Ej. quiero un fade bajo con diseño" />
            </div>
            {notice && <p className="rounded-xl bg-paper p-4 text-sm text-ink/70 sm:col-span-2">{notice}</p>}
            {error && <p className="text-sm font-medium text-barber sm:col-span-2" role="alert">{error}</p>}
            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button type="button" onClick={() => setStep('date')} className="btn border-2 border-navy/20 text-navy">
                <ChevronLeft size={16} /> Atrás
              </button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar cita
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Resumen */}
      <aside className="h-fit rounded-3xl bg-navy p-6 text-paper lg:sticky lg:top-28">
        <p className="font-heading text-sm uppercase tracking-[0.25em] text-barber-light">Tu cita</p>
        <p className="mt-1 font-display text-xl">{businessName}</p>
        <ul className="mt-5 space-y-4 text-sm">
          <Summary icon={<Scissors size={16} />} label="Servicio" value={service ? `${service.name} · ${service.duration} min` : '—'} />
          {chooseBarber && <Summary icon={<User size={16} />} label="Con" value={barber?.name || 'Cualquiera'} />}
          <Summary icon={<CalendarDays size={16} />} label="Día" value={date ? formatDateLong(date) : '—'} />
          <Summary icon={<Clock size={16} />} label="Hora" value={time ? formatTime12(time) : '—'} />
        </ul>
        {service && (
          <p className="mt-6 border-t border-white/15 pt-4 font-heading text-lg">
            {formatPrice(service.price, service.priceFrom)}
          </p>
        )}
      </aside>
    </div>
  )
}

function Row({ label, value, strong, capitalize }: { label: string; value: string; strong?: boolean; capitalize?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/55">{label}</dt>
      <dd className={`text-right ${strong ? 'font-mono text-base font-bold tracking-widest text-barber' : 'font-medium text-navy'} ${capitalize ? 'first-letter:uppercase' : ''}`}>
        {value}
      </dd>
    </div>
  )
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 text-barber-light">{icon}</span>
      <span>
        <span className="block text-xs uppercase tracking-widest text-paper/50">{label}</span>
        <span className="first-letter:uppercase">{value}</span>
      </span>
    </li>
  )
}

function BarberBtn({ active, onClick, name, role }: { active: boolean; onClick: () => void; name: string; role?: string | null }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border-2 p-4 text-left transition hover:border-navy ${active ? 'border-barber bg-barber/5' : 'border-navy/10'}`}
    >
      <span className="block font-heading text-lg uppercase tracking-wide text-navy">{name}</span>
      {role && <span className="text-sm text-ink/60">{role}</span>}
    </button>
  )
}

function SlotGroups({ slots, selected, onSelect }: { slots: string[]; selected: string | null; onSelect: (t: string) => void }) {
  const groups = [
    { label: 'Mañana', items: slots.filter((s) => Number(s.slice(0, 2)) < 12) },
    { label: 'Tarde', items: slots.filter((s) => Number(s.slice(0, 2)) >= 12) },
  ].filter((g) => g.items.length)
  return (
    <div className="mt-3 space-y-4">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-2 text-xs uppercase tracking-widest text-ink/50">{g.label}</p>
          <div className="grid grid-cols-3 gap-2">
            {g.items.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onSelect(t)}
                aria-pressed={selected === t}
                className={`whitespace-nowrap rounded-xl border-2 px-1 py-2.5 text-[13px] font-medium transition ${
                  selected === t ? 'border-barber bg-barber text-white' : 'border-navy/15 text-navy hover:border-navy'
                }`}
              >
                {formatTime12(t).replace(' a. m.', ' am').replace(' p. m.', ' pm')}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function MonthCalendar({
  from,
  to,
  available,
  selected,
  onSelect,
}: {
  from: string
  to: string
  available: string[]
  selected: string | null
  onSelect: (d: string) => void
}) {
  const avail = useMemo(() => new Set(available), [available])
  const first = available[0] || from
  const [ym, setYm] = useState(() => first.slice(0, 7))
  const [y, m] = ym.split('-').map(Number)

  const minYm = from.slice(0, 7)
  const maxYm = to.slice(0, 7)
  const shift = (delta: number) => {
    const d = new Date(Date.UTC(y, m - 1 + delta, 1))
    setYm(d.toISOString().slice(0, 7))
  }

  const startWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const offset = (startWeekday + 6) % 7 // lunes primero
  const cells: (string | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${ym}-${String(d).padStart(2, '0')}`)

  const order = [...WEEKDAYS.slice(1), WEEKDAYS[0]]

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} disabled={ym <= minYm} className="rounded-full p-2 text-navy hover:bg-navy/5 disabled:opacity-20" aria-label="Mes anterior">
          <ChevronLeft size={20} />
        </button>
        <p className="font-heading uppercase tracking-widest text-navy">
          {MONTHS[m - 1]} {y}
        </p>
        <button type="button" onClick={() => shift(1)} disabled={ym >= maxYm} className="rounded-full p-2 text-navy hover:bg-navy/5 disabled:opacity-20" aria-label="Mes siguiente">
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {order.map((d) => (
          <span key={d.key} className="py-1 text-xs uppercase text-ink/45">
            {d.short}
          </span>
        ))}
        {cells.map((c, i) => {
          if (!c) return <span key={`e${i}`} />
          const ok = avail.has(c)
          const isSel = c === selected
          return (
            <button
              key={c}
              type="button"
              disabled={!ok}
              onClick={() => onSelect(c)}
              aria-pressed={isSel}
              aria-label={formatDateLong(c)}
              className={`aspect-square rounded-xl text-sm font-medium transition ${
                isSel
                  ? 'bg-barber text-white'
                  : ok
                    ? 'bg-hummingbird/10 text-navy hover:bg-hummingbird/25'
                    : 'text-ink/25 line-through decoration-ink/20'
              }`}
            >
              {Number(c.slice(8))}
            </button>
          )
        })}
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-ink/55">
        <span className="inline-block h-3 w-3 rounded bg-hummingbird/25" /> Días con horarios disponibles
      </p>
    </div>
  )
}
