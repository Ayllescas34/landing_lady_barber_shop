import type { SiteInfo, Team } from '@/payload-types'
import { img } from '@/lib/data'
import { InstagramIcon } from './icons'

export default function About({
  site,
  team,
  logo,
  showTeam,
}: {
  site: SiteInfo | null
  team: Team[]
  logo: string
  showTeam: boolean
}) {
  const photo = img(site?.aboutImage, 'card')
  const highlights = site?.highlights || []

  return (
    <section id="nosotros" className="bg-white py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 md:grid-cols-2">
        <div className="relative">
          <div className="absolute -left-4 -top-4 h-full w-full rounded-3xl stripes-red opacity-40" aria-hidden />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo?.url || logo}
            alt={photo?.alt || 'Lady Barbershop'}
            className={`relative aspect-[4/5] w-full rounded-3xl object-cover shadow-xl ${photo ? '' : 'bg-white p-8 object-contain'}`}
          />
        </div>
        <div>
          <p className="eyebrow">Nosotros</p>
          <h2 className="section-title mt-3">{site?.aboutTitle || 'Una barbería con identidad'}</h2>
          <p className="mt-6 whitespace-pre-line leading-relaxed text-ink/75">{site?.aboutText}</p>
          {highlights.length > 0 && (
            <dl className="mt-8 grid gap-4 sm:grid-cols-3">
              {highlights.map((h) => (
                <div key={h.id || h.title} className="rounded-2xl border border-navy/10 bg-paper p-4">
                  <dt className="font-heading text-lg uppercase tracking-wide text-navy">{h.title}</dt>
                  {h.text && <dd className="mt-1 text-sm text-ink/65">{h.text}</dd>}
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {showTeam && team.length > 0 && (
        <div className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
          <h3 className="text-center font-display text-3xl text-navy">Nuestro equipo</h3>
          <div className="mt-10 flex flex-wrap justify-center gap-8">
            {team.map((t) => {
              const p = img(t.photo, 'thumbnail')
              return (
                <div key={t.id} className="w-56 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p?.url || logo}
                    alt={t.name}
                    className="mx-auto h-40 w-40 rounded-full object-cover ring-4 ring-barber/30"
                  />
                  <p className="mt-4 font-heading text-xl uppercase tracking-wide text-navy">{t.name}</p>
                  {t.role && <p className="text-sm text-barber">{t.role}</p>}
                  {t.bio && <p className="mt-2 text-sm text-ink/65">{t.bio}</p>}
                  {t.instagram && (
                    <a
                      href={`https://instagram.com/${t.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm text-navy/70 hover:text-navy"
                    >
                      <InstagramIcon className="h-4 w-4" /> @{t.instagram.replace('@', '')}
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
