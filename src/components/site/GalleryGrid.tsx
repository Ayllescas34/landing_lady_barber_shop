'use client'

import { useMemo, useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { GALLERY_CATEGORIES } from '@/lib/categories'

export type GalleryItem = {
  id: string
  thumb: string
  full: string
  alt: string
  category: string
}

export default function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [filter, setFilter] = useState('all')
  const [index, setIndex] = useState(-1)

  const cats = GALLERY_CATEGORIES.filter((c) => items.some((i) => i.category === c.value))
  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.category === filter)),
    [filter, items],
  )

  return (
    <>
      {cats.length > 1 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2" role="tablist">
          {[{ label: 'Todo', value: 'all' }, ...cats].map((c) => (
            <button
              key={c.value}
              type="button"
              role="tab"
              aria-selected={filter === c.value}
              onClick={() => setFilter(c.value)}
              className={`rounded-full px-4 py-2 font-heading text-xs uppercase tracking-widest transition ${
                filter === c.value ? 'bg-navy text-paper' : 'bg-white text-navy hover:bg-navy/10'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
        {visible.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(i)}
            className="group mb-3 block w-full overflow-hidden rounded-xl bg-navy/5"
            aria-label={`Ver foto${item.alt ? `: ${item.alt}` : ''}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.thumb}
              alt={item.alt}
              loading="lazy"
              className="w-full transition duration-500 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={visible.map((v) => ({ src: v.full, alt: v.alt }))}
      />
    </>
  )
}
