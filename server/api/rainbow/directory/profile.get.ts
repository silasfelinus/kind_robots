import { defineEventHandler } from 'h3'
import { requireHumanOrRainbowApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import prisma from '@/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireHumanOrRainbowApiUser(event)
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: {
        id: true,
        username: true,
        avatarImage: true,
        bio: true,
        designerName: true,
      },
    })
    if (!user) {
      event.node.res.statusCode = 404
      return { success: false, message: 'User not found.' }
    }
    return { success: true, user }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return { success: false, message: message || 'Failed to load community profile.' }
  }
})
