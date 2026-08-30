// /server/api/agent-credentials/index.post.ts
// rainbow-butterflies/t-015: issue a new agent credential for the current
// user (optionally scoped to one of their Bots). The plaintext token is
// returned exactly once in this response and never persisted -- callers
// must copy it now.
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { requireHumanApiUser } from '@/server/utils/authGuard'
import {
  createAgentCredential,
  sanitizeScopes,
} from '@/server/utils/agentCredentials'

type CreatePayload = {
  label?: unknown
  botId?: unknown
  scopes?: unknown
  expiresAt?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireHumanApiUser(event)
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
