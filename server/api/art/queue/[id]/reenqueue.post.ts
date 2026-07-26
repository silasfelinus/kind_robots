// /server/api/art/queue/[id]/reenqueue.post.ts
import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
} from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireMachineUser } from '../../../../utils/authGuard'
import {
  decodeArtJobPayload,
  serializeArtJobPayload,
} from '../../../../utils/artJobPayload'
import {
  applyArtJobOverrides,
  ART_JOB_RETRY_MODES,
  prepareArtJobRetryPayload,
  type ArtJobOverrides,
  type ArtJobRetryMode,
} from '../../../../utils/artJobRetry'
import {
  applyArtFacetsToPayload,
  readArtFacetIds,
  resolveArtFacetSelection,
} from '../../../../utils/artFacetSelection'
import { assessArtPrompt, cleanArtPrompt } from '../../../../utils/artPromptQuality'
import {
  buildWorkflowForEngine,
  extractRenderRequest,
  resolvePresetEngine,
} from '../../../comfy/utils/engineWorkflow'

type ReenqueueBody = {
  mode?: string | null
  refreshSeed?: boolean
  preset?: string | null
  overrides?: ArtJobOverrides | null
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to re-enqueue jobs.',
      })
    }

    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid job id.' })
    }

    const body = (await readBody(event).catch(() => null)) as ReenqueueBody | null
    const mode = String(body?.mode || 'NEW_OUTPUT').toUpperCase() as ArtJobRetryMode
    const hasSeedOverride =
      typeof body?.overrides?.seed === 'number' &&
      Number.isFinite(body.overrides.seed)
    const refreshSeed = body?.refreshSeed !== false && !hasSeedOverride

    if (!ART_JOB_RETRY_MODES.has(mode)) {
      throw createError({
        statusCode: 400,
        message: 'mode must be NEW_OUTPUT or OVERWRITE.',
      })
    }

    const source = await prisma.artJob.findUnique({ where: { id } })
    if (!source) {
      throw createError({ statusCode: 404, message: `Job ${id} not found.` })
    }

    if (mode === 'OVERWRITE') {
      if (source.status !== 'DONE' || !source.artImageId) {
        throw createError({
          statusCode: 409,
          message:
            'Overwrite retries require a completed source job with an ArtImage.',
        })
      }
      const target = await prisma.artImage.findUnique({
        where: { id: source.artImageId },
        select: { id: true },
      })
      if (!target) {
        throw createError({
          statusCode: 409,
          message: `ArtImage ${source.artImageId} no longer exists.`,
        })
      }
    }

    const prepared = prepareArtJobRetryPayload(
      source.payload,
      source.id,
      source.artImageId,
      mode,
      refreshSeed,
    )
    const sourceRequest = extractRenderRequest(prepared)
    const currentBasePrompt = cleanArtPrompt(prepared.basePromptString)
    const requestedBasePrompt = cleanArtPrompt(
      body?.overrides?.basePromptString ?? body?.overrides?.promptString,
    )
    const basePrompt = requestedBasePrompt || currentBasePrompt || sourceRequest.prompt
    const hasFacetOverride = Array.isArray(body?.overrides?.facetIds)
    const facetIds = hasFacetOverride
      ? body?.overrides?.facetIds
      : readArtFacetIds(prepared)
    const facets = await resolveArtFacetSelection({
      facetIds,
      userId: auth.user.id,
      isAdmin: auth.isAdmin,
      includeMature: true,
    })
    const previewPayload: Record<string, unknown> = {}
    const effectivePrompt = applyArtFacetsToPayload(
      previewPayload,
      basePrompt,
      facets,
    )
    const promptAssessment = assessArtPrompt(effectivePrompt)
    if (!promptAssessment.useful) {
      throw createError({
        statusCode: 422,
        message: `Retry blocked because the prompt is not usable (${promptAssessment.reasons.join(', ')}). Supply a specific prompt instead.`,
      })
    }

    const presetEngine = resolvePresetEngine(body?.preset)
    if (presetEngine) {
      prepared.workflow = buildWorkflowForEngine(presetEngine, {
        ...sourceRequest,
        prompt: effectivePrompt,
      })
      prepared.promptString = effectivePrompt
    }

    const renderOverrides: ArtJobOverrides = {
      ...body?.overrides,
      promptString: effectivePrompt,
    }
    delete renderOverrides.facetIds
    delete renderOverrides.basePromptString
    const payload = applyArtJobOverrides(prepared, renderOverrides)
    applyArtFacetsToPayload(payload, basePrompt, facets)
    const jobEngine = presetEngine ? 'COMFY' : source.engine

    const job = await prisma.artJob.create({
      data: {
        engine: jobEngine,
        payload: serializeArtJobPayload(payload),
        priority: source.priority,
        projectSlug: source.projectSlug,
        projectId: source.projectId,
        userId: source.userId,
      },
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      message:
        mode === 'OVERWRITE'
          ? `Queued job ${job.id} to replace ArtImage ${source.artImageId}.`
          : `Re-enqueued job ${id} as new-output job ${job.id}.`,
      data: {
        job: decodeArtJobPayload(job),
        sourceJobId: id,
        mode,
        targetArtImageId: mode === 'OVERWRITE' ? source.artImageId : null,
      },
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to re-enqueue art job.',
      statusCode: event.node.res.statusCode,
    }
  }
})
