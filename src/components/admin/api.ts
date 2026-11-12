// Llamadas al API de Payload desde el panel (usa la sesión de la administradora).

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let msg = 'No se pudo guardar. Intenta de nuevo.'
    try {
      const j = await res.json()
      msg = j?.errors?.[0]?.data?.errors?.[0]?.message || j?.errors?.[0]?.message || msg
    } catch {}
    throw new Error(msg)
  }
  return res.json().catch(() => null)
}

export const api = {
  updateAppointment: (id: string | number, data: Record<string, unknown>) =>
    call(`/api/appointments/${id}`, 'PATCH', data),
  createAppointment: (data: Record<string, unknown>) => call('/api/appointments', 'POST', data),
  createSpecialDay: (data: Record<string, unknown>) => call('/api/special-days', 'POST', data),
  deleteSpecialDay: (id: string | number) => call(`/api/special-days/${id}`, 'DELETE'),
}
