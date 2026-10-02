import { defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const videos = await prisma.musicVideo.findMany({
      where: { userId: auth.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        finalArtImageId: true,
      },
      take: 200,
    })
    return {
      success: true,
      statusCode: 200,
      message: 'Music videos loaded.',
      data: videos,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
