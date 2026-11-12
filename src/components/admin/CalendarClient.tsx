'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  MONTHS,
  TIME_OPTIONS,
  WEEKDAYS,
  dateKeyToISO,
  formatDateLong,
  formatTime12,
  timeToMinutes,
} from '../../lib/time'
import AppointmentCard, { type AdminAppt } from './AppointmentCard'
import { api } from './api'

export type { DayInfo } from '../../lib/monthData'
import type { DayInfo } from '../../lib/monthData'

type Opt = { id: number; name: string; duration?: number }

const STATE_LABEL: Record<DayInfo['state'], string> = {
  open: 'Abierto',
  'special-open': 'Abierto especial',
  closed: 'Cerrado',
  blocked: 'Bloqueado',
}

const shortDate = (k: string) => {
  const [, m, d] = k.split('-').map(Number)
  return `${d} de ${MONTHS[m - 1]}`
}

export default function CalendarClient({
  month,
  today,
  selected: initialSelected,
  days,
  appts,
  mode,
  bookingEnabled,
  services,
  team,
  businessName,
}: {
  month: string
  today: string
  selected: string
  days: DayInfo[]
  appts: AdminAppt[]
  mode: 'weekly' | 'manual'
  bookingEnabled: boolean
  services: Opt[]
  team: Opt[]
  businessName: string
}) {
  const router = useRouter()
  const [selected, setSelected] = useState(
    initialSelected.startsWith(month) ? initialSelected : `${month}-01`,
  )
  useEffect(() => {
    setSelected(initialSelected.startsWith(month) ? initialSelected : `${month}-01`)
  }, [initialSelected, month])

  const [y, m] = month.split('-').map(Number)
  const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7

  function go(delta: number) {
    const d = new Date(Date.UTC(y, m - 1 + delta, 1))
    const ym = d.toISOString().slice(0, 7)
    router.push(`/admin/calendario?mes=${ym}${today.startsWith(ym) ? `&dia=${today}` : ''}`)
  }

  function pick(key: string) {
    setSelected(key)
    window.history.replaceState(null, '', `/admin/calendario?mes=${month}&dia=${key}`)
  }

  const day = days.find((d) => d.key === selected) || days[0]
  const dayAppts = appts
    .filter((a) => a.dateKey === day.key)
    .sort((a, b) => {
      const inactive = (s: string) => (s === 'cancelled' || s === 'noshow' ? 1 : 0)
      return inactive(a.status) - inactive(b.status) || a.time.localeCompare(b.time)
    })

  const order = [...WEEKDAYS.slice(1), WEEKDAYS[0]]

  return (
    <>
      <div className="lb-hello" style={{ marginBottom: 16 }}>
        <div>
          <h1>📅 Calendario de citas</h1>
          <p style={{ textTransform: 'none' }}>
            Toca un día para ver sus citas, agregar una cita, o abrir / cerrar ese día para reservas.
          </p>
        </div>
      </div>

      {!bookingEnabled && (
        <div className="lb-banner" style={{ background: 'rgba(166,58,63,0.12)' }}>
          <span>⚠️ Las reservas en línea están <b>pausadas</b>. Los clientes no pueden reservar desde la web.</span>
          <a className="lb-btn" href="/admin/globals/booking-settings">Activarlas</a>
        </div>
      )}
      {mode === 'manual' && (
        <div className="lb-banner">
          <span>
            Modo actual: <b>solo los días que tú abras</b>. Los días en gris no aceptan citas hasta que los abras.
          </span>
          <a className="lb-btn" href="/admin/globals/booking-settings">Cambiar modo</a>
        </div>
      )}

      <div className="lb-cal-layout">
        <div className="lb-card">
          <div className="lb-cal-head">
            <button type="button" className="lb-btn" onClick={() => go(-1)} aria-label="Mes anterior">
              ◀
            </button>
            <h2>
              {MONTHS[m - 1]} {y}
            </h2>
            <div style={{ display: 'flex', gap: 6 }}>
              {!today.startsWith(month) && (
                <button
                  type="button"
                  className="lb-btn"
                  onClick={() => router.push(`/admin/calendario?mes=${today.slice(0, 7)}&dia=${today}`)}
                >
                  Hoy
                </button>
              )}
              <button type="button" className="lb-btn" onClick={() => go(1)} aria-label="Mes siguiente">
                ▶
              </button>
            </div>
          </div>

          <div className="lb-cal-grid">
            {order.map((d) => (
              <div key={d.key} className="lb-cal-dow">
                {d.short}
              </div>
            ))}
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {days.map((d) => {
              const cls = [
                'lb-day',
                `lb-day--${d.state}`,
                d.key < today ? 'lb-day--past' : '',
                d.key === today ? 'lb-day--today' : '',
                d.key === selected ? 'lb-day--selected' : '',
              ].join(' ')
              return (
                <button key={d.key} type="button" className={cls} onClick={() => pick(d.key)} aria-label={formatDateLong(d.key)}>
                  <span className="lb-day-num">{Number(d.key.slice(8))}</span>
                  {d.count > 0 && (
                    <span className="lb-day-count" style={d.pending ? { background: '#d4a017' } : undefined}>
                      {d.count}
                    </span>
                  )}
                  <span className="lb-day-label">{STATE_LABEL[d.state]}</span>
                </button>
              )
            })}
          </div>

          <div className="lb-legend">
            <span><i style={{ background: 'rgba(79,138,76,0.35)' }} /> Abierto</span>
            <span><i style={{ background: 'rgba(46,156,149,0.45)' }} /> Abierto especial</span>
            <span><i style={{ background: 'rgba(166,58,63,0.35)' }} /> Bloqueado</span>
            <span><i style={{ background: 'var(--theme-elevation-150)' }} /> Cerrado</span>
            <span><i style={{ background: '#1e2b45', borderRadius: 999 }} /> Nº de citas</span>
            <span><i style={{ background: '#d4a017', borderRadius: 999 }} /> Hay por confirmar</span>
          </div>
        </div>

        <div className="lb-card lb-day-panel">
          <h3>{formatDateLong(day.key)}</h3>
          <DayStatus key={day.key} day={day} today={today} mode={mode} activeCount={day.count} />

          <h4 style={{ margin: '8px 0 10px', fontSize: 16 }}>
            Citas {dayAppts.length ? `(${dayAppts.length})` : ''}
          </h4>
          {dayAppts.length === 0 && <p className="lb-muted">No hay citas este día.</p>}
          {dayAppts.map((a) => (
            <AppointmentCard key={a.id} appt={a} businessName={businessName} />
          ))}

          {day.key >= today && (
            <QuickAdd key={`add-${day.key}`} day={day} services={services} team={team} appts={dayAppts} />
          )}
        </div>
      </div>
    </>
  )
}

