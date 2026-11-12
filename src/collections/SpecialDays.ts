import type { CollectionConfig } from 'payload'
import { TIME_OPTIONS, dateKeyFromISO, formatTime12 } from '../lib/time'

/**
 * Días especiales del calendario:
 * - "Abrir": habilita un día (o rango) para citas con un horario propio.
 *   En modo "Solo días que yo habilite" son los ÚNICOS días con citas.
 * - "Cerrar": bloquea un día o rango (vacaciones, feriados, eventos).
 */
export const SpecialDays: CollectionConfig = {
  slug: 'special-days',
  labels: { singular: 'Día abierto / cerrado', plural: 'Días abiertos / cerrados' },
  admin: {
    useAsTitle: 'label',
    group: '📅 Agenda',
    description:
      'Habilita días para citas o bloquea fechas (vacaciones, feriados). Tiene prioridad sobre el horario semanal.',
    defaultColumns: ['label', 'type', 'note'],
    components: { beforeList: ['/components/admin/CalendarBanner'] },
  },
  access: { read: () => true },
  defaultSort: '-startKey',
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const merged = { ...originalDoc, ...data }
        const startKey = dateKeyFromISO(merged.startDate)
        const endKey = dateKeyFromISO(merged.endDate) || startKey
        data.startKey = startKey
        data.endKey = endKey && startKey && endKey < startKey ? startKey : endKey
        const range = data.endKey && data.endKey !== startKey ? `${startKey} → ${data.endKey}` : startKey
        data.label =
          merged.type === 'closed'
            ? `⛔ Cerrado ${range}`
            : `✅ Abierto ${range} (${formatTime12(merged.start || '10:00')} – ${formatTime12(merged.end || '18:00')})`
        return data
      },
    ],
  },
  fields: [
    {
      name: 'type',
      type: 'radio',
      label: '¿Qué quieres hacer?',
      required: true,
      defaultValue: 'open',
      options: [
        { label: 'Habilitar para citas', value: 'open' },
        { label: 'Bloquear (cerrado)', value: 'closed' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          label: 'Fecha',
          required: true,
          admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
        },
        {
          name: 'endDate',
          type: 'date',
          label: 'Hasta (opcional, para rangos)',
          admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
        },
      ],
    },
    {
      type: 'row',
      admin: { condition: (_, s) => s?.type === 'open' },
      fields: [
        { name: 'start', type: 'select', label: 'Desde', defaultValue: '10:00', options: TIME_OPTIONS },
        { name: 'end', type: 'select', label: 'Hasta', defaultValue: '18:00', options: TIME_OPTIONS },
      ],
    },
    { name: 'note', type: 'text', label: 'Nota (ej. "Vacaciones", "Feriado")' },
    { name: 'startKey', type: 'text', index: true, admin: { hidden: true } },
    { name: 'endKey', type: 'text', index: true, admin: { hidden: true } },
    { name: 'label', type: 'text', admin: { hidden: true } },
  ],
}
