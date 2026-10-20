import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
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
import {
  RESTYLE_SOURCE_FILE,
  restyleSourceContentType,
} from '@/utils/videoRestyleSource'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const job = await loadRestyleJob(
      auth.user.id,
      getRouterParam(event, 'id') || '',
    )
    if (!RESTYLE_SOURCE_FILE.test(job.sourceFile)) {
      throw createError({ statusCode: 404, message: 'Source video not found.' })
    }
    const filePath = restyleSourcePath(job)
    const fileStat = await stat(filePath).catch(() => null)
    if (!fileStat?.isFile()) {
      throw createError({ statusCode: 404, message: 'Source video not found.' })
    }
    setHeader(event, 'Content-Type', restyleSourceContentType(job.sourceFile))
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
