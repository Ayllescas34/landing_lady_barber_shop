import { RootLayout } from '@payloadcms/next/layouts'
import config from '@payload-config'
import React from 'react'
import '@payloadcms/next/css'
import './panel.css'
import { importMap } from './importMap'
import { serverFunction } from './serverFunctions'

type Args = { children: React.ReactNode }

const Layout = ({ children }: Args) =>
  RootLayout({ children, config, importMap, serverFunction })

export default Layout
