import type { CollectionConfig } from 'payload'

/** Teléfonos/navegadores que reciben avisos de reservas nuevas. Se maneja desde la app /panel. */
export const PushSubscriptions: CollectionConfig = {
  slug: 'push-subscriptions',
  labels: { singular: 'Dispositivo con avisos', plural: 'Dispositivos con avisos' },
  admin: {
    group: '⚙️ Avanzado',
    useAsTitle: 'device',
    description: 'Teléfonos que reciben avisos de reservas. Se agregan desde la app "Mi agenda".',
    defaultColumns: ['device', 'user', 'createdAt'],
  },
  fields: [
    { name: 'device', type: 'text', label: 'Dispositivo' },
    { name: 'user', type: 'relationship', relationTo: 'users', label: 'Usuario' },
    { name: 'endpoint', type: 'text', required: true, unique: true, admin: { readOnly: true } },
    { name: 'p256dh', type: 'text', required: true, admin: { hidden: true } },
    { name: 'auth', type: 'text', required: true, admin: { hidden: true } },
  ],
}
