// /server/api/resources/[id]/generate-preview.post.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import {
  ResourceType,
  SupportedServer,
  type Resource,
} from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireMachineUser } from '~/server/utils/authGuard'
import { manaGate } from '~/server/utils/manaGate'
import { estimateArtCostUsd } from '~/server/utils/manaCost'
import { resourceGallerySelect, resourceGalleryWhere } from '../gallery'
import { effectiveShowMature } from '~/server/utils/contentAccess'
import { buildDefaultComfyWorkflow } from '~/server/api/comfy/sdxl/utils/workflow'

// Resource families the named-checkpoint Comfy graph can load. Named for what
// they are — SD-lineage checkpoints — rather than for the engine that used to
// render them; the engine is Comfy now, the model families are unchanged.
const CHECKPOINT_RESOURCE_FAMILIES: SupportedServer[] = [
  SupportedServer.SD15,
  SupportedServer.SDXL,
  SupportedServer.GENERIC,
  SupportedServer.UNKNOWN,
]

// Preview defaults. SDXL-lineage checkpoints are not distilled, so these are
// ordinary SDXL numbers rather than krea2's 8/1 — but the seed is always random
// (resolved inside the builder), same as every other Comfy lane.
const PREVIEW_STEPS = 24
const PREVIEW_CFG = 6
const PREVIEW_SIZE = 768
const PREVIEW_SAMPLER = 'Euler a'
const PREVIEW_NEGATIVE_PROMPT =
  'low quality, blurry, distorted, cropped, watermark, text, logo'

function cleanModelName(value: string | null | undefined): string {
  return String(value || '').trim()
}

function resourceEngineName(resource: {
  localPath: string | null
  name: string
  customLabel: string | null
}): string {
  return (
    cleanModelName(resource.localPath) ||
    cleanModelName(resource.name) ||
    cleanModelName(resource.customLabel)
  )
}

function buildPreviewPrompt(resource: {
  defaultTrigger: string | null
  triggerWords: string | null
  artPrompt: string | null
  customLabel: string | null
  name: string
}): string {
  const subject =
    cleanModelName(resource.defaultTrigger) ||
    cleanModelName(resource.triggerWords) ||
    cleanModelName(resource.artPrompt) ||
    cleanModelName(resource.customLabel) ||
    cleanModelName(resource.name)

  return `${subject}, polished showcase image, clear subject, balanced composition, detailed, clean background`
}

function checkpointScore(checkpoint: Resource, target: Resource): number {
  let score = 0

  if (
    target.generation &&
    checkpoint.generation?.toLowerCase() === target.generation.toLowerCase()
  ) {
    score += 100
  }

  if (checkpoint.supportedServer === target.supportedServer) score += 30
  if (checkpoint.supportedServer === SupportedServer.SDXL) score += 10
  if (checkpoint.isPublic) score += 2

  return score
}

