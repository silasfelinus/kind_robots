import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
  setHeader,
} from 'h3'
import { requireHumanOrDelegatedApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import prisma from '@/server/utils/prisma'
import {
  parseAgentAttentionResolutionInput,
  resolveAgentAttentionRequest,
} from '@/server/utils/agentAttentionRequests'

function parsePositiveId(value: string | undefined, label: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: `Invalid ${label}.` })
  }
  return id
}

export default defineEventHandler(async (event) => {
  try {
    setHeader(event, 'Cache-Control', 'no-store')
    const auth = await requireHumanOrDelegatedApiUser(event)
    const profileId = parsePositiveId(getRouterParam(event, 'id'), 'agent profile id')
    const requestId = parsePositiveId(
      getRouterParam(event, 'requestId'),
      'attention request id',
    )

    const profile = await prisma.agentProfile.findUnique({
      where: { id: profileId },
      select: { id: true, userId: true },
    })
    if (!profile) {
      throw createError({ statusCode: 404, message: 'Agent profile not found.' })
    }
    if (profile.userId !== auth.user.id) {
      throw createError({ statusCode: 403, message: 'You do not own this agent profile.' })
    }

    const body = (await readBody<{ status?: unknown; resolution?: unknown }>(event)) ?? {}
    const resolution = parseAgentAttentionResolutionInput(body)
    const request = await resolveAgentAttentionRequest({
      requestId,
      agentProfileId: profile.id,
      userId: auth.user.id,
      ...resolution,
    })

    return {
      success: true,
      request,
      message: 'Resolution saved for delivery on the agent’s next check-in.',
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to resolve human-attention request.',
    }
  }
})
