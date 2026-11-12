import type { Metadata } from 'next'
import Link from 'next/link'
import crypto from 'crypto'
import PageHeader from '@/components/site/PageHeader'
import CancelAppointment from '@/components/site/CancelAppointment'
import { getPayloadClient } from '@/lib/payload'
import { getSite } from '@/lib/data'
import { waLink } from '@/lib/format'
import { formatDateLong, formatTime12, todayKey } from '@/lib/time'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Mi cita | Lady Barbershop', robots: { index: false, follow: false } }

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Por confirmar', cls: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Confirmada', cls: 'bg-teal-100 text-teal-800' },
  completed: { label: 'Atendida', cls: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelada', cls: 'bg-gray-200 text-gray-600' },
  noshow: { label: 'No asistió', cls: 'bg-red-100 text-red-700' },
}

function sameToken(a: string, b: string) {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb)
}

/** Página del enlace "Ver o cancelar mi cita" que llega por correo. */
export default async function MiCitaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const [{ id }, { t }] = await Promise.all([params, searchParams])
  const payload = await getPayloadClient()
  const appt = /^\d+$/.test(id)
    ? await payload.findByID({ collection: 'appointments', id: Number(id), depth: 1 }).catch(() => null)
    : null
  const valid = Boolean(appt?.manageToken && t && sameToken(t, appt.manageToken))
  const site = await getSite()

  if (!appt || !valid) {
    return (
      <>
        <PageHeader eyebrow="Mi cita" title="Enlace no válido" />
        <section className="paper-texture py-14">
          <div className="mx-auto max-w-lg px-4 text-center">
            <p className="text-ink/75">No encontramos esta cita. Revisa que el enlace del correo esté completo.</p>
            <Link href="/reservar" className="btn-primary mt-6">Reservar una cita</Link>
          </div>
        </section>
      </>
    )
  }

  const st = STATUS[appt.status] || STATUS.pending
  const service = typeof appt.service === 'object' && appt.service ? appt.service.name : 'Cita'
  const canCancel = (appt.status === 'pending' || appt.status === 'confirmed') && (appt.dateKey || '') >= todayKey()
  const wa = waLink(site?.whatsapp, `Hola, tengo una pregunta sobre mi cita (código ${appt.code}).`)

  return (
    <>
      <PageHeader eyebrow="Mi cita" title={`Hola, ${appt.customerName.split(' ')[0]}`} />
      <section className="paper-texture py-12">
        <div className="mx-auto max-w-lg px-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-navy/10 sm:p-8">
            <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${st.cls}`}>{st.label}</span>
            <dl className="mt-5 space-y-3 text-[15px]">
              <Row label="Servicio" value={service} />
              <Row label="Día" value={formatDateLong(appt.dateKey || '')} capitalize />
              <Row label="Hora" value={formatTime12(appt.time)} />
              <Row label="Dirección" value={site?.address || 'Antigua Guatemala'} />
              <Row label="Código" value={appt.code || ''} mono />
            </dl>

            {canCancel ? (
              <CancelAppointment id={String(appt.id)} token={t!} />
            ) : (
              <p className="mt-6 rounded-xl bg-paper p-4 text-sm text-ink/70">
                {appt.status === 'cancelled' ? 'Esta cita está cancelada.' : 'Esta cita ya no se puede modificar en línea.'}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white hover:brightness-95">
                  Escribir por WhatsApp
                </a>
              )}
              <Link href="/reservar" className="btn-navy">Reservar otra cita</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function Row({ label, value, capitalize, mono }: { label: string; value: string; capitalize?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-navy/10 pb-3">
      <dt className="text-ink/55">{label}</dt>
      <dd
        className={`text-right font-semibold text-navy ${capitalize ? 'first-letter:uppercase' : ''} ${
          mono ? 'font-mono tracking-widest text-barber' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  )
}