export default defineEventHandler(async (event) => {
  try {
    const resourceId = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(resourceId) || resourceId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Resource ID.' })
    }

    const auth = await requireMachineUser(event)
    const resource = await prisma.resource.findFirst({
      where: {
        AND: [
          { id: resourceId },
          resourceGalleryWhere({
            userId: auth.user.id,
            isAdmin: auth.isAdmin,
            showMature: effectiveShowMature(auth.user),
          }),
        ],
      },
      select: resourceGallerySelect,
    })

    if (!resource) {
      throw createError({ statusCode: 404, message: 'Resource not found.' })
    }

    const isCheckpoint = resource.resourceType === ResourceType.CHECKPOINT
    const isLora =
      resource.resourceType === ResourceType.LORA ||
      resource.resourceType === ResourceType.LYCORIS

    if (!isCheckpoint && !isLora) {
      throw createError({
        statusCode: 400,
        message:
          'Automatic previews currently support checkpoints, LoRAs, and LyCORIS resources.',
      })
    }

    if (!CHECKPOINT_RESOURCE_FAMILIES.includes(resource.supportedServer)) {
      throw createError({
        statusCode: 409,
        message: `Automatic previews for ${resource.supportedServer} resources need a compatible Comfy workflow. This Resource can still use an uploaded or imported preview.`,
      })
    }

    const checkpointCandidates = isCheckpoint
      ? []
      : await prisma.resource.findMany({
          where: {
            AND: [
              {
                resourceType: ResourceType.CHECKPOINT,
                isActive: true,
                supportedServer: { in: CHECKPOINT_RESOURCE_FAMILIES },
              },
              auth.isAdmin
                ? {}
                : {
                    OR: [{ isPublic: true }, { userId: auth.user.id }],
                  },
            ],
          },
        })
    const checkpoint = isCheckpoint
      ? resource
      : [...checkpointCandidates].sort((a, b) => {
          const scoreDifference =
            checkpointScore(b, resource) - checkpointScore(a, resource)
          return scoreDifference || a.id - b.id
        })[0]

    if (!checkpoint) {
      throw createError({
        statusCode: 409,
        message:
          'No accessible SD-lineage checkpoint is available for this Resource.',
      })
    }

    const checkpointName = resourceEngineName(checkpoint)
    const loraName = isLora ? resourceEngineName(resource) : null

    if (!checkpointName) {
      throw createError({
        statusCode: 409,
        message:
          'The compatible checkpoint does not have an engine filename or name.',
      })
    }

    const promptString = buildPreviewPrompt(resource)
    const attemptFingerprint = `resource-preview:${resource.id}:imagePath`
    const existingPreviewJob = await prisma.artJob.findFirst({
      where: {
        userId: auth.user.id,
        attemptFingerprint,
        status: { in: ['PENDING', 'RUNNING'] },
      },
      orderBy: { createdAt: 'desc' },
    })
    if (existingPreviewJob) {
      event.node.res.statusCode = 200
      return {
        success: true,
        message: `Existing preview generation reused for ${resource.customLabel || resource.name}.`,
        data: {
          jobId: existingPreviewJob.id,
          resourceId: resource.id,
          status: existingPreviewJob.status,
          deduplicated: true,
          mana: { charged: 0 },
        },
        statusCode: 200,
      }
    }

    const estimatedCostUsd = estimateArtCostUsd({
      engine: 'comfy',
      steps: PREVIEW_STEPS,
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
    })
    const gate = await manaGate(event, {
      kind: 'art',
      estCostUsd: estimatedCostUsd,
    })

    // Comfy, not A1111. This endpoint used to create `engine: 'A1111'` rows and
    // every one of them died on a refused connection — nothing on the relay
    // serves A1111 (ArtJob 8116, 2026-08-09, three attempts in two minutes).
    //
    // It does NOT use krea2, which is the default everywhere else. The entire
    // point of this render is to show what THIS checkpoint or LoRA produces, so
    // the resource's own model is the one thing that cannot be swapped for the
    // house default. Comfy's named-checkpoint txt2img graph, with the LoRA wired
    // in when the resource is one, and a random seed so "generate another
    // preview" actually generates another preview.
    const workflow = buildDefaultComfyWorkflow({
      prompt: promptString,
      negativePrompt: PREVIEW_NEGATIVE_PROMPT,
      cfgValue: PREVIEW_CFG,
      steps: PREVIEW_STEPS,
      seed: null,
      checkpoint: checkpointName,
      sampler: PREVIEW_SAMPLER,
      loraName,
      loraStrength: loraName ? 1 : null,
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
      filenamePrefix: 'kindrobots_resource_preview',
    })

    const payload = {
      workflow,
      promptString,
      negativePrompt: PREVIEW_NEGATIVE_PROMPT,
      steps: PREVIEW_STEPS,
      cfg: PREVIEW_CFG,
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
      sampler: PREVIEW_SAMPLER,
      checkpoint: checkpointName,
      ...(loraName ? { loraName, loraStrength: 1 } : {}),
      save: {
        isPublic: resource.isPublic,
        isMature: resource.isMature,
        designer:
          auth.user.designerName ||
          auth.user.username ||
          `User ${auth.user.id}`,
      },
      resources: {
        checkpointResourceId: checkpoint.id,
        loraResourceIds: isLora ? [resource.id] : [],
        checkpointName,
        loraNames: loraName ? [loraName] : [],
      },
      previewResourceId: resource.id,
      /*
       * Without this the render was queued and then went nowhere: nothing read
       * previewResourceId on completion (only preview-job/[jobId].get.ts does,
       * and only to check ownership while polling), so the finished ArtImage was
       * never attached to the Resource that asked for it. That is why zero of
       * the 2,228 catalogued LoRAs carried a preview of their own while this
       * endpoint had been shipping for weeks -- the loop was open at the far end.
       *
       * art/queue/[id]/complete.post.ts reads payload.entityArt regardless of
       * how the job was created, so declaring it here routes the result through
       * applyEntityArtCompletion, which sets Resource.artImageId + imagePath and
       * copies isMature/isPublic from the Resource onto the ArtImage. Declaring
       * it also arms expectsEntityArtCompletion, so a failed attachment rolls the
       * completion back instead of marking the job DONE over an unchanged row.
       */
      entityArt: {
        entityType: 'resource',
        entityId: resource.id,
        field: 'imagePath',
        mode: 'recreate',
        preserveOriginal: true,
      },
      attemptFingerprint,
    }

    const job = await prisma.artJob.create({
      data: {
        engine: 'COMFY',
        payload: JSON.stringify(payload),
        attemptFingerprint,
        priority: 1,
        projectSlug: 'resource-previews',
        userId: gate.user.id,
      },
    })

    const { balance } = await gate.commit(`resource-preview:${job.id}`)

    event.node.res.statusCode = 201
    return {
      success: true,
      message: `Preview generation queued for ${resource.customLabel || resource.name}.`,
      data: {
        jobId: job.id,
        resourceId: resource.id,
        status: job.status,
        deduplicated: false,
        promptString,
        checkpointResourceId: checkpoint.id,
        loraResourceIds: isLora ? [resource.id] : [],
        mana: { balance, charged: gate.cost },
      },
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to queue Resource preview.',
      data: null,
      statusCode,
    }
  }
})
