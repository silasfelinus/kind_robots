import { createHash, randomUUID } from 'node:crypto'
import { rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  createError,
  defineEventHandler,
  getHeader,
  getRouterParam,
  readBody,
  readMultipartFormData,
} from 'h3'
import prisma from '@/server/utils/prisma'
import { requireMachineUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { requireClaimedVacePilot } from '@/server/utils/claimedVacePilot'
import {
  restyleSourcePath,
  type VideoRestyleJob,
} from '@/server/utils/videoRestyleJobs'

const MAX_PILOT_BYTES = 64 * 1024 * 1024

async function saveManifest(job: VideoRestyleJob, next: VideoRestyleJob) {
  const folder = path.dirname(restyleSourcePath(job))
  const target = path.join(folder, 'job.json')
  const scratch = `${target}.${randomUUID()}.tmp`
  await writeFile(scratch, JSON.stringify(next, null, 2), {
    flag: 'wx',
    mode: 0o600,
  })
  await rename(scratch, target)
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin relay credentials required.',
      })
    }
    const isUpload = String(getHeader(event, 'content-type') || '').startsWith(
      'multipart/form-data',
    )
    const length = Number(getHeader(event, 'content-length'))
    if (
      isUpload &&
      (!Number.isFinite(length) ||
        length <= 0 ||
        length > MAX_PILOT_BYTES + 1024 * 1024)
    ) {
      throw createError({
        statusCode: 413,
        message: 'Pilot upload exceeds 64 MiB.',
      })
    }
    const parts = isUpload ? await readMultipartFormData(event) : null
    const body = isUpload
      ? null
      : await readBody<Record<string, unknown>>(event)
    const part = (name: string) =>
      parts?.find((entry) => entry.name === name)?.data
    const value = (name: string) =>
      isUpload ? part(name)?.toString('utf8') : body?.[name]
    const jobId = Number(value('artJobId'))
    const agentId = String(value('agentId') || '')
    const kind = String(value('kind') || '')
    const { artJob, job } = await requireClaimedVacePilot(
      getRouterParam(event, 'id') || '',
      jobId,
      agentId,
    )

    const totalSegments = job.pilot!.totalSegments
    const completed = Number(value('completedSegments'))
    if (
      !Number.isSafeInteger(completed) ||
      completed < 0 ||
      completed > totalSegments
    ) {
      throw createError({ statusCode: 400, message: 'Invalid VACE progress.' })
    }

    const now = new Date().toISOString()
    let status: VideoRestyleJob['status'] = 'PILOT_RUNNING'
    let error: string | null = null
    let resultFile: string | null = null
    if (kind === 'failed') {
      status = 'PILOT_FAILED'
      error = String(value('error') || 'VACE worker failed.').slice(0, 2000)
    } else if (kind === 'complete') {
      const video = part('file')
      if (
        !video ||
        video.length < 1024 ||
        video.length > MAX_PILOT_BYTES ||
        video.toString('ascii', 4, 8) !== 'ftyp'
      ) {
        throw createError({
          statusCode: 400,
          message: 'A valid MP4 pilot is required.',
        })
      }
      const declaredDigest = String(value('sha256') || '')
      const digest = createHash('sha256').update(video).digest('hex')
      if (!/^[a-f0-9]{64}$/.test(declaredDigest) || digest !== declaredDigest) {
        throw createError({
          statusCode: 400,
          message: 'Pilot checksum mismatch.',
        })
      }
      const folder = path.dirname(restyleSourcePath(job))
      const staged = path.join(folder, `pilot-${randomUUID()}.tmp`)
      await writeFile(staged, video, { flag: 'wx', mode: 0o600 })
      try {
        await rename(staged, path.join(folder, 'pilot.mp4'))
      } catch (error) {
        await rm(staged, { force: true })
        throw error
      }
      status = 'REVIEW'
      resultFile = 'pilot.mp4'
    } else if (kind !== 'progress') {
      throw createError({
        statusCode: 400,
        message: 'Invalid VACE report type.',
      })
    }
    const next: VideoRestyleJob = {
      ...job,
      status,
      error,
      resultFile,
      progress:
        kind === 'complete'
          ? 100
          : Math.min(99, Math.round((100 * completed) / (totalSegments + 1))),
      stage:
        kind === 'complete'
          ? 'Pilot ready for choreography review'
          : kind === 'failed'
            ? 'Pilot render failed'
            : `KR Relay VACE window ${completed}/${totalSegments}`,
      updatedAt: now,
      pilot: { ...job.pilot!, completedSegments: completed },
    }
    await saveManifest(job, next)

    const payload = JSON.parse(artJob.payload) as Record<string, unknown>
    const videoRestyle = (payload.videoRestyle || {}) as Record<string, unknown>
    payload.videoRestyle = {
      ...videoRestyle,
      completedSegments: completed,
      progress: next.progress,
      state: next.status,
      executor: 'kr-relay',
      ...(kind === 'complete' ? { sha256: String(value('sha256')) } : {}),
    }
    await prisma.artJob.update({
      where: { id: artJob.id },
      data: {
        status:
          kind === 'complete'
            ? 'DONE'
            : kind === 'failed'
              ? 'FAILED'
              : 'RUNNING',
        payload: JSON.stringify(payload),
        error,
        ...(kind !== 'progress' ? { claimedAt: null, claimedBy: null } : {}),
      },
    })
    return {
      success: true,
      statusCode: 200,
      message:
        kind === 'complete'
          ? 'VACE pilot saved privately.'
          : 'VACE progress recorded.',
      data: { status: next.status, progress: next.progress },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
