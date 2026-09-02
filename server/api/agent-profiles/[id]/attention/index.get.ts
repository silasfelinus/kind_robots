import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'
import { requireHumanOrDelegatedApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import prisma from '@/server/utils/prisma'
import { listAgentAttentionRequests } from '@/server/utils/agentAttentionRequests'

function parseId(value: string | undefined) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid agent profile id.' })
  }
  return id
}

export default defineEventHandler(async (event) => {
  try {
    setHeader(event, 'Cache-Control', 'no-store')
    const auth = await requireHumanOrDelegatedApiUser(event)
    const id = parseId(getRouterParam(event, 'id'))
    const profile = await prisma.agentProfile.findUnique({
      where: { id },
      select: { id: true, userId: true, name: true, isActive: true },
    })

    if (!profile) {
      throw createError({ statusCode: 404, message: 'Agent profile not found.' })
    }
    if (profile.userId !== auth.user.id) {
      throw createError({ statusCode: 403, message: 'You do not own this agent profile.' })
    }

    const requests = await listAgentAttentionRequests({
      agentProfileId: profile.id,
      userId: auth.user.id,
    })

    return {
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        isActive: profile.isActive,
      },
      openCount: requests.filter((request) => request.status === 'OPEN').length,
      requests,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to load human-attention requests.',
    }
  }
})
