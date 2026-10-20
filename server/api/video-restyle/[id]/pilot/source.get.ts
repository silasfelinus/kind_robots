import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import {
  createError,
  defineEventHandler,
  getHeader,
  getQuery,
  getRouterParam,
  sendStream,
  setHeader,
} from 'h3'
import { requireMachineUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { requireClaimedVacePilot } from '@/server/utils/claimedVacePilot'
import { restyleSourcePath } from '@/server/utils/videoRestyleJobs'
import {
  RESTYLE_SOURCE_FILE,
  restyleSourceContentType,
} from '@/utils/videoRestyleSource'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin relay credentials required.',
      })
    }
    const jobId = Number(getQuery(event).artJobId)
    const agentId = String(getHeader(event, 'x-relay-agent') || '')
    const { job } = await requireClaimedVacePilot(
      getRouterParam(event, 'id') || '',
      jobId,
      agentId,
    )
    if (!RESTYLE_SOURCE_FILE.test(job.sourceFile)) {
      throw createError({ statusCode: 404, message: 'Source is unavailable.' })
    }
    const filePath = restyleSourcePath(job)
    const file = await stat(filePath).catch(() => null)
    if (!file?.isFile() || file.size !== job.sourceBytes) {
      throw createError({
        statusCode: 404,
        message: 'Source bytes unavailable.',
      })
    }
    setHeader(event, 'Content-Type', restyleSourceContentType(job.sourceFile))
    setHeader(event, 'Content-Length', file.size)
    setHeader(event, 'Cache-Control', 'private, no-store')
    return sendStream(event, createReadStream(filePath))
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
