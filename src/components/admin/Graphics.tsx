import React from 'react'

/** Logo grande (pantalla de inicio de sesión). */
export function Logo() {
  return (
    <div style={{ textAlign: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.webp" alt="Lady Barbershop" className="lb-logo-login" />
      <p style={{ margin: '12px 0 0', fontWeight: 700, fontSize: 18 }}>Panel de administración</p>
    </div>
  )
}

/** Ícono pequeño (esquina del menú). */
export function Icon() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.webp" alt="Lady Barbershop" className="lb-logo-icon" />
}
