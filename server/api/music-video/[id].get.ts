import { defineEventHandler } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import {
  loadOwnedMusicVideo,
  readMusicVideoId,
  toMusicVideoDto,
} from '@/server/utils/musicVideo'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const record = await loadOwnedMusicVideo(
      readMusicVideoId(event),
      auth.user.id,
    )
    return {
      success: true,
      statusCode: 200,
      message: 'Music video loaded.',
      data: toMusicVideoDto(record),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
