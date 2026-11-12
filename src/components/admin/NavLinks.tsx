import React from 'react'

/** Accesos fijos arriba del menú lateral. */
export default function NavLinks() {
  return (
    <nav className="lb-nav" aria-label="Accesos rápidos">
      <a href="/admin">🏠 Inicio</a>
      <a href="/admin/calendario">📅 Calendario de citas</a>
      <a href="/panel" target="_blank" rel="noopener noreferrer">📱 App del celular</a>
      <a href="/" target="_blank" rel="noopener noreferrer">🌐 Ver mi página web</a>
    </nav>
  )
}
