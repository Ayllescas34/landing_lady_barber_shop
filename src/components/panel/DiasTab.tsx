'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { closeDays, openDay, removeSpecialDay } from '@/app/(panel)/panel/actions'
import type { DayInfo } from '@/lib/monthData'
import { MONTHS, TIME_OPTIONS, WEEKDAYS, formatDateLong, formatTime12 } from '@/lib/time'
import Sheet from './Sheet'

const STYLE: Record<DayInfo['state'], string> = {
  open: 'bg-green-100 text-green-900',
  'special-open': 'bg-teal-200 text-teal-900',
  closed: 'bg-gray-100 text-gray-400',
  blocked: 'bg-red-100 text-red-800 line-through',
}

const shortDate = (k: string) => {
  const [, m, d] = k.split('-').map(Number)
  return `${d} de ${MONTHS[m - 1]}`
}

export default function DiasTab({
  month,
  today,
  days,
  mode,
  bookingEnabled,
}: {
  month: string
  today: string
  days: DayInfo[]
  mode: 'weekly' | 'manual'
  bookingEnabled: boolean
}) {
  const [selected, setSelected] = useState<DayInfo | null>(null)
  const [y, m] = month.split('-').map(Number)
  const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7
  const shift = (delta: number) => new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7)
  const canGoBack = month > today.slice(0, 7)
  const order = [...WEEKDAYS.slice(1), WEEKDAYS[0]]

  return (
    <div className="space-y-4">
      <p className="text-[16px] text-gray-600">Toca un día para <b>abrirlo o cerrarlo</b> para reservas.</p>

      {!bookingEnabled && (
        <Link href="/panel?tab=mas" className="block rounded-2xl bg-red-100 p-4 text-[15px] text-red-800">
          ⚠️ Las reservas en línea están <b>pausadas</b>. Toca para activarlas.
        </Link>
      )}

      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          {canGoBack ? (
            <Link href={`/panel?tab=dias&mes=${shift(-1)}`} className="rounded-full bg-gray-100 p-3" aria-label="Mes anterior">
              <ChevronLeft />
            </Link>
          ) : (
            <span className="w-12" />
          )}
          <h2 className="text-xl font-bold capitalize text-navy">
            {MONTHS[m - 1]} {y}
          </h2>
          <Link href={`/panel?tab=dias&mes=${shift(1)}`} className="rounded-full bg-gray-100 p-3" aria-label="Mes siguiente">
            <ChevronRight />
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {order.map((d) => (
            <span key={d.key} className="pb-1 text-[12px] font-bold uppercase text-gray-400">
              {d.short}
            </span>
          ))}
          {Array.from({ length: offset }).map((_, i) => (
            <span key={`e${i}`} />
          ))}
          {days.map((d) => {
            const past = d.key < today
            return (
              <button
                key={d.key}
                type="button"
                disabled={past}
                onClick={() => setSelected(d)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-[17px] font-bold ${
                  past ? 'text-gray-300' : STYLE[d.state]
                } ${d.key === today ? 'ring-2 ring-navy' : ''}`}
                aria-label={formatDateLong(d.key)}
              >
                {Number(d.key.slice(8))}
                {d.count > 0 && !past && (
                  <span
                    className={`absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full px-1 text-[11px] leading-[18px] text-white no-underline ${
                      d.pending ? 'bg-amber-500' : 'bg-navy'
                    }`}
                  >
                    {d.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[14px]">
        <Legend cls="bg-green-100" text="Abierto" />
        <Legend cls="bg-gray-100" text={mode === 'manual' ? 'Cerrado (ábrelo)' : 'No se trabaja'} />
        <Legend cls="bg-red-100" text="Cerrado por ti" />
        <Legend cls="bg-teal-200" text="Abierto especial" />
      </div>

      <Sheet open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? formatDateLong(selected.key) : ''}>
        {selected && <DayActions key={selected.key} day={selected} mode={mode} onDone={() => setSelected(null)} />}
      </Sheet>
    </div>
  )
}

function Legend({ cls, text }: { cls: string; text: string }) {
  return (
    <span className="flex items-center gap-2">
      <i className={`inline-block h-5 w-5 rounded-md ${cls}`} /> {text}
    </span>
  )
}

function DayActions({ day, mode, onDone }: { day: DayInfo; mode: 'weekly' | 'manual'; onDone: () => void }) {
  const router = useRouter()
  const [busy, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [vacation, setVacation] = useState(false)
  const [until, setUntil] = useState('')
  const [note, setNote] = useState('')
  const [from, setFrom] = useState(day.hours?.start || '10:00')
  const [to, setTo] = useState(day.hours?.end || '18:00')
  const isRange = day.special && day.special.startKey !== day.special.endKey

  const go = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn()
      if (!r.ok) return setError(r.error || 'No se pudo guardar')
      router.refresh()
      onDone()
    })

  const close = () => {
    if (
      day.count > 0 &&
      !window.confirm(`Este día tiene ${day.count} cita(s). Cerrarlo NO las cancela; avísales por WhatsApp. ¿Cerrar de todas formas?`)
    )
      return
    go(() => closeDays(day.key, vacation && until ? until : null, note))
  }

  const big = 'w-full rounded-2xl p-4 text-[18px] font-bold'
  const field = 'w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-[17px]'
  const hours = day.hours ? `${formatTime12(day.hours.start)} a ${formatTime12(day.hours.end)}` : ''

  return (
    <div className="space-y-4">
      {day.count > 0 && (
        <Link href="/panel?tab=citas" className="block rounded-xl bg-paper p-3 text-[15px]">
          📋 Este día tiene <b>{day.count}</b> cita{day.count > 1 ? 's' : ''}. Ver citas →
        </Link>
      )}

      {day.state === 'open' && (
        <>
          <p className="text-[17px]">
            ✅ <b>Abierto</b> de {hours}
          </p>
          <input className={field} placeholder="Motivo (opcional): Feriado, evento…" value={note} onChange={(e) => setNote(e.target.value)} />
          <label className="flex items-center gap-3 text-[16px]">
            <input type="checkbox" className="h-6 w-6" checked={vacation} onChange={(e) => setVacation(e.target.checked)} />
            Cerrar varios días (vacaciones)
          </label>
          {vacation && (
            <div>
              <label className="mb-1 block text-[15px] font-semibold text-gray-700">Hasta el día</label>
              <input type="date" className={field} min={day.key} value={until} onChange={(e) => setUntil(e.target.value)} />
            </div>
          )}
          <button type="button" disabled={busy} onClick={close} className={`${big} bg-red-600 text-white`}>
            ⛔ {vacation && until ? `Cerrar hasta el ${shortDate(until)}` : 'Cerrar este día'}
          </button>
        </>
      )}

      {day.state === 'blocked' && (
        <>
          <p className="text-[17px]">
            ⛔ <b>Cerrado</b>
            {day.special?.note ? ` · ${day.special.note}` : ''}
          </p>
          {isRange && (
            <p className="text-[15px] text-gray-600">
              Del {shortDate(day.special!.startKey)} al {shortDate(day.special!.endKey)}.
            </p>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => day.special && go(() => removeSpecialDay(day.special!.id))}
            className={`${big} bg-green-600 text-white`}
          >
            ✅ {isRange ? 'Abrir de nuevo todos esos días' : 'Abrir de nuevo este día'}
          </button>
        </>
      )}

      {day.state === 'special-open' && (
        <>
          <p className="text-[17px]">
            ✅ <b>Abierto especial</b> de {hours}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => day.special && go(() => removeSpecialDay(day.special!.id))}
            className={`${big} bg-gray-200 text-navy`}
          >
            ↺ Quitar (volver a cerrado)
          </button>
        </>
      )}

      {day.state === 'closed' && (
        <>
          <p className="text-[17px]">
            🔒 <b>Cerrado</b>{' '}
            <span className="text-gray-500">{mode === 'manual' ? '(todavía no lo abres)' : '(normalmente no se trabaja)'}</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[15px] font-semibold text-gray-700">Desde</label>
              <select className={field} value={from} onChange={(e) => setFrom(e.target.value)}>
                {TIME_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[15px] font-semibold text-gray-700">Hasta</label>
              <select className={field} value={to} onChange={(e) => setTo(e.target.value)}>
                {TIME_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="button" disabled={busy} onClick={() => go(() => openDay(day.key, from, to))} className={`${big} bg-green-600 text-white`}>
            ✅ Abrir este día para citas
          </button>
        </>
      )}

      {error && <p className="font-semibold text-barber">{error}</p>}
    </div>
  )
}
