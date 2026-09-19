// /server/api/admin/art-archive/entries/[id]/enqueue.post.ts
//
// Admin-only "apply preset" action for one ArchiveEntry (art-archive/t-016):
// builds a normal durable ArtJob from the entry's imported ArtImage
// (prompt/settings/resource provenance) merged with the chosen
// ArchiveActionPreset, and queues it through the same ArtJob table every
// other engine uses. Imported ArtImages have no original ArtJob to re-run,
// so this is the adapter t-015's curation board deferred to rather than
// inventing a second render queue.
//
// This endpoint only ever creates a new ArtJob/ArtImage -- it never touches
// the entry's existing file or its isActive/quarantine state. The task's own
// "replacement must not remove the source file until a new ArtImage is
// delivered and verified" is satisfied by that omission: an admin reviews
// the resulting render and only then uses the existing, separate quarantine
// action (art-archive/t-009) once satisfied.
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { viewerShowsMature } from '~/server/utils/contentAccess'
import {
  ARCHIVE_PRESET_ACTION_TYPES,
  validateArchivePresetModifiers,
  type ArchivePresetActionType,
} from '~/server/utils/artArchivePresetModifiers'
import {
  ArchiveEnqueueError,
  buildArchiveEnqueuePayload,
} from '~/server/utils/buildArchiveEnqueuePayload'

type EnqueueBody = { presetId?: number }

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    if (!viewerShowsMature(auth.user)) {
      throw createError({
        statusCode: 403,
        message: 'Mature-content access is required for Art Archive entries.',
      })
    }

    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid archive entry id.' })
    }

    const body = await readBody<EnqueueBody>(event)
    const presetId = Number(body?.presetId)
    if (!Number.isInteger(presetId) || presetId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid or missing "presetId".' })
    }

    const entry = await prisma.archiveEntry.findUnique({
      where: { id },
      select: { id: true, artImageId: true },
    })
    if (!entry) {
      throw createError({ statusCode: 404, message: `Archive entry #${id} not found.` })
    }
    if (!entry.artImageId) {
      throw createError({
        statusCode: 400,
        message: `Archive entry #${id} has no imported ArtImage to build a job from.`,
      })
    }

    const [artImage, preset] = await Promise.all([
      prisma.artImage.findUnique({
        where: { id: entry.artImageId },
        select: {
          promptString: true,
          negativePrompt: true,
          checkpoint: true,
          checkpointResourceId: true,
          cfg: true,
          cfgHalf: true,
          sampler: true,
          seed: true,
          steps: true,
          isPublic: true,
          isMature: true,
          designer: true,
        },
      }),
      prisma.archiveActionPreset.findUnique({ where: { id: presetId } }),
    ])
    if (!artImage) {
      throw createError({
        statusCode: 404,
        message: `Archive entry #${id}'s linked ArtImage #${entry.artImageId} was not found.`,
      })
    }
    if (!preset || !preset.isActive) {
      throw createError({ statusCode: 404, message: `Archive action preset #${presetId} not found.` })
    }
    if (!(ARCHIVE_PRESET_ACTION_TYPES as string[]).includes(preset.actionType)) {
      throw createError({ statusCode: 500, message: `Preset #${presetId} has an unsupported actionType.` })
    }

    const actionType = preset.actionType as ArchivePresetActionType
    const modifiers = JSON.parse(preset.modifiers) as Record<string, unknown>
    const validation = validateArchivePresetModifiers(actionType, modifiers)
    if (!validation.valid) {
      throw createError({
        statusCode: 500,
        message: `Preset #${presetId}'s stored modifiers are no longer valid: ${validation.errors.join(' ')}`,
      })
    }

    let payload
    try {
      payload = buildArchiveEnqueuePayload({
        archiveEntryId: entry.id,
        presetId: preset.id,
        actionType,
        modifiers,
        artImage,
      })
    } catch (buildError) {
      if (buildError instanceof ArchiveEnqueueError) {
        throw createError({ statusCode: 400, message: buildError.message })
      }
      throw buildError
    }

    const job = await prisma.artJob.create({
      data: {
        engine: 'A1111',
        payload: JSON.stringify(payload),
        priority: 150,
        projectSlug: 'art-archive',
        userId: auth.user.id,
      },
      select: { id: true, status: true },
    })

    return {
      success: true,
      message: `Queued ArtJob #${job.id} (${actionType}) for archive entry #${id}. Poll /api/art/queue/${job.id} until DONE.`,
      data: { jobId: job.id, status: job.status, actionType },
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to queue archive preset job.',
      statusCode,
    }
  }
})
