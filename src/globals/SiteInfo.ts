import type { GlobalConfig } from 'payload'
import { revalidateSite } from '../lib/revalidate'

export const SiteInfo: GlobalConfig = {
  slug: 'site-info',
  label: 'Textos, contacto y horario',
  admin: {
    group: '🌐 Mi página web',
    description: 'Textos, fotos de portada, contacto, horario y redes sociales del sitio.',
  },
  access: { read: () => true },
  hooks: { afterChange: [() => revalidateSite()] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Portada',
          fields: [
            { name: 'businessName', type: 'text', label: 'Nombre del negocio', defaultValue: 'Lady Barbershop' },
            {
              name: 'heroEyebrow',
              type: 'text',
              label: 'Texto pequeño superior',
              defaultValue: 'Barbería en Antigua Guatemala · Desde 2023',
            },
            {
              name: 'heroTitle',
              type: 'text',
              label: 'Título principal',
              defaultValue: 'Estilo con mano de mujer',
            },
            {
              name: 'heroText',
              type: 'textarea',
              label: 'Texto de portada',
              defaultValue:
                'Cortes clásicos, fades y arreglo de barba con atención personalizada en el corazón de Antigua.',
            },
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Foto de portada (opcional)',
              admin: { description: 'Si no subes una, se muestra el logo sobre fondo azul.' },
            },
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              label: 'Logo (opcional)',
              admin: { description: 'Si no subes uno, se usa el logo actual.' },
            },
          ],
        },
        {
          label: 'Nosotros',
          fields: [
            { name: 'aboutTitle', type: 'text', label: 'Título', defaultValue: 'Una barbería con identidad' },
            {
              name: 'aboutText',
              type: 'textarea',
              label: 'Texto',
              defaultValue:
                'Lady Barbershop nació en 2023 en Antigua Guatemala con una idea clara: que cada cliente salga sintiéndose como la mejor versión de sí mismo. Tradición de barbería clásica, técnicas modernas y un trato cercano en cada visita.',
            },
            { name: 'aboutImage', type: 'upload', relationTo: 'media', label: 'Foto' },
            {
              name: 'highlights',
              type: 'array',
              label: 'Puntos destacados',
              maxRows: 4,
              defaultValue: [
                { title: 'Desde 2023', text: 'Atendiendo en Antigua Guatemala' },
                { title: 'Cita previa', text: 'Reserva en línea en minutos' },
                { title: 'Productos pro', text: 'Para mantener tu estilo en casa' },
              ],
              fields: [
                { name: 'title', type: 'text', label: 'Título', required: true },
                { name: 'text', type: 'text', label: 'Texto' },
              ],
            },
          ],
        },
        {
          label: 'Contacto y redes',
          fields: [
            {
              name: 'whatsapp',
              type: 'text',
              label: 'WhatsApp (con código de país, sin espacios)',
              admin: { description: 'Ej: 50255551234. Si está vacío no se muestran botones de WhatsApp.' },
            },
            { name: 'phone', type: 'text', label: 'Teléfono visible (ej. +502 5555-1234)' },
            { name: 'email', type: 'email', label: 'Correo' },
            { name: 'instagram', type: 'text', label: 'Instagram (usuario)', defaultValue: 'ladybarbershop_antigua' },
            { name: 'facebook', type: 'text', label: 'Facebook (URL completa)' },
            { name: 'tiktok', type: 'text', label: 'TikTok (usuario)' },
          ],
        },
        {
          label: 'Ubicación y horario',
          fields: [
            { name: 'address', type: 'text', label: 'Dirección', defaultValue: 'Antigua Guatemala, Sacatepéquez' },
            { name: 'wazeUrl', type: 'text', label: 'Enlace de Waze', defaultValue: 'https://waze.com/ul/h9fx6zhks9' },
            { name: 'googleMapsUrl', type: 'text', label: 'Enlace de Google Maps' },
            {
              name: 'mapEmbedUrl',
              type: 'text',
              label: 'Mapa incrustado (src del iframe de Google Maps)',
              admin: {
                description: 'Google Maps → Compartir → Insertar un mapa → copia solo la URL dentro de src="…"',
              },
            },
            {
              name: 'hours',
              type: 'array',
              label: 'Horario visible en el sitio',
              admin: {
                description:
                  'Solo informativo. Los horarios reservables se configuran en Agenda → Configuración de citas.',
              },
              defaultValue: [
                { days: 'Lun, Mié, Jue, Vie', time: '10:00 – 19:00' },
                { days: 'Martes', time: '10:00 – 17:30', note: 'Previa cita' },
                { days: 'Sábado', time: '10:00 – 18:30' },
                { days: 'Domingo', time: 'Cerrado' },
              ],
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'days', type: 'text', label: 'Días', required: true },
                    { name: 'time', type: 'text', label: 'Horario', required: true },
                    { name: 'note', type: 'text', label: 'Nota' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Secciones y anuncio',
          fields: [
            {
              name: 'announcement',
              type: 'group',
              label: 'Barra de anuncio (arriba del sitio)',
              fields: [
                { name: 'active', type: 'checkbox', label: 'Mostrar', defaultValue: false },
                { name: 'text', type: 'text', label: 'Texto (ej. "2x1 en cortes los martes")' },
              ],
            },
            {
              name: 'sections',
              type: 'group',
              label: 'Secciones visibles en la página principal',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'services', type: 'checkbox', label: 'Servicios', defaultValue: true },
                    { name: 'gallery', type: 'checkbox', label: 'Galería', defaultValue: true },
                    { name: 'products', type: 'checkbox', label: 'Catálogo', defaultValue: true },
                    { name: 'team', type: 'checkbox', label: 'Equipo', defaultValue: true },
                    { name: 'testimonials', type: 'checkbox', label: 'Reseñas', defaultValue: true },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'seoTitle',
              type: 'text',
              label: 'Título para Google',
              defaultValue: 'Lady Barbershop | Barbería en Antigua Guatemala',
            },
            {
              name: 'seoDescription',
              type: 'textarea',
              label: 'Descripción para Google',
              defaultValue:
                'Barbería en Antigua Guatemala. Cortes, fades, barba y productos profesionales. Reserva tu cita en línea.',
            },
          ],
        },
      ],
    },
  ],
}
