import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import React from 'react'
import { getMonthData } from '../../lib/monthData'
import { todayKey } from '../../lib/time'
import CalendarClient from './CalendarClient'
import { sortAppts, toAdminAppt } from './toAdminAppt'

/** Vista /admin/calendario: citas y disponibilidad en un solo lugar. */
export default async function CalendarView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  if (!req.user) redirect('/admin/login?redirect=%2Fadmin%2Fcalendario')
  const payload = req.payload

  const today = todayKey()
  const sp = (searchParams || {}) as Record<string, string | undefined>
  const selected = /^\d{4}-\d{2}-\d{2}$/.test(sp.dia || '') ? (sp.dia as string) : today
  const month = /^\d{4}-\d{2}$/.test(sp.mes || '') ? (sp.mes as string) : selected.slice(0, 7)

  const [{ settings, days, appts }, services, team, site] = await Promise.all([
    getMonthData(payload, month),
    payload.find({ collection: 'services', depth: 0, limit: 100, sort: 'order', where: { active: { equals: true } } }),
    payload.find({ collection: 'team', depth: 0, limit: 50, sort: 'order', where: { active: { equals: true } } }),
    payload.findGlobal({ slug: 'site-info', depth: 0 }).catch(() => null),
  ])

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user || undefined}
      visibleEntities={visibleEntities}
    >
      <Gutter className="lb-page">
        <CalendarClient
          month={month}
          today={today}
          selected={selected}
          days={days}
          appts={sortAppts(appts.map(toAdminAppt))}
          mode={settings.mode === 'manual' ? 'manual' : 'weekly'}
          bookingEnabled={settings.bookingEnabled !== false}
          services={services.docs.map((s) => ({ id: s.id, name: s.name, duration: s.duration || 30 }))}
          team={team.docs.map((t) => ({ id: t.id, name: t.name }))}
          businessName={site?.businessName || 'Lady Barbershop'}
        />
      </Gutter>
    </DefaultTemplate>
  )
}
