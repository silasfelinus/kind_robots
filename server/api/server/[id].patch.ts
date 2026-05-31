// /server/api/server/[id].patch.ts
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'
import {
  buildServerUpdateData,
  canMutateServer,
  parseId,
  readServerById,
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
    const id = parseId(getRouterParam(event, 'id'))
    const user = await requireAuthUser(event)
    const server = await readServerById(id)

    if (!canMutateServer(server, user)) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this server.',
      })
    }

    if (!server.isEditable && !user.isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'This server is not editable.',
      })
    }

    const body = await readBody(event)
    const safeBody =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {}

    validateServerEnums(safeBody)

    const data = buildServerUpdateData(safeBody, user)

    const updatedServer = await prisma.server.update({
      where: { id },
      data,
    })

    return {
      success: true,
      message: 'Server updated successfully.',
      data: safeServer(updatedServer, user),
      statusCode: 200,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to update server.',
      statusCode: handledError.statusCode || 500,
    }
  }
})
