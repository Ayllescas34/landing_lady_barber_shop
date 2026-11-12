import React from 'react'

/** Aviso arriba de las listas de citas / días especiales para llevar al calendario. */
export default function CalendarBanner() {
  return (
    <div className="lb-banner" style={{ marginTop: 16 }}>
      <span>💡 Es más fácil ver y manejar las citas y los días abiertos/cerrados en el calendario.</span>
      <a className="lb-btn lb-btn--primary" href="/admin/calendario">
        📅 Abrir calendario
      </a>
    </div>
  )
}
