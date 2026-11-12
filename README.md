# Lady Barbershop — Sitio web autoadministrable

Sitio de la barbería **Lady Barbershop (Antigua Guatemala)** con panel de administración y reservas en línea.

**Stack:** Next.js 15 · Payload CMS 3 · SQLite · Tailwind CSS (el mismo stack del sitio del hotel).

## Arrancar en local

```bash
npm install
npm run dev
```

- Sitio: http://localhost:3000
- Panel: http://localhost:3000/admin (la primera vez pide crear el usuario administrador)

Al iniciar por primera vez se crean servicios de ejemplo. **Los precios son de ejemplo**: ajústalos en el panel.

## 📱 App del celular para la administradora (`/panel`)

App web instalable (PWA) pensada para iPhone. La administradora solo usa esto; el panel completo (`/admin`) queda para ti en la PC.

- **Citas:** nuevas por confirmar, hoy, mañana y próximos días. Botones grandes: *Confirmar*, *WhatsApp* (mensaje de confirmación ya escrito), *Ya vino*, *No vino*, *Cancelar*, *Llamar*. Botón **Agregar cita** para reservas por WhatsApp o en persona.
- **Días:** calendario; toca un día para **cerrarlo** (o vacaciones hasta una fecha) o **abrirlo**.
- **Fotos:** elegir categoría → **Subir fotos** (cámara o galería, varias a la vez; se achican antes de subir).
- **Precios:** cambiar precio y visibilidad de cada servicio.
- **Más:** activar **avisos**, pausar reservas, mensajes de la página, cómo instalar, cerrar sesión.

**Avisos:** cada reserva o mensaje nuevo desde la web envía una notificación push (“💈 ¡Nueva reserva! Ana · viernes 13 de noviembre a las 10:00 a. m. …”) y pone un numerito en el ícono con las citas por confirmar.

### Instalarla en el iPhone de la administradora (una sola vez)

1. Abrir `https://TU-DOMINIO/panel` en **Safari**.
2. Compartir → **Agregar a inicio** → Agregar.
3. Abrir **“Mi agenda”** desde el ícono, iniciar sesión (dura 60 días) y tocar **Activar avisos** → Permitir.
4. En **Más** → “Enviarme un aviso de prueba”.

Requisitos: iOS 16.4 o más reciente, sitio publicado con **HTTPS** (los avisos no funcionan en `localhost` desde el teléfono) y las claves `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` en el `.env` del servidor.

## Panel pensado para usarse sin conocimientos técnicos

- **Inicio** (`/admin`): saludo, números del día, botones grandes de “¿Qué quieres hacer?”, citas de hoy y citas por confirmar con botones de *Confirmar*, *Ya se atendió*, *No vino*, *Cancelar* y *WhatsApp al cliente* (mensaje de confirmación ya escrito).
- **Calendario** (`/admin/calendario`): mes con colores (abierto, cerrado, bloqueado, abierto especial) y número de citas por día. Al tocar un día se puede cerrar (o cerrar un rango de vacaciones), volver a abrirlo, abrir un día que normalmente está cerrado y **agregar una cita** que llegó por WhatsApp o en persona.
- Menú agrupado en **📅 Agenda**, **✂️ Mi barbería**, **🌐 Mi página web** y **⚙️ Avanzado**, con el logo de la barbería en el login.
- Incluye una sección de **Ayuda rápida** en el inicio.

## Qué puede administrar la dueña

| Sección del panel | Para qué sirve |
|---|---|
| **Agenda → Citas** | Ver, confirmar, cancelar o agregar citas a mano. El inicio del panel muestra las citas de hoy y de los próximos 7 días. |
| **Agenda → Configuración de citas** | Activar/pausar reservas, elegir el modo (horario semanal o "solo los días que yo habilite"), horario por día, almuerzo, intervalo, clientes a la vez, anticipación mínima y hasta cuántos días adelante se puede reservar. |
| **Agenda → Días habilitados / bloqueados** | Habilitar un día o un rango con su horario, o bloquear fechas (vacaciones, feriados). Esto tiene prioridad sobre el horario semanal. |
| **Agenda → Solicitudes de información** | Mensajes del formulario de contacto y del catálogo. |
| **Contenido → Servicios** | Nombre, precio, duración (define cuánto tiempo ocupa en la agenda), foto, visible y reservable. |
| **Contenido → Catálogo** | Productos con fotos, precio, precio de oferta y disponibilidad. |
| **Contenido → Equipo** | Si hay más de una persona que acepta citas, el cliente puede elegir con quién. |
| **Contenido → Reseñas** | Opiniones reales de clientes. |
| **Fotos → Galería** | Subida masiva de fotos con categoría (cortes, fades, barba…). |
| **Configuración → Información del negocio** | Textos de portada, foto, "Nosotros", WhatsApp, teléfono, redes, dirección, mapa, horario visible, barra de anuncio, secciones visibles y SEO. |

### Cómo funciona la reserva

1. El cliente elige el servicio (y la persona, si hay varias).
2. El calendario solo muestra días con espacio libre según la configuración.
3. Elige la hora; se descuentan las citas existentes, el almuerzo y la duración del servicio.
4. Deja nombre y WhatsApp. La cita queda **Pendiente** en el panel con un código de reserva, y el cliente puede avisar por WhatsApp con un clic.

Las citas **Canceladas** o **No se presentó** liberan el horario.

## Pendiente de completar en el panel

- Número de **WhatsApp** y teléfono (sin número no aparecen los botones de WhatsApp).
- **Precios reales** de los servicios.
- Fotos de la galería, del catálogo y de la portada.
- URL del mapa de Google (opcional; si no, se busca por nombre).

## Producción en Vercel

| Pieza | Servicio | Cómo se configura |
|---|---|---|
| Código / hosting | Vercel (conectado a GitHub) | Cada push a `main` despliega producción; cada push a `dev` crea un preview. |
| Base de datos | **Neon Postgres** (Vercel → Storage) | Al conectarla, Vercel crea `DATABASE_URL`. |
| Fotos | **Vercel Blob** (Vercel → Storage) | Al conectarlo, Vercel crea `BLOB_READ_WRITE_TOKEN`. |
| Avisos push | Claves VAPID | Se copian a mano (ver `.env.production.example`). |

**Base de datos:** en local se usa SQLite (`barber.db`, sin instalar nada). En Vercel se usa Postgres. Las tablas y los servicios iniciales se crean con las migraciones de `src/migrations`: el build de Vercel (`npm run vercel-build`) ejecuta `payload migrate` antes de `next build`.

**Si cambias colecciones o campos**, genera una migración nueva antes de hacer push:

```bash
DATABASE_URI=postgres://x:x@127.0.0.1:5432/x npx payload migrate:create nombre-del-cambio
```

(La URL puede ser falsa: solo se usa para que Payload genere SQL de Postgres.)

Todas las variables y de dónde salen están en [.env.production.example](.env.production.example).
