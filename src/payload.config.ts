import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { es } from '@payloadcms/translations/languages/es'
import { en } from '@payloadcms/translations/languages/en'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Gallery } from './collections/Gallery'
import { Services } from './collections/Services'
import { Products } from './collections/Products'
import { Team } from './collections/Team'
import { Testimonials } from './collections/Testimonials'
import { Appointments } from './collections/Appointments'
import { SpecialDays } from './collections/SpecialDays'
import { Inquiries } from './collections/Inquiries'
import { PushSubscriptions } from './collections/PushSubscriptions'
import { BookingSettings } from './globals/BookingSettings'
import { SiteInfo } from './globals/SiteInfo'
import { seed } from './seed'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Base de datos:
// - Producción (Vercel): Postgres en Neon. Vercel crea DATABASE_URL al conectar Neon;
//   también se acepta DATABASE_URI o POSTGRES_URL.
// - Local: si no hay URL de Postgres, se usa un archivo SQLite (barber.db).
const databaseUrl = process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
const isPostgres = /^postgres(ql)?:\/\//.test(databaseUrl)

// Correo (avisos a clientes y "olvidé mi contraseña"). Funciona con cualquier SMTP:
// Gmail con contraseña de aplicación, Resend, Brevo, etc. Sin SMTP_HOST los correos
// solo se escriben en la consola (útil en local).
const smtpReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

const secret = process.env.PAYLOAD_SECRET
if (!secret && process.env.NODE_ENV === 'production') {
  throw new Error('Falta la variable de entorno PAYLOAD_SECRET')
}

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      title: 'Lady Barbershop — Panel',
      description: 'Panel administrativo de Lady Barbershop Antigua',
      titleSuffix: ' · Lady Barbershop',
      icons: {
        icon: [{ url: '/panel-icons/icon-192.png', type: 'image/png' }],
        apple: [{ url: '/panel-icons/apple-touch-icon.png' }],
      },
    },
    theme: 'light',
    components: {
      beforeNavLinks: ['/components/admin/NavLinks'],
      graphics: {
        Logo: '/components/admin/Graphics#Logo',
        Icon: '/components/admin/Graphics#Icon',
      },
      views: {
        dashboard: { Component: '/components/admin/Dashboard' },
        calendario: { Component: '/components/admin/CalendarView', path: '/calendario' },
      },
    },
    importMap: { baseDir: path.resolve(dirname) },
  },
  i18n: {
    supportedLanguages: { es, en },
    fallbackLanguage: 'es',
  },
  // El orden aquí define el orden del menú lateral
  collections: [
    Appointments,
    SpecialDays,
    Inquiries,
    Services,
    Products,
    Team,
    Gallery,
    Testimonials,
    Media,
    Users,
    PushSubscriptions,
  ].map((c) => ({ ...c, admin: { ...c.admin, hideAPIURL: true } })),
  globals: [BookingSettings, SiteInfo].map((g) => ({ ...g, admin: { ...g.admin, hideAPIURL: true } })),
  editor: lexicalEditor({}),
  db: isPostgres
    ? postgresAdapter({
        pool: { connectionString: databaseUrl, max: 3 },
        migrationDir: path.resolve(dirname, 'migrations'),
        // En producción las migraciones se aplican solas al arrancar / al hacer build.
        prodMigrations: migrations,
      })
    : sqliteAdapter({
        client: { url: databaseUrl || `file:${path.resolve(dirname, '../barber.db')}` },
        // Las migraciones de src/migrations son de Postgres; en local SQLite usa "push".
        migrationDir: path.resolve(dirname, 'migrations-sqlite'),
      }),
  // Fotos: en Vercel se guardan en Vercel Blob; en local, en public/media.
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
      // Las fotos son públicas: se sirven directo desde el CDN de Vercel Blob.
      collections: {
        media: { disablePayloadAccessControl: true },
        gallery: { disablePayloadAccessControl: true },
      },
      // Mismo esquema de BD con o sin Blob (local vs. Vercel), así las migraciones coinciden.
      alwaysInsertFields: true,
      // Subida directa del navegador a Blob en /admin (evita el límite de 4.5 MB de Vercel).
      // Ver el alias en next.config.ts (arreglo de un bug de empaquetado de 3.85.1).
      clientUploads: true,
    }),
  ],
  email: smtpReady
    ? nodemailerAdapter({
        defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || '',
        defaultFromName: process.env.EMAIL_FROM_NAME || 'Lady Barbershop',
        skipVerify: true,
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 465),
          secure: Number(process.env.SMTP_PORT || 465) === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        },
      })
    : undefined,
  secret: secret || 'solo-para-desarrollo-local',
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  upload: { limits: { fileSize: 10_000_000 } },
  onInit: async (payload) => {
    // En Postgres (producción) los datos iniciales se crean con una migración.
    if (!isPostgres) await seed(payload)
  },
})
