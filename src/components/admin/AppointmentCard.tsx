'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { formatDateLong, formatTime12 } from '../../lib/time'
import { api } from './api'

export type AdminAppt = {
  id: string | number
  customerName: string
  phone: string
  time: string
  dateKey: string
  duration?: number | null
  status: string
  notes?: string | null
  serviceName?: string | null
  barberName?: string | null
  code?: string | null
}

export const STATUS_INFO: Record<string, { label: string; color: string }> = {
  pending: { label: 'Por confirmar', color: '#d4a017' },
  confirmed: { label: 'Confirmada', color: '#2e9c95' },
  completed: { label: 'Atendida', color: '#4f8a4c' },
  cancelled: { label: 'Cancelada', color: '#8a8a8a' },
  noshow: { label: 'No vino', color: '#a63a3f' },
}

function waClient(a: AdminAppt, businessName: string) {
  let digits = a.phone.replace(/\D/g, '')
  if (digits.length === 8) digits = `502${digits}` // número local de Guatemala
  const msg =
    a.status === 'cancelled'
      ? `Hola ${a.customerName}, te escribimos de ${businessName} sobre tu cita del ${formatDateLong(a.dateKey)} a las ${formatTime12(a.time)}.`
      : `Hola ${a.customerName} 👋, te confirmamos tu cita en ${businessName} el ${formatDateLong(a.dateKey)} a las ${formatTime12(a.time)}${a.serviceName ? ` (${a.serviceName})` : ''}. ¡Te esperamos!`
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`
}

export default function AppointmentCard({
  appt,
  businessName = 'Lady Barbershop',
  showDate = false,
}: {
  appt: AdminAppt
  businessName?: string
  showDate?: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const info = STATUS_INFO[appt.status] || STATUS_INFO.pending

  async function setStatus(status: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(true)
    setError(null)
    try {
      await api.updateAppointment(appt.id, { status })
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const active = appt.status === 'pending' || appt.status === 'confirmed'

  return (
    <div className="lb-appt" style={{ ['--lb-status' as string]: info.color }}>
      <div className="lb-appt-head">
        <div>
          <div className="lb-appt-time">
            {formatTime12(appt.time)}
            {showDate && (
              <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.7, marginLeft: 8, textTransform: 'capitalize' }}>
                {formatDateLong(appt.dateKey)}
              </span>
            )}
          </div>
          <div className="lb-appt-name">{appt.customerName}</div>
          <div className="lb-appt-meta">
            {appt.serviceName || 'Sin servicio'}
            {appt.duration ? ` · ${appt.duration} min` : ''}
            {appt.barberName ? ` · con ${appt.barberName}` : ''} · 📞 {appt.phone}
          </div>
        </div>
        <span className="lb-pill">{info.label}</span>
      </div>

      {appt.notes && <div className="lb-appt-notes">💬 {appt.notes}</div>}

      <div className="lb-appt-actions">
        {appt.status === 'pending' && (
          <button type="button" className="lb-btn lb-btn--green" disabled={busy} onClick={() => setStatus('confirmed')}>
            ✓ Confirmar
          </button>
        )}
        {active && (
          <button type="button" className="lb-btn" disabled={busy} onClick={() => setStatus('completed')}>
            ✂️ Ya se atendió
          </button>
        )}
        <a className="lb-btn lb-btn--wa" href={waClient(appt, businessName)} target="_blank" rel="noopener noreferrer">
          WhatsApp al cliente
        </a>
        {active && (
          <button type="button" className="lb-btn" disabled={busy} onClick={() => setStatus('noshow')}>
            No vino
          </button>
        )}
        {active && (
          <button
            type="button"
            className="lb-btn lb-btn--red"
            disabled={busy}
            onClick={() => setStatus('cancelled', `¿Cancelar la cita de ${appt.customerName}? El horario quedará libre.`)}
          >
            ✕ Cancelar
          </button>
        )}
        {!active && (
          <button type="button" className="lb-btn" disabled={busy} onClick={() => setStatus('confirmed')}>
            ↺ Reactivar
          </button>
        )}
        <a className="lb-btn" href={`/admin/collections/appointments/${appt.id}`}>
          ✏️ Editar
        </a>
      </div>
      {error && <p className="lb-error">{error}</p>}
    </div>
  )
}
