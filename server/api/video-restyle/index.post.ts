import {
  createError,
  defineEventHandler,
  getHeader,
  readMultipartFormData,
} from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { stageRestyleVideo } from '@/server/utils/videoRestyleJobs'
import { RESTYLE_MAX_BYTES } from '@/utils/videoRestylePlan'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const declared = Number(getHeader(event, 'content-length'))
    if (!Number.isFinite(declared) || declared <= 0) {
      throw createError({
        statusCode: 411,
        message: 'A bounded upload length is required.',
      })
    }
    if (declared > RESTYLE_MAX_BYTES + 1024 * 1024) {
      throw createError({
        statusCode: 413,
        message: 'Upload must be below 128 MiB.',
      })
    }
    const parts = await readMultipartFormData(event)
    const file = parts?.find((part) => part.name === 'file')
    if (!file?.data)
      throw createError({ statusCode: 400, message: 'Choose a video file.' })
    const field = (name: string) =>
      parts?.find((part) => part.name === name)?.data.toString('utf8')
    const job = await stageRestyleVideo({
      userId: auth.user.id,
      data: file.data,
      title: field('title'),
      style: field('style'),
      quality: field('quality'),
      durationSec: field('durationSec'),
      isPrivate: field('isPrivate'),
      isMature: field('isMature'),
    })
    event.node.res.statusCode = 201
    return {
      success: true,
      statusCode: 201,
      message: 'Video saved privately for rendering.',
      data: job,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
