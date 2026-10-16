import { createHash, randomUUID } from 'node:crypto'
import { appendFile, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireMachineUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { requireClaimedVacePilot } from '@/server/utils/claimedVacePilot'
import { restyleSourcePath } from '@/server/utils/videoRestyleJobs'

const MAX_CHUNKS = 128
const CHUNK_BYTES = 4 * 1024 * 1024

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({ statusCode: 403, message: 'Relay access required.' })
    }
    const body = await readBody<{
      artJobId?: number
      agentId?: string
      chunkCount?: number
      fileBytes?: number
      sha256?: string
    }>(event)
    const count = Number(body?.chunkCount)
    const expectedSize = Number(body?.fileBytes)
    const expectedSha = String(body?.sha256 || '')
    if (
      !Number.isSafeInteger(count) ||
      count < 1 ||
      count > MAX_CHUNKS ||
      !Number.isSafeInteger(expectedSize) ||
      expectedSize < 1024 ||
      expectedSize > MAX_CHUNKS * CHUNK_BYTES ||
      !/^[a-f0-9]{64}$/.test(expectedSha)
    ) {
      throw createError({
        statusCode: 400,
        message: 'Invalid full-film finalization.',
      })
    }
    const { job, artJob, phase } = await requireClaimedVacePilot(
      getRouterParam(event, 'id') || '',
      Number(body?.artJobId),
      String(body?.agentId || ''),
    )
    if (phase !== 'full' || !job.full) {
      throw createError({
        statusCode: 409,
        message: 'Full film is not claimed.',
      })
    }
    const folder = path.dirname(restyleSourcePath(job))
    const parts = path.join(folder, 'full-parts')
    const staging = path.join(folder, `full-${randomUUID()}.tmp`)
    const hasher = createHash('sha256')
    let bytesWritten = 0
    try {
      await writeFile(staging, Buffer.alloc(0), { flag: 'wx', mode: 0o600 })
      for (let index = 0; index < count; index += 1) {
        const name = path.join(parts, `part-${String(index).padStart(3, '0')}`)
        const bytes = await readFile(name).catch(() => null)
        if (!bytes || bytes.length < 1 || bytes.length > CHUNK_BYTES) {
          throw createError({
            statusCode: 409,
            message: `Missing/corrupt MP4 chunk ${index}.`,
          })
        }
        if (index === 0 && bytes.toString('ascii', 4, 8) !== 'ftyp') {
          throw createError({
            statusCode: 400,
            message: 'Result must be an MP4.',
          })
        }
        hasher.update(bytes)
        bytesWritten += bytes.length
        if (bytesWritten > expectedSize) {
          throw createError({
            statusCode: 400,
            message: 'Full film exceeds declared size.',
          })
        }
        await appendFile(staging, bytes)
      }
      if (
        bytesWritten !== expectedSize ||
        hasher.digest('hex') !== expectedSha
      ) {
        throw createError({
          statusCode: 400,
          message: 'Whole-film checksum mismatch.',
        })
      }
      await rename(staging, path.join(folder, 'full.mp4'))
    } finally {
      await rm(staging, { force: true })
    }
    const completedAt = new Date().toISOString()
    const next = {
      ...job,
      status: 'DONE' as const,
      stage: 'Full-length film saved privately with original audio',
      progress: 100,
      resultFile: 'full.mp4',
      error: null,
      updatedAt: completedAt,
      full: { ...job.full, completedSegments: job.full.totalSegments },
    }
    const destination = path.join(folder, 'job.json')
    const temp = `${destination}.${randomUUID()}.tmp`
    await writeFile(temp, JSON.stringify(next, null, 2), {
      flag: 'wx',
      mode: 0o600,
    })
    await rename(temp, destination)
    const payload = JSON.parse(artJob.payload) as Record<string, unknown>
    const video = (payload.videoRestyle || {}) as Record<string, unknown>
    payload.videoRestyle = {
      ...video,
      completedSegments: job.full.totalSegments,
      progress: 100,
      state: 'DONE',
      sha256: expectedSha,
      fileBytes: expectedSize,
    }
    await prisma.artJob.update({
      where: { id: artJob.id },
      data: {
        status: 'DONE',
        payload: JSON.stringify(payload),
        error: null,
        claimedAt: null,
        claimedBy: null,
      },
    })
    await rm(parts, { recursive: true, force: true })
    return {
      success: true,
      statusCode: 200,
      message: 'Full-length MP4 saved privately.',
      data: { status: 'DONE', bytes: expectedSize },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
