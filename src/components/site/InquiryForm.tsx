'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { sendInquiry } from '@/app/(frontend)/actions'

export default function InquiryForm({
  productId,
  productName,
  defaultSubject = 'general',
  compact = false,
}: {
  productId?: string
  productName?: string
  defaultSubject?: string
  compact?: boolean
}) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    start(async () => {
      const res = await sendInquiry({
        name: String(fd.get('name') || ''),
        phone: String(fd.get('phone') || ''),
        email: String(fd.get('email') || ''),
        subject: String(fd.get('subject') || defaultSubject),
        productId: productId || null,
        message: String(fd.get('message') || ''),
        website: String(fd.get('website') || ''),
      })
      if (res.ok) setDone(true)
      else setError(res.error)
    })
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-hummingbird" />
        <p className="font-heading text-xl uppercase tracking-wide text-navy">¡Mensaje enviado!</p>
        <p className="text-ink/70">Te responderemos lo antes posible.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="hp-field" aria-hidden>
        <label>
          No llenar <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className={compact ? 'sm:col-span-2' : ''}>
        <label className="label" htmlFor="inq-name">Nombre *</label>
        <input id="inq-name" name="name" required minLength={2} className="input" autoComplete="name" />
      </div>
      <div className={compact ? 'sm:col-span-2' : ''}>
        <label className="label" htmlFor="inq-phone">Teléfono / WhatsApp</label>
        <input id="inq-phone" name="phone" type="tel" className="input" autoComplete="tel" inputMode="tel" />
      </div>
      <div className={compact ? 'sm:col-span-2' : ''}>
        <label className="label" htmlFor="inq-email">Correo</label>
        <input id="inq-email" name="email" type="email" className="input" autoComplete="email" />
      </div>
      {!productId && (
        <div>
          <label className="label" htmlFor="inq-subject">Asunto</label>
          <select id="inq-subject" name="subject" defaultValue={defaultSubject} className="input">
            <option value="general">Información general</option>
            <option value="servicios">Servicios / precios</option>
            <option value="producto">Producto del catálogo</option>
            <option value="eventos">Eventos / grupos</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      )}
      <div className="sm:col-span-2">
        <label className="label" htmlFor="inq-message">Mensaje *</label>
        <textarea
          id="inq-message"
          name="message"
          required
          rows={compact ? 3 : 4}
          className="input resize-y"
          defaultValue={productName ? `Hola, me interesa el producto "${productName}". ¿Está disponible?` : ''}
        />
      </div>
      {error && <p className="text-sm font-medium text-barber sm:col-span-2" role="alert">{error}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar mensaje
        </button>
        <p className="mt-2 text-xs text-ink/50">Déjanos al menos un teléfono o correo para responderte.</p>
      </div>
    </form>
  )
}
