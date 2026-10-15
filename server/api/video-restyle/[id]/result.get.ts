import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import {
  createError,
  defineEventHandler,
  getRouterParam,
  sendStream,
  setHeader,
} from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import {
  loadRestyleJob,
  restyleSourcePath,
} from '@/server/utils/videoRestyleJobs'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const job = await loadRestyleJob(
      auth.user.id,
      getRouterParam(event, 'id') || '',
    )
    if (job.status !== 'REVIEW' || job.resultFile !== 'pilot.mp4') {
      throw createError({ statusCode: 404, message: 'Source video not found.' })
    }
    const filePath = path.join(
      path.dirname(restyleSourcePath(job)),
      'pilot.mp4',
    )
    const fileStat = await stat(filePath).catch(() => null)
    if (!fileStat?.isFile()) {
      throw createError({ statusCode: 404, message: 'Source video not found.' })
    }
    setHeader(event, 'Content-Type', 'video/mp4')
    setHeader(event, 'Content-Length', fileStat.size)
    setHeader(event, 'Cache-Control', 'private, no-store')
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    return sendStream(event, createReadStream(filePath))
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
