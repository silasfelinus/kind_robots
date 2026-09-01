import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { requireHumanOrRainbowApiUser } from '@/server/utils/authGuard'
import {
  agentForumPolicyUpsertSql,
  getAgentForumChannels,
  normalizeAgentForumChannelAllowlist,
} from '@/server/utils/agentForumPolicy'

type UpdateAgentProfilePayload = {
  name?: unknown
  avatarImage?: unknown
  description?: unknown
  isPublic?: unknown
  allowMessages?: unknown
  forumChannels?: unknown
}

function parseId(value: string | undefined) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid agent profile id.' })
  }
  return id
}

function optionalString(value: unknown, maxLength: number, field: string) {
  if (value === null || value === '') return null
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: `${field} must be a string or null.` })
  }
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `${field} must be ${maxLength} characters or fewer.`,
    })
  }
  return trimmed
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireHumanOrRainbowApiUser(event)
    const id = parseId(getRouterParam(event, 'id'))
    const existing = await prisma.agentProfile.findUnique({ where: { id } })

    if (!existing) {
      throw createError({ statusCode: 404, message: 'Agent profile not found.' })
    }
    if (existing.userId !== auth.user.id) {
      throw createError({ statusCode: 403, message: 'You do not own this agent profile.' })
    }

    const body = await readBody<UpdateAgentProfilePayload>(event)
    const data: {
      name?: string
      avatarImage?: string | null
      description?: string | null
      isPublic?: boolean
      allowMessages?: boolean
    } = {}

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        throw createError({ statusCode: 400, message: 'name cannot be empty.' })
      }
      const name = body.name.trim()
      if (name.length > 120) {
        throw createError({ statusCode: 400, message: 'name must be 120 characters or fewer.' })
      }
      data.name = name
    }
    if (body.avatarImage !== undefined) {
      data.avatarImage = optionalString(body.avatarImage, 764, 'avatarImage')
    }
    if (body.description !== undefined) {
      data.description = optionalString(body.description, 5000, 'description')
    }
    if (body.isPublic !== undefined) {
      if (typeof body.isPublic !== 'boolean') {
        throw createError({ statusCode: 400, message: 'isPublic must be boolean.' })
      }
      data.isPublic = body.isPublic
    }
    if (body.allowMessages !== undefined) {
      if (typeof body.allowMessages !== 'boolean') {
        throw createError({ statusCode: 400, message: 'allowMessages must be boolean.' })
      }
      data.allowMessages = body.allowMessages
    }

    const requestedForumChannels =
      body.forumChannels === undefined
        ? null
        : normalizeAgentForumChannelAllowlist(body.forumChannels)

    const profile = await prisma.$transaction(async (tx) => {
      const updated = Object.keys(data).length
        ? await tx.agentProfile.update({ where: { id }, data })
        : existing

      if (requestedForumChannels) {
        await tx.$executeRaw(
          agentForumPolicyUpsertSql(id, requestedForumChannels),
        )
      }

      return updated
    })

    return {
      success: true,
      profile: {
        ...profile,
        forumChannels:
          requestedForumChannels ?? (await getAgentForumChannels(id)),
      },
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return { success: false, message: message || 'Failed to update agent profile.' }
  }
})
