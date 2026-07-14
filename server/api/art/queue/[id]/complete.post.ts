// /server/api/art/queue/[id]/complete.post.ts
//
// The relay reports a claimed job's outcome after uploading the rendered bytes
// through /api/art/save-generated. Normal jobs keep that uploaded ArtImage.
// OVERWRITE retries use it as a temporary staging row: completion snapshots the
// old canonical ArtImage for historical ArtJobs, copies the fresh render into
// the canonical row, and deletes the temporary upload in one transaction.
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import type {
  ArtImage,
  Prisma,
} from '~/prisma/generated/prisma/client'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireMachineUser } from '../../../../utils/authGuard'

const MAX_ATTEMPTS = 3

type CompleteRequestBody = {
  success?: boolean
  artImageId?: number | null
  error?: string | null
}

type RetryMode = 'NEW_OUTPUT' | 'OVERWRITE'
type JsonRecord = Record<string, unknown>

type RetryMetadata = {
  mode: RetryMode
  sourceJobId: number | null
  rootJobId: number | null
  targetArtImageId: number | null
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

function readRetry(payload: unknown): RetryMetadata | null {
  const retry = asRecord(asRecord(payload).retry)
  const mode = String(retry.mode || '').toUpperCase()
  if (mode !== 'NEW_OUTPUT' && mode !== 'OVERWRITE') return null

  const sourceJobId = Number(retry.sourceJobId)
  const rootJobId = Number(retry.rootJobId)
  const targetArtImageId = Number(retry.targetArtImageId)

  return {
    mode,
    sourceJobId:
      Number.isInteger(sourceJobId) && sourceJobId > 0 ? sourceJobId : null,
    rootJobId: Number.isInteger(rootJobId) && rootJobId > 0 ? rootJobId : null,
    targetArtImageId:
      Number.isInteger(targetArtImageId) && targetArtImageId > 0
        ? targetArtImageId
        : null,
  }
}

function readSavePolicy(payload: unknown): {
  isPublic?: boolean
  isMature?: boolean
  designer?: string
} {
  const save = asRecord(asRecord(payload).save)
  return {
    ...(typeof save.isPublic === 'boolean'
      ? { isPublic: save.isPublic }
      : {}),
    ...(typeof save.isMature === 'boolean'
      ? { isMature: save.isMature }
      : {}),
    ...(typeof save.designer === 'string' && save.designer.trim()
      ? { designer: save.designer.trim() }
      : {}),
  }
}

function snapshotData(image: ArtImage): Prisma.ArtImageUncheckedCreateInput {
  return {
    imageData: image.imageData,
    userId: image.userId,
    fileName: `${image.fileName || `ArtImage-${image.id}`}-revision-${Date.now()}`,
    fileType: image.fileType,
    cfg: image.cfg,
    cfgHalf: image.cfgHalf,
    checkpoint: image.checkpoint,
    checkpointResourceId: image.checkpointResourceId,
    designer: image.designer,
    genres: image.genres,
    // Revision rows are historical render snapshots, not another canonical file
    // placement. Keep their bytes and generation metadata but avoid duplicating
    // path claims that still belong to the stable target ArtImage.
    imagePath: null,
    heroPath: null,
    cardPath: null,
    iconPath: null,
    thumbnailPath: null,
    heroData: null,
    cardData: null,
    iconData: null,
    thumbnailData: null,
    isMature: image.isMature,
    isPublic: image.isPublic,
    isActive: image.isActive,
    negativePrompt: image.negativePrompt,
    path: null,
    promptString: image.promptString,
    sampler: image.sampler,
    seed: image.seed,
    serverId: image.serverId,
    serverName: image.serverName,
    serverUrl: image.serverUrl,
    steps: image.steps,
    artPrompt: image.artPrompt,
  }
}

function replacementData(
  staged: ArtImage,
  userId: number,
  savePolicy: ReturnType<typeof readSavePolicy>,
): Prisma.ArtImageUncheckedUpdateInput {
  return {
    imageData: staged.imageData,
    fileName: staged.fileName,
    fileType: staged.fileType,
    cfg: staged.cfg,
    cfgHalf: staged.cfgHalf,
    checkpoint: staged.checkpoint,
    checkpointResourceId: staged.checkpointResourceId,
    designer: savePolicy.designer ?? staged.designer,
    genres: staged.genres,
    negativePrompt: staged.negativePrompt,
    promptString: staged.promptString,
    sampler: staged.sampler,
    seed: staged.seed,
    serverId: staged.serverId,
    serverName: staged.serverName,
    serverUrl: staged.serverUrl,
    steps: staged.steps,
    artPrompt: staged.artPrompt,
    userId,
    ...(typeof savePolicy.isPublic === 'boolean'
      ? { isPublic: savePolicy.isPublic }
      : {}),
    ...(typeof savePolicy.isMature === 'boolean'
      ? { isMature: savePolicy.isMature }
      : {}),
  }
}

function completedPayload(
  payload: Prisma.JsonValue,
  archivedArtImageId: number,
): Prisma.InputJsonValue {
  const next = JSON.parse(JSON.stringify(payload ?? {})) as JsonRecord
  const retry = asRecord(next.retry)
  next.retry = {
    ...retry,
    archivedArtImageId,
    completedAt: new Date().toISOString(),
  }
  return next as Prisma.InputJsonValue
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to complete queued jobs.',
      })
    }

    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid job id.' })
    }

    const body = (await readBody(event)) as CompleteRequestBody | null

    if (typeof body?.success !== 'boolean') {
      throw createError({
        statusCode: 400,
        message: 'Missing required boolean field "success".',
      })
    }

    const job = await prisma.artJob.findUnique({ where: { id } })

    if (!job) {
      throw createError({ statusCode: 404, message: `Job ${id} not found.` })
    }

    if (job.status !== 'RUNNING') {
      throw createError({
        statusCode: 409,
        message: `Job ${id} is ${job.status}, not RUNNING — nothing to complete.`,
      })
    }

    let updated
    let archivedArtImageId: number | null = null
    let replacedArtImageId: number | null = null

    if (body.success) {
      const uploadedArtImageId = Number(body.artImageId)

      if (!Number.isInteger(uploadedArtImageId) || uploadedArtImageId <= 0) {
        throw createError({
          statusCode: 400,
          message:
            'A successful completion requires "artImageId" (upload via /api/art/save-generated first).',
        })
      }

      const retry = readRetry(job.payload)
      const savePolicy = readSavePolicy(job.payload)

      if (retry?.mode === 'OVERWRITE') {
        const targetArtImageId = retry.targetArtImageId

        if (!targetArtImageId) {
          throw createError({
            statusCode: 409,
            message: 'Overwrite retry is missing targetArtImageId.',
          })
        }

        if (targetArtImageId === uploadedArtImageId) {
          throw createError({
            statusCode: 409,
            message: 'Overwrite upload must use a temporary ArtImage row.',
          })
        }

        const result = await prisma.$transaction(async (tx) => {
          const [target, staged] = await Promise.all([
            tx.artImage.findUnique({ where: { id: targetArtImageId } }),
            tx.artImage.findUnique({ where: { id: uploadedArtImageId } }),
          ])

          if (!target) {
            throw createError({
              statusCode: 409,
              message: `Overwrite target ArtImage ${targetArtImageId} no longer exists.`,
            })
          }

          if (!staged) {
            throw createError({
              statusCode: 409,
              message: `Uploaded ArtImage ${uploadedArtImageId} no longer exists.`,
            })
          }

          const archived = await tx.artImage.create({
            data: snapshotData(target),
          })

          // ArtJobs are historical render records. Move every prior job that
          // referenced the canonical id onto the archived snapshot before the
          // canonical row is replaced, keeping trainer feedback tied to its
          // original pixels.
          await tx.artJob.updateMany({
            where: {
              artImageId: targetArtImageId,
              id: { not: id },
            },
            data: { artImageId: archived.id },
          })

          await tx.artImage.update({
            where: { id: targetArtImageId },
            data: replacementData(staged, job.userId, savePolicy),
          })

          const completed = await tx.artJob.update({
            where: { id },
            data: {
              status: 'DONE',
              artImageId: targetArtImageId,
              error: null,
              payload: completedPayload(job.payload, archived.id),
            },
          })

          await tx.artImage.delete({ where: { id: uploadedArtImageId } })

          return { completed, archivedId: archived.id }
        })

        updated = result.completed
        archivedArtImageId = result.archivedId
        replacedArtImageId = targetArtImageId
      } else {
        updated = await prisma.artJob.update({
          where: { id },
          data: {
            status: 'DONE',
            artImageId: uploadedArtImageId,
            error: null,
          },
        })

        await prisma.artImage.update({
          where: { id: uploadedArtImageId },
          data: {
            userId: job.userId,
            ...savePolicy,
          },
        })
      }
    } else {
      const message = String(body.error || 'Generation failed.').slice(0, 4000)
      const exhausted = job.attempts >= MAX_ATTEMPTS

      updated = await prisma.artJob.update({
        where: { id },
        data: {
          status: exhausted ? 'FAILED' : 'PENDING',
          error: message,
          claimedAt: null,
          claimedBy: null,
        },
      })
    }

    return {
      success: true,
      message:
        replacedArtImageId && archivedArtImageId
          ? `Job ${id} replaced ArtImage ${replacedArtImageId}; prior render archived as ArtImage ${archivedArtImageId}.`
          : `Job ${id} → ${updated.status}.`,
      data: {
        job: updated,
        replacedArtImageId,
        archivedArtImageId,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to complete art job.',
      statusCode,
    }
  }
})