/* ---------------- Estado del día: abrir / cerrar ---------------- */

function DayStatus({
  day,
  today,
  mode,
  activeCount,
}: {
  day: DayInfo
  today: string
  mode: 'weekly' | 'manual'
  activeCount: number
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [start, setStart] = useState(day.hours?.start || '10:00')
  const [end, setEnd] = useState(day.hours?.end || '18:00')
  const [note, setNote] = useState('')
  const [until, setUntil] = useState('')
  const past = day.key < today
  const isRange = day.special && day.special.startKey !== day.special.endKey

  async function run(fn: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await fn()
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const warnAppts = () =>
    activeCount === 0 ||
    window.confirm(
      `Este día tiene ${activeCount} cita(s). Cerrar el día NO las cancela: avísales por WhatsApp o cancélalas abajo. ¿Cerrar de todas formas?`,
    )

  const closeDay = () => {
    if (!warnAppts()) return
    const endKey = until && until > day.key ? until : null
    run(() =>
      api.createSpecialDay({
        type: 'closed',
        startDate: dateKeyToISO(day.key),
        endDate: endKey ? dateKeyToISO(endKey) : null,
        note: note || (endKey ? 'Vacaciones' : 'Cerrado'),
      }),
    )
  }

  const openDay = () => {
    if (timeToMinutes(end) <= timeToMinutes(start)) {
      setError('La hora de cierre debe ser después de la de apertura.')
      return
    }
    run(() => api.createSpecialDay({ type: 'open', startDate: dateKeyToISO(day.key), start, end, note: note || null }))
  }

  const removeSpecial = () => {
    if (!day.special) return
    if (isRange && !window.confirm(`Esto quitará todo el periodo del ${shortDate(day.special.startKey)} al ${shortDate(day.special.endKey)}. ¿Continuar?`))
      return
    run(() => api.deleteSpecialDay(day.special!.id))
  }

  const hoursText = day.hours ? `de ${formatTime12(day.hours.start)} a ${formatTime12(day.hours.end)}` : ''
  const timeSelect = (value: string, set: (v: string) => void, label: string) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 14 }}>
      {label}
      <select value={value} onChange={(e) => set(e.target.value)}>
        {TIME_OPTIONS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </label>
  )

  let box: React.ReactNode
  if (day.state === 'open') {
    box = (
      <div className="lb-status-box" style={{ background: 'rgba(79,138,76,0.12)' }}>
        <p>✅ <b>Abierto para citas</b> {hoursText} <span className="lb-muted">(según tu horario semanal)</span></p>
        {!past && (
          <>
            <div className="lb-row" style={{ marginBottom: 8 }}>
              <input
                className="lb-input"
                placeholder="Motivo (opcional), ej. Feriado"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ flex: 1, minWidth: 160, border: '1px solid var(--theme-elevation-250)', borderRadius: 8, padding: '8px 10px', font: 'inherit' }}
              />
            </div>
            <div className="lb-row">
              <button type="button" className="lb-btn lb-btn--red lb-btn--big" disabled={busy} onClick={closeDay}>
                ⛔ {until ? 'Cerrar estos días' : 'Cerrar este día'}
              </button>
              <label className="lb-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                hasta (vacaciones):
                <input
                  type="date"
                  value={until}
                  min={day.key}
                  onChange={(e) => setUntil(e.target.value)}
                  style={{ border: '1px solid var(--theme-elevation-250)', borderRadius: 8, padding: '6px 8px', font: 'inherit' }}
                />
              </label>
            </div>
          </>
        )}
      </div>
    )
  } else if (day.state === 'special-open') {
    box = (
      <div className="lb-status-box" style={{ background: 'rgba(46,156,149,0.15)' }}>
        <p>✅ <b>Abierto especialmente</b> {hoursText}{day.special?.note ? ` · ${day.special.note}` : ''}</p>
        {isRange && <p className="lb-muted">Parte del periodo del {shortDate(day.special!.startKey)} al {shortDate(day.special!.endKey)}.</p>}
        {!past && (
          <button type="button" className="lb-btn" disabled={busy} onClick={removeSpecial}>
            ↺ Quitar apertura especial
          </button>
        )}
      </div>
    )
  } else if (day.state === 'blocked') {
    box = (
      <div className="lb-status-box" style={{ background: 'rgba(166,58,63,0.12)' }}>
        <p>⛔ <b>Cerrado</b>{day.special?.note ? `: ${day.special.note}` : ''}</p>
        {isRange && <p className="lb-muted">Cerrado del {shortDate(day.special!.startKey)} al {shortDate(day.special!.endKey)}.</p>}
        {!past && (
          <button type="button" className="lb-btn lb-btn--green lb-btn--big" disabled={busy} onClick={removeSpecial}>
            ✅ {isRange ? 'Quitar el cierre (todo el periodo)' : 'Volver a abrir este día'}
          </button>
        )}
      </div>
    )
  } else {
    box = (
      <div className="lb-status-box" style={{ background: 'var(--theme-elevation-50)' }}>
        <p>
          🔒 <b>Cerrado</b>{' '}
          <span className="lb-muted">
            {mode === 'manual' ? '(aún no lo has abierto para citas)' : '(no es día de atención en tu horario semanal)'}
          </span>
        </p>
        {!past && (
          <>
            <div className="lb-row" style={{ marginBottom: 10 }}>
              {timeSelect(start, setStart, 'Desde')}
              {timeSelect(end, setEnd, 'Hasta')}
            </div>
            <button type="button" className="lb-btn lb-btn--green lb-btn--big" disabled={busy} onClick={openDay}>
              ✅ Abrir este día para citas
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <>
      {box}
      {error && <p className="lb-error">{error}</p>}
    </>
  )
}

/* ---------------- Agregar cita rápida ---------------- */

function QuickAdd({
  day,
  services,
  team,
  appts,
}: {
  day: DayInfo
  services: Opt[]
  team: Opt[]
  appts: AdminAppt[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const times = TIME_OPTIONS.filter((t) =>
    day.hours ? t.value >= day.hours.start && t.value < day.hours.end : true,
  )

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const time = String(fd.get('time'))
    const serviceId = Number(fd.get('service')) || undefined
    const svc = services.find((s) => s.id === serviceId)
    const start = timeToMinutes(time)
    const end = start + (svc?.duration || 30)
    const clash = appts.some((a) => {
      if (a.status === 'cancelled' || a.status === 'noshow') return false
      const s = timeToMinutes(a.time)
      return s < end && s + (a.duration || 30) > start
    })
    if (clash && !window.confirm('Ya hay una cita que se cruza con ese horario. ¿Agregarla de todas formas?')) return

    setBusy(true)
    setError(null)
    try {
      await api.createAppointment({
        customerName: String(fd.get('name')),
        phone: String(fd.get('phone')),
        service: serviceId,
        barber: Number(fd.get('barber')) || undefined,
        date: dateKeyToISO(day.key),
        time,
        status: 'confirmed',
        source: String(fd.get('source') || 'admin'),
      })
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button type="button" className="lb-btn lb-btn--primary lb-btn--big" style={{ marginTop: 8, width: '100%' }} onClick={() => setOpen(true)}>
        ➕ Agregar cita este día
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="lb-card" style={{ marginTop: 12, background: 'var(--theme-elevation-50)' }}>
      <h4 style={{ margin: '0 0 10px', fontSize: 16 }}>➕ Nueva cita · {shortDate(day.key)}</h4>
      <div className="lb-form">
        <div className="lb-full">
          <label htmlFor="qa-name">Nombre del cliente *</label>
          <input id="qa-name" name="name" required minLength={2} />
        </div>
        <div>
          <label htmlFor="qa-phone">Teléfono *</label>
          <input id="qa-phone" name="phone" required inputMode="tel" />
        </div>
        <div>
          <label htmlFor="qa-time">Hora *</label>
          <select id="qa-time" name="time" required defaultValue={times[0]?.value}>
            {times.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="lb-full">
          <label htmlFor="qa-service">Servicio</label>
          <select id="qa-service" name="service" defaultValue={services[0]?.id}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.duration} min)
              </option>
            ))}
          </select>
        </div>
        {team.length > 1 && (
          <div>
            <label htmlFor="qa-barber">Con</label>
            <select id="qa-barber" name="barber" defaultValue="">
              <option value="">Cualquiera</option>
              {team.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="qa-source">¿Cómo reservó?</label>
          <select id="qa-source" name="source" defaultValue="whatsapp">
            <option value="whatsapp">WhatsApp</option>
            <option value="walkin">En persona</option>
            <option value="admin">Llamada / otro</option>
          </select>
        </div>
      </div>
      {error && <p className="lb-error">{error}</p>}
      <div className="lb-row" style={{ marginTop: 12 }}>
        <button type="submit" className="lb-btn lb-btn--green lb-btn--big" disabled={busy}>
          Guardar cita
        </button>
        <button type="button" className="lb-btn" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
