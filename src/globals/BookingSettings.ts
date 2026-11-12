import type { Field, GlobalConfig } from 'payload'
import { TIME_OPTIONS, WEEKDAYS } from '../lib/time'
import { revalidateSite } from '../lib/revalidate'

// Horario inicial tomado del perfil de Instagram
const DEFAULT_HOURS: Record<string, { open: boolean; start: string; end: string }> = {
  monday: { open: true, start: '10:00', end: '19:00' },
  tuesday: { open: true, start: '10:00', end: '17:30' },
  wednesday: { open: true, start: '10:00', end: '19:00' },
  thursday: { open: true, start: '10:00', end: '19:00' },
  friday: { open: true, start: '10:00', end: '19:00' },
  saturday: { open: true, start: '10:00', end: '18:30' },
  sunday: { open: false, start: '10:00', end: '18:00' },
}

// Lunes primero para el panel
const ORDERED = [...WEEKDAYS.slice(1), WEEKDAYS[0]]

const dayFields: Field[] = ORDERED.map((d) => ({
  name: d.key,
  type: 'group',
  label: d.label,
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'open',
          type: 'checkbox',
          label: 'Atiende',
          defaultValue: DEFAULT_HOURS[d.key].open,
        },
        {
          name: 'start',
          type: 'select',
          label: 'Desde',
          defaultValue: DEFAULT_HOURS[d.key].start,
          options: TIME_OPTIONS,
        },
        {
          name: 'end',
          type: 'select',
          label: 'Hasta',
          defaultValue: DEFAULT_HOURS[d.key].end,
          options: TIME_OPTIONS,
        },
      ],
    },
  ],
}))

export const BookingSettings: GlobalConfig = {
  slug: 'booking-settings',
  label: 'Horario y reglas de citas',
  admin: {
    group: '📅 Agenda',
    description: 'Define qué días y horarios se pueden reservar en línea.',
  },
  access: { read: () => true },
  hooks: { afterChange: [() => revalidateSite()] },
  fields: [
    {
      name: 'bookingEnabled',
      type: 'checkbox',
      label: 'Reservas en línea activas',
      defaultValue: true,
      admin: { description: 'Si lo desactivas, el sitio mostrará solo el botón de WhatsApp.' },
    },
    {
      name: 'mode',
      type: 'radio',
      label: '¿Qué días se pueden reservar?',
      defaultValue: 'weekly',
      options: [
        { label: 'Según mi horario semanal (abajo)', value: 'weekly' },
        { label: 'Solo los días que yo habilite en "Días habilitados / bloqueados"', value: 'manual' },
      ],
      admin: {
        description:
          'En ambos modos puedes bloquear fechas (vacaciones, feriados) desde "Días habilitados / bloqueados".',
      },
    },
    {
      name: 'weekly',
      type: 'group',
      label: 'Horario semanal',
      admin: { condition: (data) => data?.mode !== 'manual' },
      fields: dayFields,
    },
    {
      name: 'lunchBreak',
      type: 'group',
      label: 'Descanso / almuerzo',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'enabled', type: 'checkbox', label: 'Bloquear horario de almuerzo', defaultValue: false },
            { name: 'start', type: 'select', label: 'Desde', defaultValue: '13:00', options: TIME_OPTIONS },
            { name: 'end', type: 'select', label: 'Hasta', defaultValue: '14:00', options: TIME_OPTIONS },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'slotMinutes',
          type: 'select',
          label: 'Intervalo entre horarios',
          defaultValue: '30',
          options: [
            { label: 'Cada 15 min', value: '15' },
            { label: 'Cada 20 min', value: '20' },
            { label: 'Cada 30 min', value: '30' },
            { label: 'Cada 45 min', value: '45' },
            { label: 'Cada hora', value: '60' },
          ],
        },
        {
          name: 'capacity',
          type: 'number',
          label: 'Clientes a la vez',
          defaultValue: 1,
          min: 1,
          admin: { description: 'Cuántas citas simultáneas aceptas (sillas disponibles)' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'minNoticeHours',
          type: 'number',
          label: 'Anticipación mínima (horas)',
          defaultValue: 2,
          min: 0,
        },
        {
          name: 'maxDaysAhead',
          type: 'number',
          label: 'Reservar hasta (días adelante)',
          defaultValue: 30,
          min: 1,
          max: 120,
        },
      ],
    },
    {
      name: 'bookingNotice',
      type: 'textarea',
      label: 'Aviso en la página de reservas',
      defaultValue:
        'Te esperamos 5 minutos antes de tu cita. Si no puedes asistir, avísanos por WhatsApp para liberar el espacio.',
    },
    {
      name: 'successMessage',
      type: 'textarea',
      label: 'Mensaje al confirmar la reserva',
      defaultValue:
        '¡Gracias! Recibimos tu solicitud de cita. Te confirmaremos por WhatsApp a la brevedad.',
    },
  ],
}
