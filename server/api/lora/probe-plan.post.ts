// /server/api/lora/probe-plan.post.ts
//
// Resolves the render plan for LoRA preview probes without enqueuing anything.
//
// Every LoRA in the catalog is currently previewed by a hotlink to a third
// party (Civitai, and 163 rows to img.genur.art, whose DNS record is gone), and
// none has a generated image of its own. This endpoint answers "what would we
// render, on which base, with which prompt" for a set of LoRAs, and the caller
// then posts each plan to /api/art/enqueue. Splitting it this way keeps the
// family/checkpoint/prompt mapping server-side and testable while reusing the
// existing enqueue path for gating, workflow building and queueing rather than
// duplicating any of it.
import { defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireAdminApiUser } from '../../utils/authGuard'
import {
  buildLoraProbePrompt,
  classifyLoraFamily,
  hasBlindPreview,
  LORA_PROBE_RECIPES,
  probeTriggerText,
  selectProbeCheckpoint,
  type LoraProbeFamily,
  type ProbeCheckpointCandidate,
} from '~/utils/loraProbe'

type ProbePlanRequest = {
  scope?: 'blind' | 'ids' | null
  resourceIds?: number[] | null
  limit?: number | null
}

const DEFAULT_LIMIT = 250
const MAX_LIMIT = 2500

function normalizeIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  const ids = value
    .map((entry) => Number(entry))
    .filter((id) => Number.isInteger(id) && id > 0)
  return [...new Set(ids)]
}

function skipReason(family: LoraProbeFamily): string {
  if (family === 'unsupported') {
    return 'No still-image probe recipe for this base model (SD 2.1, Kontext, video and audio bases have no text-to-image lane here).'
  }
  return `No ${family} checkpoint is registered to render against.`
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const body = (await readBody(event)) as ProbePlanRequest | null
    const scope = body?.scope === 'ids' ? 'ids' : 'blind'
    const requestedIds = normalizeIds(body?.resourceIds)
    const limit = Math.min(
      Math.max(Number(body?.limit) || DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    )

    const loras = await prisma.resource.findMany({
      where: {
        isActive: true,
        resourceType: { in: ['LORA', 'LYCORIS'] },
        ...(scope === 'ids' && requestedIds.length
          ? { id: { in: requestedIds } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        customLabel: true,
        generation: true,
        supportedServer: true,
        isMature: true,
        defaultTrigger: true,
        triggerWords: true,
        artImageId: true,
        imagePath: true,
        previewImageUrl: true,
      },
      orderBy: { id: 'asc' },
    })

    const checkpointRows = await prisma.resource.findMany({
      where: { isActive: true, resourceType: 'CHECKPOINT' },
      select: {
        id: true,
        name: true,
        localPath: true,
        generation: true,
        isMature: true,
      },
    })
    const checkpoints: ProbeCheckpointCandidate[] = checkpointRows.map(
      (row) => ({
        id: row.id,
        name: row.name,
        localPath: row.localPath,
        generation: row.generation,
        isMature: Boolean(row.isMature),
      }),
    )

    const candidates =
      scope === 'blind' ? loras.filter((lora) => hasBlindPreview(lora)) : loras

    const plans: Array<Record<string, unknown>> = []
    const skipped: Array<Record<string, unknown>> = []

    for (const lora of candidates) {
      if (plans.length >= limit) break

      const label = lora.customLabel || lora.name
      const family = classifyLoraFamily(lora.generation, lora.supportedServer)
      const checkpoint = selectProbeCheckpoint(
        family,
        Boolean(lora.isMature),
        checkpoints,
      )
      const prompt = buildLoraProbePrompt(family, probeTriggerText(lora))
      const recipe =
        family === 'unsupported' ? null : LORA_PROBE_RECIPES[family]

      /*
       * A missing checkpoint only disqualifies a lane that needs one. The flux
       * builder resolves its own UNet and never reads `checkpoint`, so
       * selectProbeCheckpoint returns null for it by design rather than by
       * failure -- treating that as "no base available" would skip every Flux
       * LoRA in the catalog.
       */
      const needsCheckpoint = recipe?.basePolicy === 'catalog-checkpoint'

      if (!prompt || !recipe || (needsCheckpoint && !checkpoint)) {
        skipped.push({
          resourceId: lora.id,
          label,
          family,
          generation: lora.generation,
          reason: skipReason(family),
        })
        continue
      }

      plans.push({
        resourceId: lora.id,
        label,
        family,
        isMature: Boolean(lora.isMature),
        checkpoint: checkpoint
          ? {
              id: checkpoint.id,
              name: checkpoint.name,
              localPath: checkpoint.localPath,
              isMature: checkpoint.isMature,
            }
          : null,
        // Posted to /api/art/enqueue verbatim by the caller.
        enqueue: {
          engine: recipe.engine,
          promptString: prompt.prompt,
          negativePrompt: prompt.negativePrompt || null,
          ...(checkpoint
            ? {
                checkpoint: checkpoint.localPath,
                checkpointResourceId: checkpoint.id,
              }
            : {}),
          loras: [{ resourceId: lora.id, strength: recipe.loraStrength }],
          width: recipe.width,
          height: recipe.height,
          isMature: Boolean(lora.isMature),
          isPublic: false,
          entityArt: {
            entityType: 'resource',
            entityId: lora.id,
            field: 'imagePath',
            mode: 'recreate',
            preserveOriginal: true,
          },
        },
      })
    }

    /*
     * Flux last (Silas, 2026-09-15). The queue drains one job at a time, and a
     * Flux render measured 25+ minutes against ~13 for the comfy lane, so a
     * Flux job sitting mid-queue stalls everything behind it. Ordering them to
     * the tail lets the 191 comfy-lane previews land first and the slow ones
     * trickle in behind, rather than dropping them.
     */
    plans.sort((a, b) => {
      const rank = (plan: Record<string, unknown>) =>
        plan.family === 'flux' ? 1 : 0
      return rank(a) - rank(b)
    })

    return {
      success: true,
      message: `Planned ${plans.length} LoRA preview probe(s).`,
      data: {
        scope,
        considered: candidates.length,
        plans,
        skipped,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success,
      message: message || 'Failed to plan LoRA preview probes.',
      data: null,
      statusCode: statusCode || 500,
    }
  }
})
