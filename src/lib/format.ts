export function waLink(number: string | null | undefined, message: string) {
  if (!number) return null
  const clean = number.replace(/\D/g, '')
  if (!clean) return null
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

export function formatPrice(price?: number | null, from?: boolean | null) {
  if (price == null) return 'Consultar'
  return `${from ? 'Desde ' : ''}Q${price.toLocaleString('es-GT', { minimumFractionDigits: 0 })}`
}
