import type { Payload } from 'payload'

/**
 * Datos iniciales: solo se crean si la base está vacía.
 * Los precios son de EJEMPLO — la administradora debe ajustarlos en el panel.
 */
export const SERVICES = [
  { name: 'Corte clásico', category: 'cortes', price: 75, duration: 30, featured: true, description: 'Corte a tijera y máquina, lavado y peinado.' },
  { name: 'Fade / degradado', category: 'cortes', price: 85, duration: 45, featured: true, description: 'Low, mid o high fade con acabado a navaja.' },
  { name: 'Arreglo de barba', category: 'barba', price: 50, duration: 30, featured: true, description: 'Perfilado, toalla caliente y aceite para barba.' },
  { name: 'Corte + barba', category: 'combos', price: 120, duration: 60, featured: true, description: 'El servicio completo para salir impecable.' },
  { name: 'Corte para niño', category: 'ninos', price: 60, duration: 30, description: 'Hasta 12 años.' },
  { name: 'Diseño / líneas', category: 'extras', price: 25, duration: 15, priceFrom: true, description: 'Agrega un diseño a tu corte.' },
  { name: 'Perfilado de cejas', category: 'extras', price: 20, duration: 15, description: 'Con navaja.' },
]

export async function seed(payload: Payload) {
  try {
    const { totalDocs } = await payload.count({ collection: 'services' })
    if (totalDocs > 0) return

    payload.logger.info('🌱 Creando datos iniciales de Lady Barbershop…')
    for (const [i, s] of SERVICES.entries()) {
      await payload.create({
        collection: 'services',
        data: { ...s, order: i, active: true, bookable: true } as never,
      })
    }
  } catch (err) {
    payload.logger.error({ err }, 'No se pudieron crear los datos iniciales')
  }
}
