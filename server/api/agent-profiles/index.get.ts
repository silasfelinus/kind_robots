import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { requireHumanApiUser } from '@/server/utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireHumanApiUser(event)
    const profiles = await prisma.agentProfile.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        Credentials: {
          select: { credentialId: true },
        },
      },
    })

    return {
      success: true,
      profiles: profiles.map(({ Credentials, ...profile }) => ({
        ...profile,
        credentialCount: Credentials.length,
      })),
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return { success: false, message: message || 'Failed to list agent profiles.' }
  }
})
