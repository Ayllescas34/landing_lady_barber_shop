import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { SERVICES } from '../seed'

/**
 * Datos iniciales en producción: servicios de ejemplo (precios a ajustar en el panel).
 * Corre una sola vez, igual que cualquier migración.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const { totalDocs } = await payload.count({ collection: 'services', req })
  if (totalDocs > 0) return
  for (const [i, s] of SERVICES.entries()) {
    await payload.create({
      collection: 'services',
      data: { ...s, order: i, active: true, bookable: true } as never,
      req,
    })
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.delete({
    collection: 'services',
    where: { name: { in: SERVICES.map((s) => s.name) } },
    req,
  })
}
