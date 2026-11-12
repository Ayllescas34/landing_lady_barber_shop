import { headers } from 'next/headers'
import type { Appointment, Gallery, Inquiry, Service } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { getMonthData } from '@/lib/monthData'
import { addDays, todayKey } from '@/lib/time'
import PanelShell, { type Tab } from '@/components/panel/PanelShell'
import Login from '@/components/panel/Login'
import CitasTab from '@/components/panel/CitasTab'
import DiasTab from '@/components/panel/DiasTab'
import FotosTab from '@/components/panel/FotosTab'
import PreciosTab from '@/components/panel/PreciosTab'
import MasTab from '@/components/panel/MasTab'
import { toPanelAppt } from '@/components/panel/types'

export const dynamic = 'force-dynamic'

const TABS: Tab[] = ['citas', 'dias', 'fotos', 'precios', 'mas', 'mensajes']

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; mes?: string }>
}) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return <Login />

  const sp = await searchParams
  const tab: Tab = TABS.find((t) => t === sp.tab) || 'citas'
  const today = todayKey()

  const [pendingCount, newMessages, site] = await Promise.all([
    payload.count({
      collection: 'appointments',
      where: { and: [{ status: { equals: 'pending' } }, { dateKey: { greater_than_equal: today } }] },
    }),
    payload.count({ collection: 'inquiries', where: { status: { equals: 'new' } } }),
    payload.findGlobal({ slug: 'site-info', depth: 0 }).catch(() => null),
  ])
  const businessName = site?.businessName || 'Lady Barbershop'
  const userName = (user as { name?: string }).name?.split(' ')[0] || ''

  let content: React.ReactNode = null

  if (tab === 'citas') {
    const [appts, services] = await Promise.all([
      payload.find({
        collection: 'appointments',
        depth: 1,
        limit: 300,
        pagination: false,
        sort: 'dateKey',
        where: {
          and: [
            { dateKey: { greater_than_equal: today } },
            { dateKey: { less_than_equal: addDays(today, 30) } },
          ],
        },
      }),
      payload.find({ collection: 'services', depth: 0, limit: 100, sort: 'order', where: { active: { equals: true } } }),
    ])
    content = (
      <CitasTab
        today={today}
        appts={(appts.docs as Appointment[]).map(toPanelAppt)}
        services={(services.docs as Service[]).map((s) => ({ id: s.id, name: s.name, duration: s.duration || 30 }))}
        businessName={businessName}
        newMessages={newMessages.totalDocs}
      />
    )
  } else if (tab === 'dias') {
    const month = /^\d{4}-\d{2}$/.test(sp.mes || '') ? (sp.mes as string) : today.slice(0, 7)
    const { settings, days } = await getMonthData(payload, month)
    content = (
      <DiasTab
        month={month}
        today={today}
        days={days}
        mode={settings.mode === 'manual' ? 'manual' : 'weekly'}
        bookingEnabled={settings.bookingEnabled !== false}
      />
    )
  } else if (tab === 'fotos') {
    const photos = await payload.find({ collection: 'gallery', limit: 90, sort: '-createdAt', depth: 0 })
    content = (
      <FotosTab
        photos={(photos.docs as Gallery[]).map((p) => ({
          id: p.id,
          url: p.sizes?.thumbnail?.url || p.url || '',
          category: p.category,
          featured: p.featured !== false,
        }))}
      />
    )
  } else if (tab === 'precios') {
    const services = await payload.find({ collection: 'services', depth: 0, limit: 100, sort: 'order' })
    content = (
      <PreciosTab
        services={(services.docs as Service[]).map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price ?? null,
          priceFrom: Boolean(s.priceFrom),
          duration: s.duration || 30,
          active: s.active !== false,
        }))}
      />
    )
  } else {
    const [inquiries, booking, subs] = await Promise.all([
      payload.find({ collection: 'inquiries', limit: 40, sort: '-createdAt', depth: 1 }),
      payload.findGlobal({ slug: 'booking-settings', depth: 0 }),
      payload.count({ collection: 'push-subscriptions' }),
    ])
    content = (
      <MasTab
        showMessages={tab === 'mensajes'}
        messages={(inquiries.docs as Inquiry[]).map((m) => ({
          id: m.id,
          name: m.name,
          phone: m.phone || '',
          email: m.email || '',
          message: m.message,
          status: m.status || 'new',
          product: typeof m.product === 'object' && m.product ? m.product.name : null,
          createdAt: m.createdAt,
        }))}
        bookingEnabled={booking.bookingEnabled !== false}
        devices={subs.totalDocs}
        vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''}
        businessName={businessName}
      />
    )
  }

  return (
    <PanelShell
      tab={tab === 'mensajes' ? 'mas' : tab}
      pendingCount={pendingCount.totalDocs}
      newMessages={newMessages.totalDocs}
      userName={userName}
      vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''}
    >
      {content}
    </PanelShell>
  )
}
