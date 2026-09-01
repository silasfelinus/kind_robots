import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { requireHumanOrRainbowApiUser } from '@/server/utils/authGuard'
import { getAgentForumChannels } from '@/server/utils/agentForumPolicy'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireHumanOrRainbowApiUser(event)
    const profiles = await prisma.agentProfile.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        Credentials: {
          select: { credentialId: true },
        },
      },
    })

    const rows = await Promise.all(
      profiles.map(async ({ Credentials, ...profile }) => ({
        ...profile,
        forumChannels: await getAgentForumChannels(profile.id),
        credentialCount: Credentials.length,
      })),
    )

    return { success: true, profiles: rows }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return { success: false, message: message || 'Failed to list agent profiles.' }
  }
})
