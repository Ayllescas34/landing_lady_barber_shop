export default function PageHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <section className="relative overflow-hidden bg-navy py-14 text-paper sm:py-20">
      <div className="absolute inset-0 opacity-15 stripes-red" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
        <p className="eyebrow !text-barber-light">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl sm:text-6xl">{title}</h1>
        {text && <p className="mx-auto mt-4 max-w-2xl text-paper/75">{text}</p>}
      </div>
    </section>
  )
}
