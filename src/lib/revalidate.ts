import { revalidatePath } from 'next/cache'

/**
 * Refresca las páginas públicas cuando la administradora guarda cambios,
 * para que se vean al instante sin esperar al caché.
 */
export function revalidateSite() {
  try {
    revalidatePath('/', 'layout')
  } catch {
    // Fuera del contexto de Next (p. ej. scripts) no hay nada que refrescar.
  }
}

export const revalidateHooks = {
  afterChange: [() => revalidateSite()],
  afterDelete: [() => revalidateSite()],
}
