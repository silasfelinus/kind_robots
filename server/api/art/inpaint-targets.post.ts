import { randomUUID } from 'node:crypto'
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { authAndGate } from '~/server/utils/comfyGate'
import { requireScopedApiUser } from '~/server/utils/authGuard'
import {
  ART_REQUEST_KEY_REUSABLE_STATUSES,
  artRequestKeyFingerprint,
  normalizeArtRequestKey,
} from '~/server/utils/artRequestKey'
import { serializeArtJobPayload } from '~/server/utils/artJobPayload'
import {
  prepareTargetedEdit,
  type TargetedEditRequest,
} from '~/server/utils/targetedInpaint'
import { DEFAULT_SDXL_CHECKPOINT, sdxlSamplerProfile } from '../comfy/sdxl/utils/workflow'
import { buildSdxlRegionWorkflow } from '../comfy/sdxl/utils/targetedWorkflow'

type InpaintRequest = TargetedEditRequest & {
  engine?: 'sdxl'
  prompt: string
  negativePrompt?: string
  checkpoint?: string
  steps?: number
  cfg?: number
  denoise?: number
  seed?: number
  sampler?: string
  scheduler?: string
  requestKey?: string
  projectSlug?: string
  priority?: number
  designer?: string
  isMature?: boolean
  isPublic?: boolean
  previewOnly?: boolean
}

