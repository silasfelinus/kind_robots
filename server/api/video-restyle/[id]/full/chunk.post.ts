import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  createError,
  defineEventHandler,
  getHeader,
  getRouterParam,
  readRawBody,
} from 'h3'
import { requireMachineUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { requireClaimedVacePilot } from '@/server/utils/claimedVacePilot'
import { restyleSourcePath } from '@/server/utils/videoRestyleJobs'

const CHUNK_BYTES = 4 * 1024 * 1024
const MAX_CHUNKS = 128 // 512 MiB maximum MP4

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({ statusCode: 403, message: 'Relay access required.' })
    }
    const index = Number(getHeader(event, 'x-vace-chunk-index'))
    const count = Number(getHeader(event, 'x-vace-chunk-count'))
    const size = Number(getHeader(event, 'content-length'))
    const declaredSha = String(getHeader(event, 'x-vace-chunk-sha256') || '')
    const artJobId = Number(getHeader(event, 'x-vace-artjob-id'))
    const agentId = String(getHeader(event, 'x-relay-agent') || '')
    if (
      !Number.isSafeInteger(index) ||
      !Number.isSafeInteger(count) ||
      count < 1 ||
      count > MAX_CHUNKS ||
      index < 0 ||
      index >= count ||
      !Number.isSafeInteger(size) ||
      size < 1 ||
      size > CHUNK_BYTES ||
      !/^[a-f0-9]{64}$/.test(declaredSha)
    ) {
      throw createError({ statusCode: 413, message: 'Invalid bounded full-film chunk.' })
    }
    const { job, phase } = await requireClaimedVacePilot(
      getRouterParam(event, 'id') || '',
      artJobId,
      agentId,
    )
    if (phase !== 'full') {
      throw createError({ statusCode: 409, message: 'Not a claimed full film.' })
    }
    const bytes = await readRawBody(event, false)
    if (!bytes || bytes.length !== size || createHash('sha256').update(bytes).digest('hex') !== declaredSha) {
      throw createError({ statusCode: 400, message: 'Chunk checksum/length mismatch.' })
    }
    const folder = path.join(path.dirname(restyleSourcePath(job)), 'full-parts')
    await mkdir(folder, { recursive: true, mode: 0o700 })
    const destination = path.join(folder, `part-${String(index).padStart(3, '0')}`)
    const prior = await readFile(destination).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null
      throw error
    })
    if (prior) {
      if (createHash('sha256').update(prior).digest('hex') !== declaredSha) {
        throw createError({ statusCode: 409, message: 'Chunk index has different saved bytes.' })
      }
    } else {
      const temporary = `${destination}.${randomUUID()}.tmp`
      await writeFile(temporary, bytes, { flag: 'wx', mode: 0o600 })
      await rename(temporary, destination)
    }
    return {
      success: true,
      statusCode: 200,
      message: 'Full-film chunk stored privately.',
      data: { index },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
