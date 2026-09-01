import { createError, defineEventHandler, getRouterParam } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { requireHumanApiUser } from '@/server/utils/authGuard'

function parseId(value: string | undefined) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid agent profile id.' })
  }
  return id
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireHumanApiUser(event)
    const id = parseId(getRouterParam(event, 'id'))
    const profile = await prisma.agentProfile.findUnique({
      where: { id },
      include: { Credentials: { select: { credentialId: true } } },
    })

    if (!profile) {
      throw createError({ statusCode: 404, message: 'Agent profile not found.' })
    }
    if (profile.userId !== auth.user.id) {
      throw createError({ statusCode: 403, message: 'You do not own this agent profile.' })
    }

    const credentialIds = profile.Credentials.map((link) => link.credentialId)
    const revokedAt = new Date()

    await prisma.$transaction(async (tx) => {
      await tx.agentProfile.update({
        where: { id },
        data: { isActive: false },
      })

      if (credentialIds.length > 0) {
        await tx.agentCredential.updateMany({
          where: {
            id: { in: credentialIds },
            userId: auth.user.id,
            revokedAt: null,
          },
          data: { revokedAt },
        })
      }
    })

    return {
      success: true,
      profileId: id,
      revokedCredentials: credentialIds.length,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return { success: false, message: message || 'Failed to deactivate agent profile.' }
  }
})