function bounded(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
  label: string,
): number {
  const result = value ?? fallback
  if (
    typeof result !== 'number' ||
    !Number.isFinite(result) ||
    result < min ||
    result > max
  ) {
    throw createError({
      statusCode: 400,
      message: label + ' must be between ' + min + ' and ' + max + '.',
    })
  }
  return result
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<InpaintRequest>(event)
    await requireScopedApiUser(event, 'generation:art')
    if (!body || (body.engine && body.engine !== 'sdxl')) {
      throw createError({
        statusCode: 400,
        message: 'Targeted inpaint currently supports engine: sdxl.',
      })
    }
    if (body.isPublic === true) {
      throw createError({
        statusCode: 403,
        message: 'Targeted edits remain private until separately published.',
      })
    }
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    if (prompt.length < 8 || prompt.length > 2400) {
      throw createError({
        statusCode: 400,
        message: 'Prompt length must be between 8 and 2400 characters.',
      })
    }
    const checkpoint =
      typeof body.checkpoint === 'string' && body.checkpoint.trim()
        ? body.checkpoint.trim()
        : DEFAULT_SDXL_CHECKPOINT
    if (!checkpoint.endsWith('.safetensors')) {
      throw createError({
        statusCode: 400,
        message: 'SDXL checkpoint must name an installed .safetensors model.',
      })
    }
    const profile = sdxlSamplerProfile(checkpoint)
    const steps = bounded(body.steps, profile.steps, 1, 60, 'steps')
    const cfg = bounded(body.cfg, profile.cfg, 1, 15, 'cfg')
    const denoise = bounded(body.denoise, 0.65, 0.15, 1, 'denoise')
    const priority = bounded(body.priority, 85, 1, 1000, 'priority')
    if (!Number.isInteger(steps) || !Number.isInteger(priority)) {
      throw createError({
        statusCode: 400,
        message: 'steps and priority must be integers.',
      })
    }
    const seed =
      body.seed === undefined
        ? undefined
        : bounded(body.seed, 0, 0, 2_147_483_647, 'seed')
    if (seed !== undefined && !Number.isInteger(seed)) {
      throw createError({
        statusCode: 400,
        message: 'seed must be an integer.',
      })
    }
    const projectSlug = body.projectSlug?.trim().toLowerCase() || null
    if (projectSlug && !/^[a-z0-9][a-z0-9_-]*$/.test(projectSlug)) {
      throw createError({ statusCode: 400, message: 'Invalid projectSlug.' })
    }
    const requestKey = normalizeArtRequestKey(body.requestKey)
    let prepared
    try {
      prepared = await prepareTargetedEdit(body)
    } catch (error) {
      throw createError({
        statusCode: 400,
        message:
          error instanceof Error ? error.message : 'Invalid edit targets.',
      })
    }
    if (body.previewOnly === true) {
      return {
        success: true,
        statusCode: 200,
        data: {
          previewOnly: true,
          mode: prepared.mode,
          crop: prepared.crop,
          width: prepared.originalWidth,
          height: prepared.originalHeight,
          sourceHash: prepared.sourceHash,
          noiseMaskData: prepared.noiseMaskData,
          compositeMaskData: prepared.compositeMaskData,
        },
      }
    }
    const gate = await authAndGate(event, {
      engine: 'comfy',
      steps,
      width: prepared.sampleWidth,
      height: prepared.sampleHeight,
    })
    const fingerprint = requestKey ? artRequestKeyFingerprint(requestKey) : null
    if (fingerprint) {
      const existing = await prisma.artJob.findFirst({
        where: {
          userId: gate.user.id,
          attemptFingerprint: fingerprint,
          status: { in: [...ART_REQUEST_KEY_REUSABLE_STATUSES] },
        },
        select: { id: true, status: true },
      })
      if (existing) {
        return {
          success: true,
          statusCode: 200,
          data: {
            jobId: existing.id,
            status: existing.status,
            deduplicated: true,
          },
        }
      }
    }

    const prefix = 'kr_region_' + randomUUID()
    const sourceName = prefix + '_sample.png'
    const originalName = prefix + '_original.png'
    const noiseMaskName = prefix + '_noise.png'
    const compositeMaskName = prefix + '_blend.png'
    const built = buildSdxlRegionWorkflow({
      prompt,
      negativePrompt: body.negativePrompt,
      checkpoint,
      sourceName,
      originalName,
      noiseMaskName,
      compositeMaskName,
      originalWidth: prepared.originalWidth,
      originalHeight: prepared.originalHeight,
      crop: prepared.crop,
      steps,
      cfg,
      denoise,
      seed,
      sampler: body.sampler ?? profile.sampler,
      scheduler: body.scheduler ?? profile.scheduler,
    })
    const payload = {
      workflow: built.workflow,
      promptString: prompt,
      images: [
        { name: sourceName, imageData: prepared.sampleData },
        { name: originalName, imageData: prepared.originalData },
        { name: noiseMaskName, imageData: prepared.noiseMaskData },
        { name: compositeMaskName, imageData: prepared.compositeMaskData },
      ],
      requestKey,
      regionEdit: {
        version: 1,
        engine: 'sdxl',
        originalSourceSha256: prepared.sourceHash,
        mode: prepared.mode,
        originalSize: [prepared.originalWidth, prepared.originalHeight],
        sampleSize: [prepared.sampleWidth, prepared.sampleHeight],
        crop: prepared.crop,
        targets: prepared.targets,
        steps,
        cfg,
        denoise,
        seed: built.seed,
        checkpoint,
        filenames: {
          sourceName,
          originalName,
          noiseMaskName,
          compositeMaskName,
        },
      },
      save: {
        isPublic: false,
        isMature: body.isMature === true,
        designer: body.designer?.trim() || null,
      },
    }
    const job = await prisma.artJob.create({
      data: {
        engine: 'COMFY',
        userId: gate.user.id,
        projectSlug,
        priority,
        attemptFingerprint: fingerprint,
        payload: serializeArtJobPayload(payload),
      },
    })
    const { balance } = await gate.commit('targeted-inpaint:' + job.id)
    event.node.res.statusCode = 201
    return {
      success: true,
      statusCode: 201,
      data: {
        jobId: job.id,
        status: job.status,
        deduplicated: false,
        sourceHash: prepared.sourceHash,
        crop: prepared.crop,
        mode: prepared.mode,
        mana: { balance, charged: gate.cost },
      },
    }
  } catch (error: unknown) {
    const result = errorHandler(error)
    event.node.res.statusCode = result.statusCode || 500
    return {
      success: false,
      statusCode: result.statusCode || 500,
      message: result.message || 'Failed to enqueue targeted inpainting.',
    }
  }
})
