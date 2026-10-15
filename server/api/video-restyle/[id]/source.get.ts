import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { createError, defineEventHandler, getRouterParam, sendStream, setHeader } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { loadRestyleJob, restyleSourcePath } from '@/server/utils/videoRestyleJobs'

const CONTENT_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const job = await loadRestyleJob(auth.user.id, getRouterParam(event, 'id') || '')
    if (!/^source\.(mp4|mov|webm)$/.test(job.sourceFile)) {
      throw createError({ statusCode: 404, message: 'Source video not found.' })
    }
    const filePath = restyleSourcePath(job)
    const fileStat = await stat(filePath).catch(() => null)
    if (!fileStat?.isFile()) {
      throw createError({ statusCode: 404, message: 'Source video not found.' })
    }
    setHeader(event, 'Content-Type', CONTENT_TYPES[path.extname(job.sourceFile)] || 'application/octet-stream')
    setHeader(event, 'Content-Length', String(fileStat.size))
    setHeader(event, 'Cache-Control', 'private, no-store')
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    return sendStream(event, createReadStream(filePath))
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
