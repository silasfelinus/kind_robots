// /server/api/agent-credentials/index.post.ts
// Issue a new scoped machine credential for the current user. Legacy Kind
// Robots callers may bind it to one owned Bot; Rainbow v2 callers bind it to a
// durable AgentProfile instead. The plaintext token is returned exactly once.
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { requireHumanOrRainbowApiUser } from '@/server/utils/authGuard'
import {
  createAgentCredential,
  sanitizeScopes,
} from '@/server/utils/agentCredentials'

type CreatePayload = {
  label?: unknown
  botId?: unknown
  agentProfileId?: unknown
  scopes?: unknown
  expiresAt?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireHumanOrRainbowApiUser(event)
    const body = await readBody<CreatePayload>(event)

    const label = typeof body?.label === 'string' ? body.label.trim() : ''
    if (!label) {
      throw createError({ statusCode: 400, message: 'label is required.' })
    }

    let botId: number | null = null
    if (body?.botId !== undefined && body.botId !== null) {
      const parsed = Number(body.botId)
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw createError({
          statusCode: 400,
          message: 'botId must be a positive integer.',
        })
      }

      const bot = await prisma.bot.findUnique({ where: { id: parsed } })
      if (!bot || bot.userId !== auth.user.id) {
        throw createError({
          statusCode: 403,
          message: 'botId must reference a Bot you own.',
        })
      }

      botId = parsed
    }

    let agentProfileId: number | null = null
    if (
      body?.agentProfileId !== undefined &&
      body.agentProfileId !== null
    ) {
      const parsed = Number(body.agentProfileId)
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw createError({
          statusCode: 400,
          message: 'agentProfileId must be a positive integer.',
        })
      }

      const profile = await prisma.agentProfile.findUnique({
        where: { id: parsed },
        select: { userId: true, isActive: true },
      })
      if (!profile || profile.userId !== auth.user.id || !profile.isActive) {
        throw createError({
          statusCode: 403,
          message: 'agentProfileId must reference an active profile you own.',
        })
      }

      agentProfileId = parsed
    }

    if (botId && agentProfileId) {
      throw createError({
        statusCode: 400,
        message: 'A credential cannot bind both botId and agentProfileId.',
      })
    }

    const scopes = sanitizeScopes(body?.scopes)

    let expiresAt: Date | null = null
    if (typeof body?.expiresAt === 'string' && body.expiresAt.trim()) {
      const parsed = new Date(body.expiresAt)
      if (Number.isNaN(parsed.getTime())) {
        throw createError({
          statusCode: 400,
          message: 'expiresAt is not a valid date.',
        })
      }
      expiresAt = parsed
    }

    const { credential, token } = await createAgentCredential({
      userId: auth.user.id,
      botId,
      agentProfileId,
      label,
      scopes,
      expiresAt,
    })

    return { success: true, credential, token }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to create credential.',
    }
  }
})
