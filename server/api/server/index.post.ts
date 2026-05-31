// /server/api/server/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'
import {
  buildServerCreateData,
  requireAuthUser,
  safeServer,
} from './../../utils/serverApi'

const serverTypes = ['A1111', 'COMFY', 'OPENAI', 'ANTHROPIC', 'CUSTOM'] as const
const accessModes = [
  'BROWSER',
  'BACKEND',
  'TAILSCALE',
  'PUBLIC',
  'LOCAL',
] as const
const authTypes = ['NONE', 'BEARER', 'HEADER', 'QUERY', 'API_KEY'] as const
const statuses = ['ONLINE', 'OFFLINE', 'DEGRADED', 'UNKNOWN'] as const

function validateEnumField(
  body: Record<string, unknown>,
  field: string,
  allowedValues: readonly string[],
) {
  const value = body[field]

  if (value === undefined || value === null) return

  if (typeof value !== 'string' || !allowedValues.includes(value)) {
    throw createError({
      statusCode: 400,
      message: `Invalid ${field}. Expected one of: ${allowedValues.join(', ')}.`,
    })
  }
}

function validateServerEnums(body: Record<string, unknown>) {
  validateEnumField(body, 'serverType', serverTypes)
  validateEnumField(body, 'accessMode', accessModes)
  validateEnumField(body, 'authType', authTypes)
  validateEnumField(body, 'lastStatus', statuses)
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuthUser(event)
    const body = await readBody(event)

    if (Array.isArray(body)) {
      const created = []
      const skipped: string[] = []

      for (const item of body) {
        try {
          const safeBody =
            item && typeof item === 'object'
              ? (item as Record<string, unknown>)
              : {}

          validateServerEnums(safeBody)

          const data = buildServerCreateData(safeBody, user)
          const server = await prisma.server.create({ data })

          created.push(safeServer(server, user))
        } catch (error) {
          skipped.push(
            error instanceof Error ? error.message : 'Skipped invalid server.',
          )
        }
      }

      event.node.res.statusCode = created.length ? 201 : 400

      return {
        success: created.length > 0,
        message: created.length
          ? 'Servers created successfully.'
          : 'No servers were created.',
        data: created,
        skipped,
        statusCode: created.length ? 201 : 400,
      }
    }

    const safeBody =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {}

    validateServerEnums(safeBody)

    const data = buildServerCreateData(safeBody, user)
    const server = await prisma.server.create({ data })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Server created successfully.',
      data: safeServer(server, user),
      statusCode: 201,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to create server.',
      statusCode: handledError.statusCode || 500,
    }
  }
})
