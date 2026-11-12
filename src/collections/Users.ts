import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  // Sesión larga (60 días) para que la administradora no tenga que iniciar sesión
  // a cada rato en la app del teléfono.
  auth: { tokenExpiration: 60 * 60 * 24 * 60 },
  labels: { singular: 'Usuario', plural: 'Usuarios del panel' },
  admin: {
    useAsTitle: 'email',
    group: '⚙️ Avanzado',
    description: 'Personas con acceso al panel administrativo',
  },
  fields: [
    { name: 'name', type: 'text', label: 'Nombre completo' },
    {
      name: 'role',
      type: 'select',
      label: 'Rol',
      defaultValue: 'admin',
      options: [
        { label: 'Administradora', value: 'admin' },
        { label: 'Recepción / Editor', value: 'editor' },
      ],
    },
  ],
}
