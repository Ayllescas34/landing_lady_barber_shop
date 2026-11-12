import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Bug de @payloadcms/storage-vercel-blob 3.85.1: su componente de cliente importa
      // "plugin-cloud-storage/utilities", que arrastra código de servidor (node:*) al navegador.
      // En el cliente solo necesita getFileKey, así que apuntamos directo a ese archivo.
      config.resolve.alias = {
        ...config.resolve.alias,
        '@payloadcms/plugin-cloud-storage/utilities$': path.resolve(
          dirname,
          'node_modules/@payloadcms/plugin-cloud-storage/dist/utilities/getFileKey.js',
        ),
      }
    }
    return config
  },
}

export default withPayload(nextConfig)
