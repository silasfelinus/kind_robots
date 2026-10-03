import { defineEventHandler } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { loadComicSnapshot, readComicId } from '@/server/utils/comicStudio'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const data = await loadComicSnapshot(readComicId(event, 'series id'))
    return {
      success: true,
      statusCode: 200,
      message: 'Comic series loaded.',
      data,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
