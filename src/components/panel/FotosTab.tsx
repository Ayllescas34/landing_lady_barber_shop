'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { deletePhoto, setPhotoFeatured } from '@/app/(panel)/panel/actions'
import { GALLERY_CATEGORIES } from '@/lib/categories'
import Sheet from './Sheet'

type Photo = { id: number; url: string; category: string; featured: boolean }

/** Achica la foto en el teléfono antes de subirla (más rápido con datos móviles). */
async function shrink(file: File, max = 2000): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export default function FotosTab({ photos }: { photos: Photo[] }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState('cortes')
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [selected, setSelected] = useState<Photo | null>(null)

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setMsg(null)
    const list = Array.from(files)
    let ok = 0
    setProgress({ done: 0, total: list.length })
    for (const f of list) {
      try {
        const small = await shrink(f)
        const fd = new FormData()
        fd.append('file', small)
        fd.append('_payload', JSON.stringify({ category, featured: true, alt: '' }))
        const res = await fetch('/api/gallery', { method: 'POST', body: fd, credentials: 'include' })
        if (res.ok) ok++
      } catch {}
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p))
    }
    setProgress(null)
    if (input.current) input.current.value = ''
    setMsg(ok === list.length ? `✅ ${ok} foto${ok > 1 ? 's' : ''} subida${ok > 1 ? 's' : ''}. Ya se ven en la página.` : `Se subieron ${ok} de ${list.length}. Intenta otra vez con las que faltan.`)
    router.refresh()
  }

  const catLabel = (v: string) => GALLERY_CATEGORIES.find((c) => c.value === v)?.label || v

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-[16px] font-semibold text-navy">1. ¿Qué tipo de foto es?</p>
        <div className="flex flex-wrap gap-2">
          {GALLERY_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`rounded-full px-4 py-2.5 text-[15px] font-semibold ${
                category === c.value ? 'bg-navy text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <p className="mb-3 mt-5 text-[16px] font-semibold text-navy">2. Elige las fotos</p>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
        <button
          type="button"
          disabled={Boolean(progress)}
          onClick={() => input.current?.click()}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-barber py-5 text-[18px] font-bold text-white"
        >
          {progress ? (
            <>
              <Loader2 className="animate-spin" /> Subiendo {progress.done + 1} de {progress.total}…
            </>
          ) : (
            <>
              <Camera size={26} /> Subir fotos
            </>
          )}
        </button>
        <p className="mt-2 text-center text-[14px] text-gray-500">Puedes tomar una foto o elegir varias de tu galería.</p>
        {msg && <p className="mt-3 rounded-xl bg-paper p-3 text-[15px]">{msg}</p>}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-navy">Fotos publicadas ({photos.length})</h2>
        {photos.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">Aún no hay fotos.</p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((p) => (
              <button key={p.id} type="button" onClick={() => setSelected(p)} className="relative aspect-square overflow-hidden rounded-lg bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                {!p.featured && (
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-[11px] text-white">Oculta en inicio</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <Sheet open={Boolean(selected)} onClose={() => setSelected(null)} title="Foto">
        {selected && <PhotoActions photo={selected} label={catLabel(selected.category)} onDone={() => setSelected(null)} />}
      </Sheet>
    </div>
  )
}

function PhotoActions({ photo, label, onDone }: { photo: Photo; label: string; onDone: () => void }) {
  const router = useRouter()
  const [busy, start] = useTransition()
  const go = (fn: () => Promise<{ ok: boolean }>) =>
    start(async () => {
      await fn()
      router.refresh()
      onDone()
    })
  return (
    <div className="space-y-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt="" className="mx-auto max-h-64 rounded-xl" />
      <p className="text-center text-[15px] text-gray-600">Categoría: {label}</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => go(() => setPhotoFeatured(photo.id, !photo.featured))}
        className="w-full rounded-2xl bg-gray-100 p-4 text-[17px] font-semibold"
      >
        {photo.featured ? '🙈 No mostrar en la página de inicio' : '⭐ Mostrar en la página de inicio'}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => window.confirm('¿Borrar esta foto? No se puede deshacer.') && go(() => deletePhoto(photo.id))}
        className="w-full rounded-2xl bg-red-50 p-4 text-[17px] font-semibold text-red-700"
      >
        🗑️ Borrar foto
      </button>
    </div>
  )
}
