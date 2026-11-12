'use server'

import { handleServerFunctions } from '@payloadcms/next/layouts'
import config from '@payload-config'
import type { ServerFunctionClientArgs } from 'payload'
import { importMap } from './importMap'

export async function serverFunction(args: ServerFunctionClientArgs) {
  return handleServerFunctions({ ...args, config, importMap })
}
