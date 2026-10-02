import { defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import {
  loadOwnedMusicVideo,
  readMusicVideoId,
} from '@/server/utils/musicVideo'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const id = readMusicVideoId(event)
    await loadOwnedMusicVideo(id, auth.user.id)
    await prisma.musicVideo.delete({ where: { id } })
    return {
      success: true,
      statusCode: 200,
      message: 'Music video deleted.',
      data: { id },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
