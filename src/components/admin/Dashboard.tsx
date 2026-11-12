import type { Payload, TypedUser } from 'payload'
import { Gutter } from '@payloadcms/ui'
import React from 'react'
import type { Appointment } from '../../payload-types'
import { addDays, formatDateLong, todayKey } from '../../lib/time'
import AppointmentCard from './AppointmentCard'
import { sortAppts, toAdminAppt } from './toAdminAppt'

type Props = { payload: Payload; user?: TypedUser | null }

function greeting() {
  const h = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Guatemala', hour: '2-digit', hourCycle: 'h23' }).format(new Date()),
  )
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/** Pantalla de inicio del panel: lo más usado a un clic. */
export default async function Dashboard({ payload, user }: Props) {
  const today = todayKey()
  const tomorrow = addDays(today, 1)

  const [todayRes, tomorrowRes, pending, weekCount, inquiries, site] = await Promise.all([
    payload.find({
      collection: 'appointments',
      depth: 1,
      limit: 100,
      pagination: false,
      where: { and: [{ dateKey: { equals: today } }, { status: { not_equals: 'cancelled' } }] },
    }),
    payload.count({
      collection: 'appointments',
      where: { and: [{ dateKey: { equals: tomorrow } }, { status: { in: ['pending', 'confirmed'] } }] },
    }),
    payload.find({
      collection: 'appointments',
      depth: 1,
      limit: 20,
      sort: 'dateKey',
      where: { and: [{ status: { equals: 'pending' } }, { dateKey: { greater_than_equal: today } }] },
    }),
    payload.count({
      collection: 'appointments',
      where: {
        and: [
          { dateKey: { greater_than_equal: today } },
          { dateKey: { less_than_equal: addDays(today, 7) } },
          { status: { in: ['pending', 'confirmed'] } },
        ],
      },
    }),
    payload.count({ collection: 'inquiries', where: { status: { equals: 'new' } } }),
    payload.findGlobal({ slug: 'site-info', depth: 0 }).catch(() => null),
  ])

  const businessName = site?.businessName || 'Lady Barbershop'
  const todays = sortAppts((todayRes.docs as Appointment[]).map(toAdminAppt))
  const pendingList = sortAppts((pending.docs as Appointment[]).map(toAdminAppt)).filter((a) => a.dateKey !== today)
  const name = (user as { name?: string } | null)?.name?.split(' ')[0]

  const stat = (value: number, label: string, href: string, color: string) => (
    <a className="lb-stat" href={href} style={{ ['--lb-accent' as string]: color }}>
      <strong>{value}</strong>
      <span>{label}</span>
    </a>
  )

  const action = (emoji: string, title: string, text: string, href: string, badge?: number, newTab?: boolean) => (
    <a className="lb-action" href={href} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      <span className="lb-emoji" aria-hidden>{emoji}</span>
      <span>
        <strong>
          {title}
          {badge ? <span className="lb-badge">{badge}</span> : null}
        </strong>
        <small>{text}</small>
      </span>
    </a>
  )

  return (
    <Gutter className="lb-page">
      <div className="lb-hello">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.webp" alt="" />
        <div>
          <h1>
            {greeting()}
            {name ? `, ${name}` : ''} 👋
          </h1>
          <p>Hoy es {formatDateLong(today)}</p>
        </div>
      </div>

      <div className="lb-stats">
        {stat(todays.filter((a) => a.status !== 'noshow').length, 'Citas de hoy', '/admin/calendario', '#1e2b45')}
        {stat(pending.totalDocs, 'Por confirmar', '#por-confirmar', '#d4a017')}
        {stat(tomorrowRes.totalDocs, 'Citas mañana', `/admin/calendario?dia=${tomorrow}`, '#2e9c95')}
        {stat(weekCount.totalDocs, 'Próximos 7 días', '/admin/calendario', '#4f8a4c')}
        {stat(inquiries.totalDocs, 'Mensajes nuevos', '/admin/collections/inquiries?where[status][equals]=new', '#a63a3f')}
      </div>

      <h2 className="lb-section-title">¿Qué quieres hacer?</h2>
      <div className="lb-actions">
        {action('📅', 'Ver calendario de citas', 'Ver citas por día, confirmar, cancelar o agregar una cita.', '/admin/calendario')}
        {action('⛔', 'Cerrar un día o vacaciones', 'Toca un día en el calendario para cerrarlo o abrirlo.', '/admin/calendario')}
        {action('🕐', 'Cambiar mi horario', 'Días y horas de atención, almuerzo y reglas de reserva.', '/admin/globals/booking-settings')}
        {action('✂️', 'Servicios y precios', 'Cambiar precios, duración o agregar servicios.', '/admin/collections/services')}
        {action('📸', 'Subir fotos a la galería', 'Puedes subir varias fotos a la vez.', '/admin/collections/gallery/create')}
        {action('🛍️', 'Productos del catálogo', 'Agregar productos, precios, ofertas y fotos.', '/admin/collections/products')}
        {action('💬', 'Mensajes recibidos', 'Preguntas que llegaron desde la página web.', '/admin/collections/inquiries', inquiries.totalDocs)}
        {action('✏️', 'Textos, contacto y horario', 'WhatsApp, redes, dirección, portada y anuncios.', '/admin/globals/site-info')}
        {action('⭐', 'Reseñas de clientes', 'Agregar opiniones para mostrar en la página.', '/admin/collections/testimonials')}
        {action('🌐', 'Ver mi página web', 'Abre la página tal como la ven tus clientes.', '/', undefined, true)}
      </div>

      <h2 className="lb-section-title">Citas de hoy</h2>
      {todays.length === 0 ? (
        <div className="lb-card lb-muted">No hay citas para hoy.</div>
      ) : (
        todays.map((a) => <AppointmentCard key={a.id} appt={a} businessName={businessName} />)
      )}

      {pendingList.length > 0 && (
        <>
          <h2 className="lb-section-title" id="por-confirmar">
            Próximas citas por confirmar
          </h2>
          <p className="lb-muted" style={{ marginTop: -6 }}>
            Tip: toca “WhatsApp al cliente” para enviarle la confirmación y luego “Confirmar”.
          </p>
          {pendingList.map((a) => (
            <AppointmentCard key={a.id} appt={a} businessName={businessName} showDate />
          ))}
        </>
      )}

      <details className="lb-card lb-help" style={{ marginTop: 32 }}>
        <summary>❓ Ayuda rápida</summary>
        <ul>
          <li><b>Llegó una cita nueva:</b> aparece en “Por confirmar”. Escríbele por WhatsApp y toca “Confirmar”.</li>
          <li><b>Cerrar un día:</b> ve al Calendario, toca el día y presiona “Cerrar este día”. Las citas ya hechas no se borran.</li>
          <li><b>Abrir un día que normalmente está cerrado:</b> en el Calendario toca ese día y presiona “Abrir este día”.</li>
          <li><b>Alguien reservó por teléfono:</b> en el Calendario toca el día y usa “Agregar cita”, así ese horario queda ocupado en la web.</li>
          <li><b>Cambiar un precio:</b> “Servicios y precios” → toca el servicio → cambia el precio → “Guardar”.</li>
          <li><b>Si cancelas una cita</b> o marcas “No vino”, ese horario vuelve a quedar libre en la página.</li>
          <li>Los cambios en la página web se ven al momento de guardar.</li>
        </ul>
      </details>
    </Gutter>
  )
}
