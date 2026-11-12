'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      setError('Correo o contraseña incorrectos.')
      setBusy(false)
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-navy px-6 text-paper"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/panel-icons/icon-512.png" alt="Lady Barbershop" className="h-32 w-32 rounded-full bg-white shadow-xl" />
      <h1 className="mt-5 font-heading text-3xl uppercase tracking-wider">Mi agenda</h1>
      <p className="mt-1 text-paper/70">Lady Barbershop</p>

      <form onSubmit={submit} className="mt-8 w-full max-w-sm space-y-4">
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          placeholder="Correo"
          className="w-full rounded-2xl border-0 bg-white px-5 py-4 text-[17px] text-ink"
        />
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Contraseña"
          className="w-full rounded-2xl border-0 bg-white px-5 py-4 text-[17px] text-ink"
        />
        {error && <p className="text-center font-semibold text-barber-light">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-barber py-4 text-lg font-bold text-white"
        >
          {busy && <Loader2 className="animate-spin" size={20} />} Entrar
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-paper/60">Solo tienes que entrar una vez en este teléfono.</p>
    </div>
  )
}
