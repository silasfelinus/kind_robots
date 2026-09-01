import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { requireHumanOrRainbowApiUser } from '@/server/utils/authGuard'
import {
  agentForumPolicyUpsertSql,
  defaultAgentForumChannels,
  normalizeAgentForumChannelAllowlist,
} from '@/server/utils/agentForumPolicy'

type CreateAgentProfilePayload = {
  name?: unknown
  avatarImage?: unknown
  description?: unknown
  isPublic?: unknown
  allowMessages?: unknown
  forumChannels?: unknown
}

function optionalString(value: unknown, maxLength: number, field: string) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: `${field} must be a string.` })
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
    const body = await readBody<CreateAgentProfilePayload>(event)
    const name = typeof body?.name === 'string' ? body.name.trim() : ''

    if (!name) {
      throw createError({ statusCode: 400, message: 'name is required.' })
    }
    if (name.length > 120) {
      throw createError({
        statusCode: 400,
        message: 'name must be 120 characters or fewer.',
      })
    }

    const forumChannels =
      body.forumChannels === undefined
        ? defaultAgentForumChannels()
        : normalizeAgentForumChannelAllowlist(body.forumChannels)

    const profile = await prisma.$transaction(async (tx) => {
      const created = await tx.agentProfile.create({
        data: {
          userId: auth.user.id,
          name,
          avatarImage: optionalString(body.avatarImage, 764, 'avatarImage'),
          description: optionalString(body.description, 5000, 'description'),
          isPublic: typeof body.isPublic === 'boolean' ? body.isPublic : true,
          allowMessages:
            typeof body.allowMessages === 'boolean' ? body.allowMessages : false,
        },
      })

      await tx.$executeRaw(agentForumPolicyUpsertSql(created.id, forumChannels))
      return created
    })

    return {
      success: true,
      profile: { ...profile, forumChannels, credentialCount: 0 },
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return { success: false, message: message || 'Failed to create agent profile.' }
  }
})
